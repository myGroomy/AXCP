import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';

const supplierSchema = z.object({
  name: z.string().min(1).max(200),
  contactPerson: z.string().max(100).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  email: z.string().email().max(100).nullable().optional().or(z.literal('')),
  address: z.string().max(500).nullable().optional(),
  taxId: z.string().max(50).nullable().optional(),
});

export const supplierRouter = Router();
supplierRouter.use(authMiddleware);

supplierRouter.get('/', async (_req, res, next) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: suppliers });
  } catch (err) {
    next(err);
  }
});

supplierRouter.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) throw new AppError('NOT_FOUND', 'Supplier not found', 404);
    res.json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
});

supplierRouter.post('/', validate(supplierSchema), async (req, res, next) => {
  try {
    const supplier = await prisma.supplier.create({ data: req.body });
    res.status(201).json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
});

supplierRouter.put('/:id', validate(supplierSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.supplier.findUnique({ where: { id } });
    if (!existing) throw new AppError('NOT_FOUND', 'Supplier not found', 404);

    const supplier = await prisma.supplier.update({ where: { id }, data: req.body });
    res.json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
});

supplierRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const poCount = await prisma.purchaseOrder.count({ where: { supplierId: id } });
    if (poCount > 0) {
      throw new AppError('CONFLICT', 'Cannot delete supplier with purchase orders', 409);
    }
    await prisma.supplier.delete({ where: { id } });
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});
