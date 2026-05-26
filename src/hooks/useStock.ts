import { useState, useCallback, useEffect } from 'react';
import api from '../lib/api';
import type { Product, ProductVariant } from '../types';

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

export interface StockLevel {
  productId: number;
  variantId?: number;
  stock: number;
  name: string;
  variantName?: string;
}

export interface CartItem {
  productId: number;
  variantId?: number;
  quantity: number;
}

export function useStock() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStock = useCallback(async (
    productId: number,
    quantity: number,
    variantId?: number
  ): Promise<StockCheckResult> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data } = await api.post('/stock/check', {
        productId,
        quantity,
        variantId,
      });
      
      return data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to check stock';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const validateCart = useCallback(async (items: CartItem[]): Promise<CartValidationResult> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data } = await api.post('/stock/validate-cart', { items });
      return data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to validate cart';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getStockLevels = useCallback(async (
    items: Array<{ productId: number; variantId?: number }>
  ): Promise<StockLevel[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data } = await api.post('/stock/levels', { items });
      return data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to get stock levels';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getProductStock = useCallback(async (
    productId: number,
    variantId?: number
  ): Promise<StockLevel> => {
    setLoading(true);
    setError(null);
    
    try {
      const url = variantId 
        ? `/stock/product/${productId}?variantId=${variantId}`
        : `/stock/product/${productId}`;
      
      const { data } = await api.get(url);
      return data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to get product stock';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getLowStockAlerts = useCallback(async (threshold: number = 10) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data } = await api.get(`/stock/alerts?threshold=${threshold}`);
      return data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to get low stock alerts';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    checkStock,
    validateCart,
    getStockLevels,
    getProductStock,
    getLowStockAlerts,
  };
}

export function useStockValidation() {
  const { checkStock, validateCart } = useStock();
  const [stockCache, setStockCache] = useState<Map<string, StockCheckResult>>(new Map());

  const isProductAvailable = useCallback((product: Product, variantId?: number): boolean => {
    const key = variantId ? `${product.id}-${variantId}` : `${product.id}`;
    const cached = stockCache.get(key);
    
    if (cached) {
      return cached.available;
    }

    // Fallback to product/variant stock if no cache
    if (variantId) {
      const variant = product.variants?.find(v => v.id === variantId);
      return (variant?.stock || 0) > 0;
    }
    
    return product.stock > 0;
  }, [stockCache]);

  const getAvailableStock = useCallback((product: Product, variantId?: number): number => {
    const key = variantId ? `${product.id}-${variantId}` : `${product.id}`;
    const cached = stockCache.get(key);
    
    if (cached) {
      return cached.currentStock;
    }

    // Fallback to product/variant stock if no cache
    if (variantId) {
      const variant = product.variants?.find(v => v.id === variantId);
      return variant?.stock || 0;
    }
    
    return product.stock;
  }, [stockCache]);

  const validateQuantity = useCallback(async (
    product: Product,
    quantity: number,
    variantId?: number
  ): Promise<{ valid: boolean; available: number; message?: string }> => {
    try {
      const result = await checkStock(product.id, quantity, variantId);
      
      // Update cache
      const key = variantId ? `${product.id}-${variantId}` : `${product.id}`;
      setStockCache(prev => new Map(prev).set(key, result));
      
      if (!result.available) {
        const itemName = variantId 
          ? `${product.name} (${product.variants?.find(v => v.id === variantId)?.name})`
          : product.name;
        
        return {
          valid: false,
          available: result.currentStock,
          message: `Insufficient stock for ${itemName}. Available: ${result.currentStock}, Requested: ${quantity}`,
        };
      }
      
      return { valid: true, available: result.currentStock };
    } catch (error) {
      return {
        valid: false,
        available: 0,
        message: 'Failed to validate stock',
      };
    }
  }, [checkStock]);

  const refreshStockCache = useCallback(async (items: Array<{ productId: number; variantId?: number }>) => {
    try {
      const results = await Promise.all(
        items.map(item => checkStock(item.productId, 1, item.variantId))
      );
      
      const newCache = new Map(stockCache);
      results.forEach((result, index) => {
        const item = items[index];
        if (!item) return;
        
        const key = item.variantId ? `${item.productId}-${item.variantId}` : `${item.productId}`;
        newCache.set(key, result);
      });
      
      setStockCache(newCache);
    } catch (error) {
      console.error('Failed to refresh stock cache:', error);
    }
  }, [checkStock, stockCache]);

  const clearStockCache = useCallback(() => {
    setStockCache(new Map());
  }, []);

  return {
    isProductAvailable,
    getAvailableStock,
    validateQuantity,
    validateCart,
    refreshStockCache,
    clearStockCache,
    stockCache,
  };
}

// Hook for real-time stock monitoring
export function useStockMonitor(
  products: Product[],
  refreshInterval: number = 30000 // 30 seconds
) {
  const { getStockLevels } = useStock();
  const [stockLevels, setStockLevels] = useState<Map<string, StockLevel>>(new Map());
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const refreshStockLevels = useCallback(async () => {
    if (products.length === 0) return;

    try {
      const items: Array<{ productId: number; variantId?: number }> = [];
      
      products.forEach(product => {
        items.push({ productId: product.id });
        
        if (product.variants) {
          product.variants.forEach(variant => {
            items.push({ productId: product.id, variantId: variant.id });
          });
        }
      });

      const levels = await getStockLevels(items);
      const levelMap = new Map<string, StockLevel>();
      
      levels.forEach(level => {
        const key = level.variantId ? `${level.productId}-${level.variantId}` : `${level.productId}`;
        levelMap.set(key, level);
      });
      
      setStockLevels(levelMap);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to refresh stock levels:', error);
    }
  }, [products, getStockLevels]);

  useEffect(() => {
    refreshStockLevels();
    
    const interval = setInterval(refreshStockLevels, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshStockLevels, refreshInterval]);

  const getStockLevel = useCallback((productId: number, variantId?: number): StockLevel | null => {
    const key = variantId ? `${productId}-${variantId}` : `${productId}`;
    return stockLevels.get(key) || null;
  }, [stockLevels]);

  return {
    stockLevels,
    lastUpdate,
    refreshStockLevels,
    getStockLevel,
  };
}