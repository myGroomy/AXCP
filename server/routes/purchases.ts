import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';

const poItemSchema = z.object({
  productId: z.number(),
  variantId: z.number().nullable().optional(),
  quantity: z.number().int().positive(),
  unitCost: z.number().positive(),
});

const poSchema = z.object({
  supplierId: z.number(),
  notes: z.string().max(1000).nullable().optional(),
  items: z.array(poItemSchema).min(1),
});

function generatePONumber(): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PO-${y}${m}-${r}`;
}

export const purchaseRouter = Router();
purchaseRouter.use(authMiddleware);

purchaseRouter.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const status = req.query.status ? String(req.query.status) : undefined;

    const where: any = {};
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: { select: { name: true } },
          user: { select: { name: true } },
          items: { include: { product: { select: { name: true, sku: true } } } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

purchaseRouter.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        user: { select: { name: true } },
        items: { include: { product: true, variant: true } },
      },
    });
    if (!order) throw new AppError('NOT_FOUND', 'Purchase order not found', 404);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

purchaseRouter.post('/', validate(poSchema), async (req, res, next) => {
  try {
    const { supplierId, notes, items } = req.body;
    const userId = req.user!.userId;
    const poNumber = generatePONumber();

    const total = items.reduce((sum: number, i: any) => sum + i.quantity * i.unitCost, 0);

    const order = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId,
        userId,
        notes,
        total,
        status: 'DRAFT',
        items: {
          create: items.map((i: any) => ({
            productId: i.productId,
            variantId: i.variantId ?? null,
            quantity: i.quantity,
            unitCost: i.unitCost,
            total: i.quantity * i.unitCost,
          })),
        },
      },
      include: {
        supplier: { select: { name: true } },
        items: { include: { product: { select: { name: true, sku: true } } } },
      },
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

purchaseRouter.put('/:id/status', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    const validStatuses = ['DRAFT', 'SENT', 'PARTIAL', 'RECEIVED', 'CANCELLED'];

    if (!validStatuses.includes(status)) {
      throw new AppError('VALIDATION_ERROR', `Invalid status: ${status}`, 400);
    }

    const order = await prisma.purchaseOrder.update({
      where: { id },
      data: { status },
      include: {
        supplier: { select: { name: true } },
        items: { include: { product: { select: { name: true, sku: true } } } },
      },
    });

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

purchaseRouter.post('/:id/receive', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) throw new AppError('NOT_FOUND', 'Purchase order not found', 404);
    if (order.status === 'RECEIVED' || order.status === 'CANCELLED') {
      throw new AppError('CONFLICT', `Cannot receive order with status ${order.status}`, 409);
    }

    const userId = req.user!.userId;

    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            variantId: item.variantId,
            type: 'IN',
            quantity: item.quantity,
            reason: `PO ${order.poNumber}`,
            userId,
          },
        });

        await tx.pOItem.update({
          where: { id: item.id },
          data: { received: item.quantity },
        });
      }

      await tx.purchaseOrder.update({
        where: { id },
        data: { status: 'RECEIVED' },
      });
    });

    const updated = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: { select: { name: true } },
        items: { include: { product: { select: { name: true, sku: true } } } },
        user: { select: { name: true } },
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});
