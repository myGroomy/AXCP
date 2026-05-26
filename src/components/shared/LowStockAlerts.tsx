import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Package, RefreshCw, X } from 'lucide-react';
import { useStock } from '../../hooks/useStock';
import { Button } from '../ui/Button';

interface LowStockAlert {
  products: Array<{
    id: number;
    name: string;
    sku: string;
    stock: number;
  }>;
  variants: Array<{
    id: number;
    productId: number;
    productName: string;
    productSku: string;
    variantName: string;
    stock: number;
  }>;
}

interface LowStockAlertsProps {
  threshold?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  className?: string;
}

export function LowStockAlerts({ 
  threshold = 10, 
  autoRefresh = true,
  refreshInterval = 60000, // 1 minute
  className = '' 
}: LowStockAlertsProps) {
  const [alerts, setAlerts] = useState<LowStockAlert | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const { getLowStockAlerts } = useStock();

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await getLowStockAlerts(threshold);
      setAlerts(data);
    } catch (error) {
      console.error('Failed to fetch low stock alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    if (autoRefresh) {
      const interval = setInterval(fetchAlerts, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [threshold, autoRefresh, refreshInterval]);

  const dismissAlert = (type: 'product' | 'variant', id: number) => {
    const key = `${type}-${id}`;
    setDismissed(prev => new Set(prev).add(key));
  };

  const isDismissed = (type: 'product' | 'variant', id: number) => {
    const key = `${type}-${id}`;
    return dismissed.has(key);
  };

  if (!alerts || (alerts.products.length === 0 && alerts.variants.length === 0)) {
    return null;
  }

  const visibleProducts = alerts.products.filter(p => !isDismissed('product', p.id));
  const visibleVariants = alerts.variants.filter(v => !isDismissed('variant', v.id));

  if (visibleProducts.length === 0 && visibleVariants.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl border border-amber-200 ${className}`}
    >
      <div className="p-4 border-b border-amber-200 bg-amber-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-amber-600" size={20} />
            <h3 className="font-semibold text-amber-800">Low Stock Alerts</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchAlerts}
              disabled={loading}
              className="text-amber-700 border-amber-300 hover:bg-amber-100"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {/* Product Alerts */}
          {visibleProducts.map((product) => (
            <motion.div
              key={`product-${product.id}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200"
            >
              <div className="flex items-center gap-3">
                <Package className="text-amber-600" size={16} />
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                  <p className="text-sm text-amber-700">
                    {product.stock === 0 ? 'Out of stock' : `Only ${product.stock} left`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => dismissAlert('product', product.id)}
                className="text-amber-600 hover:text-amber-800 p-1"
                title="Dismiss alert"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}

          {/* Variant Alerts */}
          {visibleVariants.map((variant) => (
            <motion.div
              key={`variant-${variant.id}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200"
            >
              <div className="flex items-center gap-3">
                <Package className="text-amber-600" size={16} />
                <div>
                  <p className="font-medium text-gray-900">{variant.productName}</p>
                  <p className="text-sm text-gray-600">
                    {variant.variantName} • SKU: {variant.productSku}
                  </p>
                  <p className="text-sm text-amber-700">
                    {variant.stock === 0 ? 'Out of stock' : `Only ${variant.stock} left`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => dismissAlert('variant', variant.id)}
                className="text-amber-600 hover:text-amber-800 p-1"
                title="Dismiss alert"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {visibleProducts.length === 0 && visibleVariants.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            All alerts have been dismissed
          </p>
        )}
      </div>

      {(visibleProducts.length > 0 || visibleVariants.length > 0) && (
        <div className="p-4 border-t border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-700 text-center">
            {visibleProducts.length + visibleVariants.length} item(s) need restocking
          </p>
        </div>
      )}
    </motion.div>
  );
}

interface CompactLowStockAlertsProps {
  threshold?: number;
  maxItems?: number;
  className?: string;
}

export function CompactLowStockAlerts({ 
  threshold = 10, 
  maxItems = 3,
  className = '' 
}: CompactLowStockAlertsProps) {
  const [alerts, setAlerts] = useState<LowStockAlert | null>(null);
  const { getLowStockAlerts } = useStock();

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await getLowStockAlerts(threshold);
        setAlerts(data);
      } catch (error) {
        console.error('Failed to fetch low stock alerts:', error);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [threshold]);

  if (!alerts || (alerts.products.length === 0 && alerts.variants.length === 0)) {
    return null;
  }

  const totalAlerts = alerts.products.length + alerts.variants.length;
  const allItems = [
    ...alerts.products.map(p => ({ type: 'product' as const, ...p })),
    ...alerts.variants.map(v => ({ type: 'variant' as const, ...v }))
  ].slice(0, maxItems);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-amber-50 border border-amber-200 rounded-lg p-3 ${className}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="text-amber-600" size={16} />
        <span className="text-sm font-medium text-amber-800">
          {totalAlerts} Low Stock Alert{totalAlerts > 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-1">
        {allItems.map((item, index) => (
          <div key={`${item.type}-${item.id || index}`} className="text-xs text-amber-700">
            {item.type === 'product' ? (
              <span>{item.name}: {item.stock} left</span>
            ) : (
              <span>{item.productName} ({item.variantName}): {item.stock} left</span>
            )}
          </div>
        ))}
        
        {totalAlerts > maxItems && (
          <div className="text-xs text-amber-600 font-medium">
            +{totalAlerts - maxItems} more items
          </div>
        )}
      </div>
    </motion.div>
  );
}