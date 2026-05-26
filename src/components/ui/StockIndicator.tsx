import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, XCircle, Package } from 'lucide-react';

interface StockIndicatorProps {
  stock: number;
  lowStockThreshold?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StockIndicator({ 
  stock, 
  lowStockThreshold = 10, 
  showLabel = true,
  size = 'md',
  className = '' 
}: StockIndicatorProps) {
  const getStockStatus = () => {
    if (stock === 0) return 'out-of-stock';
    if (stock <= lowStockThreshold) return 'low-stock';
    return 'in-stock';
  };

  const status = getStockStatus();

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'out-of-stock':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: XCircle,
          label: 'Out of Stock',
        };
      case 'low-stock':
        return {
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          icon: AlertTriangle,
          label: 'Low Stock',
        };
      default:
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: CheckCircle,
          label: 'In Stock',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        inline-flex items-center gap-1.5 px-2 py-1 rounded-full border
        ${config.bgColor} ${config.borderColor} ${config.color}
        ${sizeClasses[size]} ${className}
      `}
    >
      <Icon size={iconSizes[size]} />
      
      <span className="font-medium">
        {stock}
      </span>
      
      {showLabel && (
        <span className="hidden sm:inline">
          {status === 'out-of-stock' ? 'Out' : status === 'low-stock' ? 'Low' : 'Available'}
        </span>
      )}
    </motion.div>
  );
}

interface StockBadgeProps {
  stock: number;
  lowStockThreshold?: number;
  className?: string;
}

export function StockBadge({ stock, lowStockThreshold = 10, className = '' }: StockBadgeProps) {
  const getStockStatus = () => {
    if (stock === 0) return 'out-of-stock';
    if (stock <= lowStockThreshold) return 'low-stock';
    return 'in-stock';
  };

  const status = getStockStatus();

  const statusConfig = {
    'out-of-stock': {
      label: 'OUT OF STOCK',
      className: 'bg-red-100 text-red-800 border-red-200',
    },
    'low-stock': {
      label: 'LOW STOCK',
      className: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    'in-stock': {
      label: `${stock} IN STOCK`,
      className: 'bg-green-100 text-green-800 border-green-200',
    },
  };

  const config = statusConfig[status];

  return (
    <span className={`
      inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border
      ${config.className} ${className}
    `}>
      {config.label}
    </span>
  );
}

interface StockProgressProps {
  current: number;
  max: number;
  lowStockThreshold?: number;
  className?: string;
}

export function StockProgress({ 
  current, 
  max, 
  lowStockThreshold = 10, 
  className = '' 
}: StockProgressProps) {
  const percentage = max > 0 ? (current / max) * 100 : 0;
  
  const getBarColor = () => {
    if (current === 0) return 'bg-red-500';
    if (current <= lowStockThreshold) return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">Stock Level</span>
        <span className="text-sm text-gray-600">{current} / {max}</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-2 rounded-full ${getBarColor()}`}
        />
      </div>
      
      {current <= lowStockThreshold && current > 0 && (
        <div className="flex items-center gap-1 mt-1">
          <AlertTriangle size={12} className="text-amber-500" />
          <span className="text-xs text-amber-600">Low stock warning</span>
        </div>
      )}
    </div>
  );
}

interface StockAlertProps {
  stock: number;
  productName: string;
  lowStockThreshold?: number;
  onRestock?: () => void;
  className?: string;
}

export function StockAlert({ 
  stock, 
  productName, 
  lowStockThreshold = 10, 
  onRestock,
  className = '' 
}: StockAlertProps) {
  if (stock > lowStockThreshold) return null;

  const isOutOfStock = stock === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        p-3 rounded-lg border-l-4 
        ${isOutOfStock 
          ? 'bg-red-50 border-red-400 text-red-700' 
          : 'bg-amber-50 border-amber-400 text-amber-700'
        }
        ${className}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          {isOutOfStock ? (
            <XCircle size={20} className="text-red-500 mt-0.5" />
          ) : (
            <AlertTriangle size={20} className="text-amber-500 mt-0.5" />
          )}
          
          <div>
            <h4 className="font-medium">
              {isOutOfStock ? 'Out of Stock' : 'Low Stock Warning'}
            </h4>
            <p className="text-sm mt-1">
              {productName} {isOutOfStock 
                ? 'is completely out of stock' 
                : `has only ${stock} units remaining`
              }
            </p>
          </div>
        </div>
        
        {onRestock && (
          <button
            onClick={onRestock}
            className="text-sm font-medium hover:underline"
          >
            Restock
          </button>
        )}
      </div>
    </motion.div>
  );
}