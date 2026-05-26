import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '../prisma.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';

const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
  name: z.string().min(1).max(100),
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER']),
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER']).optional(),
  active: z.boolean().optional(),
  password: z.string().min(6).max(100).optional(),
});

export const userRouter = Router();
userRouter.use(authMiddleware);

userRouter.get('/', requireRole('ADMIN', 'MANAGER'), async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, name: true, role: true, active: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

userRouter.get('/:id', requireRole('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, name: true, role: true, active: true, createdAt: true },
    });
    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

userRouter.post('/', requireRole('ADMIN'), validate(createUserSchema), async (req, res, next) => {
  try {
    const { username, password, name, role } = req.body;
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) throw new AppError('CONFLICT', 'Username already taken', 409);

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { username, password: hashed, name, role },
      select: { id: true, username: true, name: true, role: true, active: true },
    });
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

userRouter.put('/:id', requireRole('ADMIN'), validate(updateUserSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new AppError('NOT_FOUND', 'User not found', 404);

    const data: any = { ...req.body };
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, name: true, role: true, active: true },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

userRouter.delete('/:id', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new AppError('NOT_FOUND', 'User not found', 404);
    if (existing.id === req.user!.userId) {
      throw new AppError('FORBIDDEN', 'Cannot deactivate yourself', 403);
    }

    await prisma.user.update({
      where: { id },
      data: { active: false },
    });
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});
