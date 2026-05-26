import { Router } from 'express';
import { z } from 'zod';
import { StockService } from '../services/stockService';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';

const checkStockSchema = z.object({
  productId: z.number().int().positive(),
  variantId: z.number().int().positive().optional(),
  quantity: z.number().int().positive(),
});

const validateCartSchema = z.object({
  items: z.array(z.object({
    productId: z.number().int().positive(),
    variantId: z.number().int().positive().optional(),
    quantity: z.number().int().positive(),
  })),
});

const stockLevelsSchema = z.object({
  items: z.array(z.object({
    productId: z.number().int().positive(),
    variantId: z.number().int().positive().optional(),
  })),
});

export const stockRouter = Router();
stockRouter.use(authMiddleware);

// Check stock for a single product/variant
stockRouter.post('/check', validate(checkStockSchema), async (req, res, next) => {
  try {
    const { productId, variantId, quantity } = req.body;
    
    const result = await StockService.checkStock(productId, quantity, variantId);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// Validate entire cart for stock availability
stockRouter.post('/validate-cart', validate(validateCartSchema), async (req, res, next) => {
  try {
    const { items } = req.body;
    
    const validation = await StockService.validateCart(items);
    
    res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    next(error);
  }
});

// Get current stock levels for multiple items
stockRouter.post('/levels', validate(stockLevelsSchema), async (req, res, next) => {
  try {
    const { items } = req.body;
    
    const stockLevels = await StockService.getStockLevels(items);
    
    res.json({
      success: true,
      data: stockLevels,
    });
  } catch (error) {
    next(error);
  }
});

// Get low stock alerts
stockRouter.get('/alerts', async (req, res, next) => {
  try {
    const threshold = req.query.threshold ? Number(req.query.threshold) : 10;
    
    const alerts = await StockService.getLowStockAlerts(threshold);
    
    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
});

// Get real-time stock for a product (used for live updates)
stockRouter.get('/product/:id', async (req, res, next) => {
  try {
    const productId = Number(req.params.id);
    const variantId = req.query.variantId ? Number(req.query.variantId) : undefined;
    
    const stockLevels = await StockService.getStockLevels([{ productId, variantId }]);
    
    if (stockLevels.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }
    
    res.json({
      success: true,
      data: stockLevels[0],
    });
  } catch (error) {
    next(error);
  }
});