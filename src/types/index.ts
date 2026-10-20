export type Role = 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';
export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED' | 'FAILED';
export type ShippingMethod = 'STANDARD' | 'EXPRESS' | 'SAME_DAY';
export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar: string | null;
  phone: string | null;
  emailVerified: string | null;
  createdAt: string;
  googleId: string | null;
}

export interface PageMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

export interface ProductCard {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  compareAtPrice: number | null;
  image: string | null;
  hoverImage: string | null;
  ratingAvg: number;
  ratingCount: number;
  stock: number;
  stockStatus: StockStatus;
  category: { id: string; name: string; slug: string };
  hasVariants: boolean;
  isFeatured: boolean;
  soldCount: number;
}

export interface Variant {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  priceDelta: number;
  stock: number;
}

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  lowStockThreshold: number;
  stockStatus: StockStatus;
  specs: Record<string, string>;
  ratingAvg: number;
  ratingCount: number;
  soldCount: number;
  images: { id: string; url: string; alt: string | null }[];
  variants: Variant[];
  category: { id: string; name: string; slug: string; parent: { name: string; slug: string } | null };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  _count?: { products: number; children?: number };
  children?: Category[];
  parent?: { id: string; name: string } | null;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  name: string;
  slug: string;
  image: string | null;
  variantName: string | null;
  unitPrice: number;
  lineTotal: number;
  availableStock: number;
  stockStatus: StockStatus;
  isActive?: boolean;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  variantName: string | null;
  image: string | null;
  unitPrice: number;
  quantity: number;
  product?: { slug: string };
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  shippingMethod: ShippingMethod;
  shippingAddress: Omit<Address, 'id' | 'label' | 'isDefault'>;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  couponCode: string | null;
  notes: string | null;
  trackingNumber: string | null;
  createdAt: string;
  cancelledAt: string | null;
  items: OrderItem[];
  statusHistory?: { id: string; status: OrderStatus; note: string | null; createdAt: string }[];
  user?: { id: string; name: string; email: string };
  allowedTransitions?: OrderStatus[];
}

export interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  helpfulCount: number;
  votedHelpful?: boolean;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; avatar: string | null };
}

export interface Notification {
  id: string;
  type: 'ORDER' | 'PROMOTION' | 'SYSTEM' | 'ACCOUNT';
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  perUserLimit: number;
  usedCount: number;
  isActive: boolean;
  startsAt: string;
  expiresAt: string | null;
}
