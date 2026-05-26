import { Router } from 'express';
import prisma from '../prisma.js';
import { authMiddleware } from '../middleware/auth.js';

export const reportRouter = Router();
reportRouter.use(authMiddleware);

reportRouter.get('/daily-sales', async (req, res, next) => {
  try {
    const dateFrom = req.query.dateFrom
      ? new Date(String(req.query.dateFrom))
      : new Date(new Date().setHours(0, 0, 0, 0));
    const dateTo = req.query.dateTo
      ? new Date(String(req.query.dateTo))
      : new Date(new Date().setHours(23, 59, 59, 999));

    const sales = await prisma.sale.findMany({
      where: {
        createdAt: { gte: dateFrom, lte: dateTo },
        status: 'COMPLETED',
      },
      select: { total: true, createdAt: true, paymentMethod: true },
      orderBy: { createdAt: 'asc' },
    });

    const revenue = sales.reduce((sum, s) => sum + s.total, 0);
    const byMethod = sales.reduce(
      (acc, s) => {
        acc[s.paymentMethod] = (acc[s.paymentMethod] ?? 0) + s.total;
        return acc;
      },
      {} as Record<string, number>,
    );

    const dailyMap = new Map<string, number>();
    for (const s of sales) {
      const day = s.createdAt.toISOString().slice(0, 10);
      dailyMap.set(day, (dailyMap.get(day) ?? 0) + s.total);
    }
    const daily = Array.from(dailyMap.entries()).map(([date, total]) => ({
      date,
      total,
    }));

    res.json({
      success: true,
      data: {
        revenue,
        transactionCount: sales.length,
        averageOrderValue: sales.length > 0 ? revenue / sales.length : 0,
        byMethod,
        daily,
      },
    });
  } catch (err) {
    next(err);
  }
});

reportRouter.get('/top-products', async (req, res, next) => {
  try {
    const limit = Math.min(50, Number(req.query.limit) || 10);
    const dateFrom = req.query.dateFrom
      ? new Date(String(req.query.dateFrom))
      : new Date(0);
    const dateTo = req.query.dateTo
      ? new Date(String(req.query.dateTo))
      : new Date();

    const items = await prisma.saleItem.findMany({
      where: {
        sale: {
          createdAt: { gte: dateFrom, lte: dateTo },
          status: 'COMPLETED',
        },
      },
      include: { product: { select: { name: true, sku: true } } },
    });

    const productMap = new Map<
      number,
      { name: string; sku: string; quantity: number; revenue: number }
    >();
    for (const item of items) {
      const existing = productMap.get(item.productId) ?? {
        name: item.product.name,
        sku: item.product.sku,
        quantity: 0,
        revenue: 0,
      };
      existing.quantity += item.quantity;
      existing.revenue += item.total;
      productMap.set(item.productId, existing);
    }

    const top = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);

    res.json({ success: true, data: top });
  } catch (err) {
    next(err);
  }
});

reportRouter.get('/inventory', async (_req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      include: { variants: true, category: { select: { name: true } } },
    });

    const totalItems = products.length;
    const totalStock = products.reduce((sum, p) => {
      if (p.variants.length > 0) {
        return sum + p.variants.reduce((s, v) => s + v.stock, 0);
      }
      return sum + p.stock;
    }, 0);
    const totalValue = products.reduce((sum, p) => {
      const qty = p.variants.length > 0
        ? p.variants.reduce((s, v) => s + v.stock, 0)
        : p.stock;
      return sum + (p.costPrice ?? 0) * qty;
    }, 0);

    const categoryBreakdown = products.reduce(
      (acc, p) => {
        const name = p.category?.name ?? 'Uncategorized';
        if (!acc[name]) acc[name] = { count: 0, value: 0 };
        acc[name].count++;
        const qty = p.variants.length > 0
          ? p.variants.reduce((s, v) => s + v.stock, 0)
          : p.stock;
        acc[name].value += (p.costPrice ?? 0) * qty;
        return acc;
      },
      {} as Record<string, { count: number; value: number }>,
    );

    res.json({
      success: true,
      data: { totalItems, totalStock, totalValue, categoryBreakdown },
    });
  } catch (err) {
    next(err);
  }
});

reportRouter.get('/low-stock', async (_req, res, next) => {
  try {
    const threshold = Number(_req.query.threshold) || 5;

    const products = await prisma.product.findMany({
      where: { active: true },
      include: {
        variants: { where: { stock: { lte: threshold } } },
        category: { select: { name: true } },
      },
    });

    const variantAlerts = products
      .filter((p) => p.variants.length > 0)
      .flatMap((p) =>
        p.variants
          .filter((v) => v.stock <= threshold)
          .map((v) => ({
            productId: p.id,
            productName: p.name,
            sku: p.sku,
            category: p.category?.name ?? '—',
            variantName: v.name,
            variantValue: v.value,
            currentStock: v.stock,
            threshold,
          })),
      );

    const productAlerts = products
      .filter((p) => p.variants.length === 0 && p.stock <= threshold)
      .map((p) => ({
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        category: p.category?.name ?? '—',
        variantName: '—',
        variantValue: '—',
        currentStock: p.stock,
        threshold,
      }));

    const lowStock = [...variantAlerts, ...productAlerts]
      .sort((a, b) => a.currentStock - b.currentStock);

    res.json({ success: true, data: lowStock });
  } catch (err) {
    next(err);
  }
});
