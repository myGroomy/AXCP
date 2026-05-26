export interface User {
  id: number;
  username: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER';
  active: boolean;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  costPrice: number | null;
  categoryId: number | null;
  image: string | null;
  barcode: string | null;
  active: boolean;
  stock: number;
  createdAt: string;
  updatedAt: string;
  variants?: ProductVariant[];
  category?: Category;
}

export interface ProductVariant {
  id: number;
  productId: number;
  name: string;
  value: string;
  priceOverride: number | null;
  stock: number;
}

export interface Category {
  id: number;
  name: string;
  parentId: number | null;
  description: string | null;
  children?: Category[];
}

export interface Supplier {
  id: number;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxId: string | null;
}

export interface Sale {
  id: number;
  invoiceNo: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  status: string;
  userId: number;
  customerId: number | null;
  createdAt: string;
  items?: SaleItem[];
  user?: User;
}

export interface SaleItem {
  id: number;
  saleId: number;
  productId: number;
  variantId: number | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  product?: Product;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiError {
  success: boolean;
  error: string;
  code: string;
}
