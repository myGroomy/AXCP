import prisma from '../prisma';
import { AppError } from '../middleware/errorHandler';

export interface StockCheckResult {
  available: boolean;
  currentStock: number;
  requestedQuantity: number;
  productId: number;
  variantId?: number;
}

export interface CartValidationResult {
  valid: boolean;
  errors: string[];
  stockIssues: Array<{
    productId: number;
    variantId?: number;
    productName: string;
    variantName?: string;
    available: number;
    requested: number;
  }>;
}

export class StockService {
  /**
   * Check if sufficient stock is available for a product or variant
   */
  static async checkStock(
    productId: number,
    quantity: number,
    variantId?: number
  ): Promise<StockCheckResult> {
    if (variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        include: { product: { select: { name: true } } },
      });

      if (!variant) {
        throw new AppError('NOT_FOUND', 'Product variant not found', 404);
      }

      return {
        available: variant.stock >= quantity,
        currentStock: variant.stock,
        requestedQuantity: quantity,
        productId,
        variantId,
      };
    } else {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { stock: true, name: true },
      });

      if (!product) {
        throw new AppError('NOT_FOUND', 'Product not found', 404);
      }

      return {
        available: product.stock >= quantity,
        currentStock: product.stock,
        requestedQuantity: quantity,
        productId,
      };
    }
  }

  /**
   * Validate entire cart for stock availability
   */
  static async validateCart(
    items: Array<{
      productId: number;
      variantId?: number;
      quantity: number;
    }>
  ): Promise<CartValidationResult> {
    const result: CartValidationResult = {
      valid: true,
      errors: [],
      stockIssues: [],
    };

    // Group items by product/variant to handle multiple quantities of same item
    const groupedItems = new Map<string, { productId: number; variantId?: number; quantity: number }>();
    
    for (const item of items) {
      const key = item.variantId ? `${item.productId}-${item.variantId}` : `${item.productId}`;
      const existing = groupedItems.get(key);
      
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        groupedItems.set(key, { ...item });
      }
    }

    // Check stock for each grouped item
    for (const item of groupedItems.values()) {
      try {
        const stockCheck = await this.checkStock(item.productId, item.quantity, item.variantId);
        
        if (!stockCheck.available) {
          result.valid = false;
          
          // Get product and variant names for better error messages
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            select: { name: true },
          });
          
          let variantName: string | undefined;
          if (item.variantId) {
            const variant = await prisma.productVariant.findUnique({
              where: { id: item.variantId },
              select: { name: true, value: true },
            });
            variantName = variant ? `${variant.name}: ${variant.value}` : undefined;
          }

          const productName = product?.name || `Product ${item.productId}`;
          const itemDescription = variantName ? `${productName} (${variantName})` : productName;
          
          result.errors.push(
            `Insufficient stock for ${itemDescription}. Available: ${stockCheck.currentStock}, Requested: ${item.quantity}`
          );
          
          result.stockIssues.push({
            productId: item.productId,
            variantId: item.variantId,
            productName,
            variantName,
            available: stockCheck.currentStock,
            requested: item.quantity,
          });
        }
      } catch (error) {
        result.valid = false;
        result.errors.push(`Error checking stock for product ${item.productId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return result;
  }

  /**
   * Get current stock levels for multiple products/variants
   */
  static async getStockLevels(
    items: Array<{ productId: number; variantId?: number }>
  ): Promise<Array<{ productId: number; variantId?: number; stock: number; name: string; variantName?: string }>> {
    const results = [];

    for (const item of items) {
      if (item.variantId) {
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: { select: { name: true } } },
        });

        if (variant) {
          results.push({
            productId: item.productId,
            variantId: item.variantId,
            stock: variant.stock,
            name: variant.product.name,
            variantName: `${variant.name}: ${variant.value}`,
          });
        }
      } else {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, stock: true },
        });

        if (product) {
          results.push({
            productId: item.productId,
            stock: product.stock,
            name: product.name,
          });
        }
      }
    }

    return results;
  }

  /**
   * Reserve stock for a pending transaction (optional feature for hold orders)
   */
  static async reserveStock(
    items: Array<{ productId: number; variantId?: number; quantity: number }>,
    reservationId: string,
    expiresAt: Date
  ): Promise<void> {
    // This would require additional tables for stock reservations
    // For now, we'll just validate that stock is available
    const validation = await this.validateCart(items);
    
    if (!validation.valid) {
      throw new AppError('CONFLICT', 'Cannot reserve stock: ' + validation.errors.join(', '), 409);
    }

    // TODO: Implement actual stock reservation logic with expiration
    // This would involve creating a StockReservation table and updating stock calculations
  }

  /**
   * Update stock levels after a successful sale
   */
  static async updateStockAfterSale(
    items: Array<{ productId: number; variantId?: number; quantity: number }>
  ): Promise<void> {
    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx: any) => {
      for (const item of items) {
        if (item.variantId) {
          // Update variant stock
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            select: { stock: true },
          });

          if (!variant || variant.stock < item.quantity) {
            throw new AppError('CONFLICT', `Insufficient stock for variant ${item.variantId}`, 409);
          }

          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        } else {
          // Update product stock
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { stock: true },
          });

          if (!product || product.stock < item.quantity) {
            throw new AppError('CONFLICT', `Insufficient stock for product ${item.productId}`, 409);
          }

          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }
    });
  }

  /**
   * Get low stock alerts
   */
  static async getLowStockAlerts(threshold: number = 10) {
    const [lowStockProducts, lowStockVariants] = await Promise.all([
      prisma.product.findMany({
        where: {
          active: true,
          stock: { lte: threshold },
        },
        select: {
          id: true,
          name: true,
          sku: true,
          stock: true,
        },
      }),
      prisma.productVariant.findMany({
        where: {
          stock: { lte: threshold },
          product: { active: true },
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
        },
      }),
    ]);

    return {
      products: lowStockProducts,
      variants: lowStockVariants.map((v: any) => ({
        id: v.id,
        productId: v.productId,
        productName: v.product.name,
        productSku: v.product.sku,
        variantName: `${v.name}: ${v.value}`,
        stock: v.stock,
      })),
    };
  }
}