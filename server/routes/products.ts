import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';

const variantSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
  priceOverride: z.number().nullable().optional(),
  stock: z.number().int().default(0),
});

const productSchema = z.object({
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  price: z.number().positive(),
  costPrice: z.number().nullable().optional(),
  categoryId: z.number().nullable().optional(),
  image: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  variants: z.array(variantSchema).optional(),
});

export const productRouter = Router();
productRouter.use(authMiddleware);

productRouter.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const search = String(req.query.search || '');
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;

    const where: any = { active: true };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { variants: true, category: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

productRouter.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const product = await prisma.product.findUnique({
      where: { id },
      include: { variants: true, category: true },
    });
    if (!product) throw new AppError('NOT_FOUND', 'Product not found', 404);
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

productRouter.get('/barcode/:barcode', async (req, res, next) => {
  try {
    const product = await prisma.product.findFirst({
      where: { barcode: req.params.barcode, active: true },
      include: { variants: true, category: true },
    });
    if (!product) throw new AppError('NOT_FOUND', 'Product not found', 404);
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

productRouter.post('/', requireRole('ADMIN', 'MANAGER'), validate(productSchema), async (req, res, next) => {
  try {
    const { variants, ...data } = req.body;
    const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (existing) throw new AppError('CONFLICT', 'SKU already exists', 409);

    const product = await prisma.product.create({
      data: {
        ...data,
        variants: variants?.length
          ? { create: variants }
          : undefined,
      },
      include: { variants: true, category: true },
    });
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

productRouter.put('/:id', requireRole('ADMIN', 'MANAGER'), validate(productSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new AppError('NOT_FOUND', 'Product not found', 404);

    const { variants, ...data } = req.body;

    const product = await prisma.$transaction(async (tx) => {
      if (variants) {
        await tx.productVariant.deleteMany({ where: { productId: id } });
        if (variants.length > 0) {
          await tx.productVariant.createMany({
            data: variants.map((v: any) => ({ ...v, productId: id })),
          });
        }
      }
      return tx.product.update({
        where: { id },
        data,
        include: { variants: true, category: true },
      });
    });
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

productRouter.delete('/:id', requireRole('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new AppError('NOT_FOUND', 'Product not found', 404);

    await prisma.product.update({
      where: { id },
      data: { active: false },
    });
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});
