import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';

const categorySchema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.number().nullable().optional(),
  description: z.string().max(500).nullable().optional(),
});

export const categoryRouter = Router();
categoryRouter.use(authMiddleware);

categoryRouter.get('/', async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: { children: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
});

categoryRouter.get('/tree', async (_req, res, next) => {
  try {
    const all = await prisma.category.findMany({
      include: { children: { include: { children: true } } },
      orderBy: { name: 'asc' },
    });
    const roots = all.filter((c) => !c.parentId);
    res.json({ success: true, data: roots });
  } catch (err) {
    next(err);
  }
});

categoryRouter.post('/', validate(categorySchema), async (req, res, next) => {
  try {
    const category = await prisma.category.create({ data: req.body });
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
});

categoryRouter.put('/:id', validate(categorySchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw new AppError('NOT_FOUND', 'Category not found', 404);

    const category = await prisma.category.update({
      where: { id },
      data: req.body,
    });
    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
});

categoryRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      throw new AppError('CONFLICT', 'Cannot delete category with products', 409);
    }
    await prisma.category.delete({ where: { id } });
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});
