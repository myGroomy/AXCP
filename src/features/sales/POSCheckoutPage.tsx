import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Package, ShoppingCart } from 'lucide-react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StockIndicator, StockBadge } from '../../components/ui/StockIndicator';
import { useStockValidation, useStockMonitor } from '../../hooks/useStock';
import type { Product } from '../../types';

interface CartItem {
  product: Product;
  variantId?: number;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export function POSCheckoutPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountReceived, setAmountReceived] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState<any>(null);
  const [error, setError] = useState('');
  const [stockErrors, setStockErrors] = useState<string[]>([]);

  // Stock validation hooks
  const { 
    isProductAvailable, 
    getAvailableStock, 
    validateQuantity, 
    validateCart,
    refreshStockCache 
  } = useStockValidation();
  
  // Real-time stock monitoring
  const { stockLevels, refreshStockLevels, getStockLevel } = useStockMonitor(products, 30000);

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await api.get('/products', {
        params: { search, limit: 50 },
      });
      setProducts(data.data);
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 200);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const addToCart = async (product: Product, variantId?: number) => {
    setStockErrors([]);
    
    // Check if product/variant is available
    if (!isProductAvailable(product, variantId)) {
      const itemName = variantId 
        ? `${product.name} (${product.variants?.find(v => v.id === variantId)?.name})`
        : product.name;
      setStockErrors([`${itemName} is out of stock`]);
      return;
    }

    // Check if we can add one more to cart
    const key = variantId ? `${product.id}-${variantId}` : String(product.id);
    const existing = cart.find((item) => {
      const itemKey = item.variantId ? `${item.product.id}-${item.variantId}` : String(item.product.id);
      return itemKey === key;
    });

    const newQuantity = existing ? existing.quantity + 1 : 1;
    
    try {
      const validation = await validateQuantity(product, newQuantity, variantId);
      
      if (!validation.valid) {
        setStockErrors([validation.message || 'Insufficient stock']);
        return;
      }

      setCart((prev) => {
        if (existing) {
          return prev.map((item) =>
            item === existing
              ? { ...item, quantity: newQuantity, total: newQuantity * item.unitPrice - item.discount }
              : item,
          );
        }

        const variant = variantId ? product.variants?.find((v) => v.id === variantId) : undefined;
        return [
          ...prev,
          {
            product,
            variantId,
            variantName: variant ? `${variant.name}: ${variant.value}` : undefined,
            quantity: 1,
            unitPrice: variant?.priceOverride ?? product.price,
            discount: 0,
            total: variant?.priceOverride ?? product.price,
          },
        ];
      });

      // Clear any previous errors
      setError('');
    } catch (err) {
      setStockErrors(['Failed to validate stock. Please try again.']);
    }
  };

  const updateQuantity = async (index: number, delta: number) => {
    const item = cart[index];
    if (!item) return;
    
    const newQuantity = Math.max(1, item.quantity + delta);
    
    if (delta > 0) {
      // Increasing quantity - validate stock
      try {
        const validation = await validateQuantity(item.product, newQuantity, item.variantId);
        
        if (!validation.valid) {
          setStockErrors([validation.message || 'Insufficient stock']);
          return;
        }
      } catch (err) {
        setStockErrors(['Failed to validate stock. Please try again.']);
        return;
      }
    }

    setCart((prev) =>
      prev.map((cartItem, i) => {
        if (i !== index) return cartItem;
        return { ...cartItem, quantity: newQuantity, total: newQuantity * cartItem.unitPrice - cartItem.discount };
      }),
    );
    
    setStockErrors([]);
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const tax = 0;
  const discount = 0;
  const total = subtotal + tax - discount;

  const handlePayment = async () => {
    if (cart.length === 0) return;
    
    setLoading(true);
    setError('');
    setStockErrors([]);

    try {
      // Final stock validation before payment
      const cartItems = cart.map(item => ({
        productId: item.product.id,
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      const validation = await validateCart(cartItems);
      
      if (!validation.valid) {
        setStockErrors(validation.errors);
        setLoading(false);
        return;
      }

      const { data } = await api.post('/sales', {
        items: cart.map((item) => ({
          productId: item.product.id,
          variantId: item.variantId ?? null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
        })),
        subtotal,
        tax,
        discount,
        total,
        paymentMethod,
        notes: null,
      });
      
      setShowReceipt(data.data);
      setCart([]);
      setShowPayment(false);
      
      // Refresh stock levels after successful sale
      refreshStockLevels();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Payment failed';
      
      if (err.response?.status === 409) {
        // Stock conflict error
        setStockErrors([errorMessage]);
        // Refresh stock cache to get latest data
        const cartItems = cart.map(item => ({
          productId: item.product.id,
          variantId: item.variantId,
        }));
        refreshStockCache(cartItems);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (showReceipt) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto space-y-4"
      >
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-2xl">✓</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Payment Successful</h2>
          <p className="text-gray-500 mt-1">{showReceipt.invoiceNo}</p>
          <p className="text-3xl font-bold text-gray-900 mt-4">
            Rp {showReceipt.total.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {new Date(showReceipt.createdAt).toLocaleString()}
          </p>
          <div className="mt-4 text-left space-y-1 border-t pt-4">
            {showReceipt.items.map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.product.name} x{item.quantity}
                </span>
                <span className="font-medium">
                  Rp {(item.unitPrice * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span>Rp {showReceipt.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button className="flex-1" onClick={() => window.print()}>Print</Button>
          <Button className="flex-1" variant="secondary" onClick={() => setShowReceipt(null)}>
            New Sale
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-3rem)]">
      <div className="flex-1 flex flex-col space-y-3">
        <input
          type="text"
          placeholder="Search products by name, SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          autoFocus
        />
        <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 gap-3">
          {products.map((p) => {
            const stockLevel = getStockLevel(p.id);
            const isAvailable = isProductAvailable(p);
            const availableStock = getAvailableStock(p);
            
            return (
              <motion.button
                key={p.id}
                whileHover={isAvailable ? { scale: 1.02 } : {}}
                whileTap={isAvailable ? { scale: 0.98 } : {}}
                onClick={() => isAvailable && addToCart(p)}
                disabled={!isAvailable}
                className={`
                  bg-white rounded-xl border border-gray-200 p-4 text-left transition-all duration-200
                  ${isAvailable 
                    ? 'hover:shadow-md cursor-pointer hover:border-transparent' 
                    : 'opacity-60 cursor-not-allowed bg-gray-50'
                  }
                `}
                style={isAvailable ? { '--hover-border': 'var(--color-g-1)' } as React.CSSProperties : {}}
                onMouseEnter={(e) => { 
                  if (isAvailable) e.currentTarget.style.borderColor = 'var(--color-g-1)' 
                }}
                onMouseLeave={(e) => { 
                  if (isAvailable) e.currentTarget.style.borderColor = '' 
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{p.sku}</p>
                  </div>
                  <StockIndicator 
                    stock={availableStock} 
                    size="sm" 
                    showLabel={false}
                    className="ml-2"
                  />
                </div>
                
                <p className="text-brand-600 font-bold mt-2">
                  Rp {p.price.toLocaleString()}
                </p>
                
                {!isAvailable && (
                  <div className="mt-2">
                    <StockBadge stock={availableStock} className="text-xs" />
                  </div>
                )}
                
                {p.variants && p.variants.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.variants.map((v) => {
                      const variantAvailable = isProductAvailable(p, v.id);
                      const variantStock = getAvailableStock(p, v.id);
                      
                      return (
                        <button
                          key={v.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (variantAvailable) addToCart(p, v.id);
                          }}
                          disabled={!variantAvailable}
                          className={`
                            text-xs px-2 py-0.5 rounded border transition-colors
                            ${variantAvailable
                              ? 'border-gray-300 hover:bg-brand-50 hover:border-brand-300'
                              : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            }
                          `}
                          title={`${v.value} - Stock: ${variantStock}`}
                        >
                          {v.value}
                          {!variantAvailable && (
                            <span className="ml-1 text-red-500">✕</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="w-96 flex flex-col bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-g-1) 5%, transparent), transparent)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Cart</h2>
              <p className="text-xs text-gray-500">{cart.length} items</p>
            </div>
            <ShoppingCart size={20} className="text-gray-400" />
          </div>
          
          {/* Stock Error Messages */}
          {stockErrors.length > 0 && (
            <div className="mt-3 space-y-1">
              {stockErrors.map((error, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded"
                >
                  <AlertTriangle size={12} />
                  <span>{error}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <AnimatePresence>
            {cart.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-8">
                Select products to start
              </p>
            )}
            {cart.map((item, i) => {
              const availableStock = getAvailableStock(item.product, item.variantId);
              const isLowStock = availableStock <= 10 && availableStock > 0;
              const isOutOfStock = availableStock === 0;
              
              return (
                <motion.div
                  key={`${item.product.id}-${item.variantId}-${i}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`
                    rounded-lg p-3 border
                    ${isOutOfStock 
                      ? 'bg-red-50 border-red-200' 
                      : isLowStock 
                        ? 'bg-amber-50 border-amber-200' 
                        : 'bg-gray-50 border-gray-200'
                    }
                  `}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {item.product.name}
                      </p>
                      {item.variantName && (
                        <p className="text-xs text-gray-500">{item.variantName}</p>
                      )}
                      
                      {/* Stock Warning */}
                      {(isLowStock || isOutOfStock) && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertTriangle 
                            size={12} 
                            className={isOutOfStock ? 'text-red-500' : 'text-amber-500'} 
                          />
                          <span className={`text-xs ${isOutOfStock ? 'text-red-600' : 'text-amber-600'}`}>
                            {isOutOfStock 
                              ? 'Out of stock' 
                              : `Only ${availableStock} left`
                            }
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => removeFromCart(i)}
                      className="text-red-400 hover:text-red-600 text-xs ml-2"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(i, -1)}
                        className="w-6 h-6 rounded bg-gray-200 text-sm font-medium hover:bg-gray-300 disabled:opacity-50"
                        disabled={item.quantity <= 1}
                      >
                        −
                      </button>
                      <span className="text-sm font-medium min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(i, 1)}
                        className="w-6 h-6 rounded bg-gray-200 text-sm font-medium hover:bg-gray-300 disabled:opacity-50"
                        disabled={item.quantity >= availableStock}
                        title={item.quantity >= availableStock ? 'Maximum stock reached' : 'Add one more'}
                      >
                        +
                      </button>
                    </div>
                    <p className="text-sm font-bold">
                      Rp {(item.unitPrice * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="p-4 border-t border-gray-200 space-y-3">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>Rp {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Tax</span>
              <span>Rp {tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
              <span>Total</span>
              <span>Rp {total.toLocaleString()}</span>
            </div>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">{error}</p>}
          {stockErrors.length > 0 && (
            <div className="space-y-1">
              {stockErrors.map((error, index) => (
                <p key={index} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                  {error}
                </p>
              ))}
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            disabled={cart.length === 0}
            onClick={() => setShowPayment(true)}
          >
            Checkout (Rp {total.toLocaleString()})
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            onClick={() => setShowPayment(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 space-y-4"
            >
              <h3 className="text-lg font-bold text-gray-900">Payment</h3>

              <div className="space-y-2">
                <p className="text-sm text-gray-500">Payment Method</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'CASH', label: 'Cash' },
                    { value: 'CARD', label: 'Card' },
                    { value: 'TRANSFER', label: 'Transfer' },
                    { value: 'MIXED', label: 'Mixed' },
                  ].map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setPaymentMethod(m.value)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium border transition-colors duration-200 cursor-pointer ${
                        paymentMethod === m.value
                          ? 'text-brand-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                      style={paymentMethod === m.value ? { borderColor: 'var(--color-g-1)', backgroundColor: 'color-mix(in srgb, var(--color-g-1) 10%, transparent)' } : {}}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'CASH' && (
                <div>
                  <Input
                    label="Amount Received"
                    type="number"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    placeholder="Enter amount"
                  />
                  {Number(amountReceived) >= total && (
                    <p className="text-sm text-green-600 mt-1">
                      Change: Rp {(Number(amountReceived) - total).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              <p className="text-2xl font-bold text-center text-gray-900">
                Rp {total.toLocaleString()}
              </p>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowPayment(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  loading={loading}
                  onClick={handlePayment}
                >
                  Complete Payment
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
