import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';
import { StockService } from '../services/stockService.js';

const saleItemSchema = z.object({
  productId: z.number(),
  variantId: z.number().nullable().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  discount: z.number().min(0).default(0),
});

const saleSchema = z.object({
  items: z.array(saleItemSchema).min(1),
  subtotal: z.number().positive(),
  tax: z.number().default(0),
  discount: z.number().min(0).default(0),
  total: z.number().positive(),
  paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER', 'MIXED']),
  notes: z.string().nullable().optional(),
  customerId: z.number().nullable().optional(),
});

function generateInvoiceNo(): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `INV-${y}${m}${d}-${r}`;
}

export const saleRouter = Router();
saleRouter.use(authMiddleware);

saleRouter.post('/', validate(saleSchema), async (req, res, next) => {
  try {
    const { items, subtotal, tax, discount, total, paymentMethod, notes, customerId } =
      req.body;
    const userId = req.user!.userId;

    // Validate stock availability before processing sale
    const stockValidation = await StockService.validateCart(items);
    if (!stockValidation.valid) {
      throw new AppError(
        'CONFLICT',
        `Stock validation failed: ${stockValidation.errors.join(', ')}`,
        409
      );
    }

    const invoiceNo = generateInvoiceNo();

    const sale = await prisma.$transaction(async (tx) => {
      // Update stock using the StockService for consistency
      await StockService.updateStockAfterSale(items);

      // Create stock movement records
      for (const item of items) {
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            variantId: item.variantId ?? null,
            type: 'OUT',
            quantity: -item.quantity,
            reason: 'Sale',
            userId,
          },
        });
      }

      return tx.sale.create({
        data: {
          invoiceNo,
          subtotal,
          tax,
          discount,
          total,
          paymentMethod,
          notes,
          userId,
          customerId,
          items: {
            create: items.map((i: any) => ({
              productId: i.productId,
              variantId: i.variantId ?? null,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              discount: i.discount,
              total: i.quantity * i.unitPrice - i.discount,
            })),
          },
        },
        include: {
          items: { include: { product: true, variant: true } },
          user: { select: { name: true, username: true } },
          customer: true,
        },
      });
    });

    res.status(201).json({ success: true, data: sale });
  } catch (err) {
    next(err);
  }
});

saleRouter.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const dateFrom = req.query.dateFrom ? new Date(String(req.query.dateFrom)) : undefined;
    const dateTo = req.query.dateTo ? new Date(String(req.query.dateTo)) : undefined;

    const where: any = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          items: { include: { product: true } },
          user: { select: { name: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sale.count({ where }),
    ]);

    res.json({
      success: true,
      data: sales,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

saleRouter.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        items: { include: { product: true, variant: true } },
        user: { select: { name: true, username: true } },
        customer: true,
      },
    });
    if (!sale) throw new AppError('NOT_FOUND', 'Sale not found', 404);
    res.json({ success: true, data: sale });
  } catch (err) {
    next(err);
  }
});

saleRouter.post('/:id/return', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!sale) throw new AppError('NOT_FOUND', 'Sale not found', 404);
    if (sale.status === 'REFUNDED') {
      throw new AppError('CONFLICT', 'Sale already refunded', 409);
    }

    const userId = req.user!.userId;

    await prisma.$transaction(async (tx) => {
      for (const item of sale.items) {
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
            reason: 'Return',
            userId,
          },
        });
      }

      await tx.sale.update({
        where: { id },
        data: { status: 'REFUNDED' },
      });
    });

    const updated = await prisma.sale.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        user: { select: { name: true } },
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});
