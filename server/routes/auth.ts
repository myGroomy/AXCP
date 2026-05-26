import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../prisma.js';
import { validate } from '../middleware/validate.js';
import { authMiddleware } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

import { JWT_SECRET } from '../middleware/auth.js';

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? '15m') as string;
const JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as string;

const loginSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(1).max(100),
});

const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
  name: z.string().min(1).max(100),
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER']).default('CASHIER'),
});

export const authRouter = Router();

authRouter.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !user.active) {
      throw new AppError('UNAUTHORIZED', 'Invalid credentials', 401);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new AppError('UNAUTHORIZED', 'Invalid credentials', 401);
    }

    const payload = { userId: user.id, role: user.role, username: user.username };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
    const refreshToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions);

    res.json({
      success: true,
      data: {
        token,
        refreshToken,
        user: { id: user.id, username: user.username, name: user.name, role: user.role },
      },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError('UNAUTHORIZED', 'Refresh token required', 401);
    }

    const payload = jwt.verify(refreshToken, JWT_SECRET) as {
      userId: number;
      role: string;
      username: string;
    };

    const token = jwt.sign(
      { userId: payload.userId, role: payload.role, username: payload.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions,
    );

    res.json({ success: true, data: { token } });
  } catch (err) {
    next(new AppError('UNAUTHORIZED', 'Invalid refresh token', 401));
  }
});

authRouter.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, username: true, name: true, role: true, active: true },
    });
    if (!user) {
      throw new AppError('NOT_FOUND', 'User not found', 404);
    }
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

authRouter.post(
  '/users',
  authMiddleware,
  validate(createUserSchema),
  async (req, res, next) => {
    try {
      if (req.user!.role !== 'ADMIN') {
        throw new AppError('FORBIDDEN', 'Only admins can create users', 403);
      }

      const { username, password, name, role } = req.body;
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing) {
        throw new AppError('CONFLICT', 'Username already taken', 409);
      }

      const hashed = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: { username, password: hashed, name, role },
        select: { id: true, username: true, name: true, role: true, active: true },
      });

      res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },
);
