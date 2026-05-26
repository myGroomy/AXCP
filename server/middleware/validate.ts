import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { AppError } from './errorHandler.js';

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
        400,
      );
    }
    req.body = result.data;
    next();
  };
}
