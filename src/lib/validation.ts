import { z } from 'zod';
import { sanitizeText } from './sanitize';

const text = (label: string, min: number, max: number) =>
  z
    .string({ required_error: `${label} is required`, invalid_type_error: `${label} must be text` })
    .transform(sanitizeText)
    .pipe(
      z
        .string()
        .min(1, `${label} is required`)
        .min(min, min === 1 ? `${label} is required` : `${label} must be at least ${min} characters`)
        .max(max, `${label} must be at most ${max} characters`),
    );

const optionalText = (label: string, max: number) =>
  z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().max(max, `${label} must be at most ${max} characters`))
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

export const emailSchema = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .min(1, 'Email is required')
  .max(254, 'Email must be at most 254 characters')
  .email('Please enter a valid email address');

export const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, message: 'Password must be at least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p), message: 'Password must contain at least one uppercase letter' },
  { test: (p: string) => /[a-z]/.test(p), message: 'Password must contain at least one lowercase letter' },
  { test: (p: string) => /[0-9]/.test(p), message: 'Password must contain at least one number' },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), message: 'Password must contain at least one special character' },
];

export const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(1, 'Password is required')
  .max(128, 'Password must be at most 128 characters')
  .superRefine((p, ctx) => {
    const failed = PASSWORD_RULES.find((r) => !r.test(p));
    if (failed) ctx.addIssue({ code: z.ZodIssueCode.custom, message: failed.message });
  });

export function passwordStrength(p: string): { score: number; label: 'Weak' | 'Fair' | 'Good' | 'Strong' } {
  const score = PASSWORD_RULES.filter((r) => r.test(p)).length + (p.length >= 12 ? 1 : 0);
  if (score <= 2) return { score, label: 'Weak' };
  if (score <= 4) return { score, label: 'Fair' };
  if (score === 5) return { score, label: 'Good' };
  return { score, label: 'Strong' };
}

export const phoneSchema = z
  .string({ required_error: 'Phone number is required' })
  .trim()
  .min(1, 'Phone number is required')
  .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Please enter a valid phone number')
  .refine((v) => v.replace(/\D/g, '').length >= 7 && v.replace(/\D/g, '').length <= 15, {
    message: 'Phone number must contain 7 to 15 digits',
  });

export const nameSchema = text('Name', 2, 50).refine((v) => /^[\p{L}\s'.-]+$/u.test(v), {
  message: 'Name may only contain letters, spaces, apostrophes, periods and hyphens',
});

// ---------- Auth ----------
export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string({ required_error: 'Please confirm your password' }).min(1, 'Please confirm your password'),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms and conditions' }),
    }),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

export const verifyEmailSchema = z.object({ token: z.string().min(1, 'Verification token is required') });

// ---------- Profile ----------
export const profileSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: z
    .union([phoneSchema, z.literal('')])
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    path: ['newPassword'],
    message: 'New password must be different from current password',
  });

// ---------- Address ----------
export const addressSchema = z.object({
  label: text('Label', 1, 30).default('Home'),
  fullName: text('Full name', 2, 100),
  phone: phoneSchema,
  line1: text('Address line 1', 5, 120),
  line2: optionalText('Address line 2', 120),
  city: text('City', 2, 60),
  state: text('State / Province', 2, 60),
  postalCode: z
    .string({ required_error: 'Postal code is required' })
    .trim()
    .min(1, 'Postal code is required')
    .regex(/^[A-Za-z0-9\s-]{3,10}$/, 'Please enter a valid postal code'),
  country: text('Country', 2, 60),
  isDefault: z.boolean().optional().default(false),
});

// ---------- Cart ----------
export const quantitySchema = z.coerce
  .number({ invalid_type_error: 'Quantity must be a number' })
  .int('Quantity must be a whole number')
  .min(1, 'Quantity must be at least 1')
  .max(99, 'Quantity cannot exceed 99');

export const addToCartSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  variantId: z.string().optional().nullable(),
  quantity: quantitySchema.default(1),
});

export const updateCartItemSchema = z.object({ quantity: quantitySchema });

export const mergeCartSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().optional().nullable(),
        quantity: quantitySchema,
      }),
    )
    .max(100, 'Too many items'),
});

// ---------- Checkout ----------
export const shippingMethodSchema = z.enum(['STANDARD', 'EXPRESS', 'SAME_DAY'], {
  errorMap: () => ({ message: 'Please select a valid shipping method' }),
});

export const couponCodeSchema = z
  .string({ required_error: 'Coupon code is required' })
  .trim()
  .toUpperCase()
  .min(3, 'Coupon code must be at least 3 characters')
  .max(30, 'Coupon code must be at most 30 characters')
  .regex(/^[A-Z0-9_-]+$/, 'Coupon code may only contain letters, numbers, hyphens and underscores');

export const quoteSchema = z.object({
  shippingMethod: shippingMethodSchema.default('STANDARD'),
  couponCode: couponCodeSchema.optional().nullable(),
});

export const testCardSchema = z
  .object({
    cardholderName: text('Cardholder name', 2, 100),
    cardNumber: z
      .string({ required_error: 'Card number is required' })
      .transform((v) => v.replace(/[\s-]/g, ''))
      .pipe(z.string().min(1, 'Card number is required').regex(/^\d{13,19}$/, 'Card number must be 13-19 digits')),
    expiry: z
      .string({ required_error: 'Expiry date is required' })
      .trim()
      .min(1, 'Expiry date is required')
      .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Expiry must be in MM/YY format'),
    cvc: z
      .string({ required_error: 'CVC is required' })
      .trim()
      .min(1, 'CVC is required')
      .regex(/^\d{3,4}$/, 'CVC must be 3 or 4 digits'),
  })
  .superRefine((d, ctx) => {
    if (!luhn(d.cardNumber)) ctx.addIssue({ code: 'custom', path: ['cardNumber'], message: 'Card number is invalid' });
    const m = /^(\d{2})\/(\d{2})$/.exec(d.expiry);
    if (m) {
      const month = Number(m[1]);
      const year = 2000 + Number(m[2]);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59);
      if (endOfMonth < new Date()) ctx.addIssue({ code: 'custom', path: ['expiry'], message: 'Card has expired' });
    }
  });

export function luhn(num: string) {
  let sum = 0;
  let dbl = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = Number(num[i]);
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

export const createOrderSchema = z.object({
  addressId: z.string({ required_error: 'Shipping address is required' }).min(1, 'Shipping address is required'),
  shippingMethod: shippingMethodSchema,
  couponCode: couponCodeSchema.optional().nullable(),
  notes: optionalText('Order notes', 500),
  payment: z.discriminatedUnion('method', [
    z.object({ method: z.literal('test_card'), card: testCardSchema }),
    z.object({ method: z.literal('stripe'), paymentIntentId: z.string().min(1, 'Payment is required') }),
    z.object({ method: z.literal('cod') }),
  ]),
});

// ---------- Reviews ----------
export const reviewSchema = z.object({
  rating: z.coerce
    .number({ invalid_type_error: 'Rating is required' })
    .int('Rating must be a whole number')
    .min(1, 'Please select a rating between 1 and 5')
    .max(5, 'Please select a rating between 1 and 5'),
  title: text('Title', 3, 100),
  comment: text('Comment', 10, 1000),
});

// ---------- Misc ----------
export const newsletterSchema = z.object({ email: emailSchema });

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  pageSize: z.coerce.number().int().min(1).max(100, 'Page size cannot exceed 100').default(20),
});

export const productQuerySchema = paginationSchema
  .extend({
    q: z.string().trim().max(100, 'Search query is too long').optional(),
    category: z.string().optional(),
    brand: z.string().optional(),
    minPrice: z.coerce.number().min(0, 'Minimum price cannot be negative').optional(),
    maxPrice: z.coerce.number().min(0, 'Maximum price cannot be negative').optional(),
    rating: z.coerce.number().int().min(1).max(5).optional(),
    availability: z.enum(['in_stock', 'out_of_stock', 'all']).optional(),
    sort: z.enum(['price_asc', 'price_desc', 'newest', 'best_seller', 'rating']).optional(),
    featured: z.enum(['true', 'false']).optional(),
  })
  .refine((d) => d.minPrice === undefined || d.maxPrice === undefined || d.minPrice <= d.maxPrice, {
    path: ['maxPrice'],
    message: 'Maximum price must be greater than or equal to minimum price',
  });

// ---------- Admin ----------
const money = (label: string) =>
  z.coerce
    .number({ invalid_type_error: `${label} must be a number` })
    .min(0.01, `${label} must be greater than 0`)
    .max(999999.99, `${label} must be less than 1,000,000`);

export const variantInputSchema = z.object({
  id: z.string().optional(),
  sku: text('Variant SKU', 2, 50),
  size: optionalText('Size', 20),
  color: optionalText('Color', 30),
  priceDelta: z.coerce.number().min(-99999).max(99999).default(0),
  stock: z.coerce.number().int('Stock must be a whole number').min(0, 'Stock cannot be negative').max(100000),
});

export const productInputSchema = z
  .object({
    name: text('Product name', 3, 120),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug may only contain lowercase letters, numbers and hyphens')
      .max(140)
      .optional()
      .or(z.literal('')),
    description: text('Description', 20, 5000),
    brand: text('Brand', 2, 60),
    sku: text('SKU', 3, 50),
    price: money('Price'),
    compareAtPrice: z.coerce.number().min(0).max(999999.99).optional().nullable(),
    stock: z.coerce
      .number({ invalid_type_error: 'Stock must be a number' })
      .int('Stock must be a whole number')
      .min(0, 'Stock cannot be negative')
      .max(100000, 'Stock cannot exceed 100,000'),
    lowStockThreshold: z.coerce.number().int().min(0).max(1000).default(5),
    categoryId: z.string({ required_error: 'Category is required' }).min(1, 'Category is required'),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    specs: z.record(z.string().max(200)).default({}),
    images: z
      .array(z.object({ url: z.string().min(1).max(500), alt: z.string().max(200).optional().nullable() }))
      .max(10, 'A product can have at most 10 images')
      .default([]),
    variants: z.array(variantInputSchema).max(50).default([]),
  })
  .refine((d) => !d.compareAtPrice || d.compareAtPrice > d.price, {
    path: ['compareAtPrice'],
    message: 'Compare-at price must be greater than price',
  });

export const bulkProductActionSchema = z.object({
  ids: z.array(z.string()).min(1, 'Select at least one product'),
  action: z.enum(['activate', 'deactivate', 'delete', 'feature', 'unfeature']),
});

export const categoryInputSchema = z.object({
  name: text('Category name', 2, 60),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug may only contain lowercase letters, numbers and hyphens')
    .optional()
    .or(z.literal('')),
  description: optionalText('Description', 500),
  image: z.string().max(500).optional().nullable(),
  parentId: z.string().optional().nullable(),
});

export const orderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'], {
    errorMap: () => ({ message: 'Invalid order status' }),
  }),
  note: optionalText('Note', 300),
  trackingNumber: optionalText('Tracking number', 60),
});

export const adminUserUpdateSchema = z
  .object({
    role: z.enum(['CUSTOMER', 'ADMIN', 'SUPER_ADMIN']).optional(),
    isBanned: z.boolean().optional(),
    bannedReason: optionalText('Ban reason', 200),
    unlock: z.boolean().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), { message: 'No changes provided' });

export const couponInputSchema = z
  .object({
    code: couponCodeSchema,
    description: optionalText('Description', 200),
    type: z.enum(['PERCENTAGE', 'FIXED'], { errorMap: () => ({ message: 'Coupon type is required' }) }),
    value: z.coerce.number({ invalid_type_error: 'Value must be a number' }).positive('Value must be greater than 0'),
    minOrderAmount: z.coerce.number().min(0, 'Minimum order cannot be negative').default(0),
    maxDiscount: z.coerce.number().positive('Max discount must be greater than 0').optional().nullable(),
    usageLimit: z.coerce.number().int().positive('Usage limit must be at least 1').optional().nullable(),
    perUserLimit: z.coerce.number().int().min(1, 'Per-user limit must be at least 1').default(1),
    isActive: z.boolean().default(true),
    startsAt: z.coerce.date({ invalid_type_error: 'Start date is invalid' }).optional(),
    expiresAt: z.coerce.date({ invalid_type_error: 'Expiry date is invalid' }).optional().nullable(),
  })
  .refine((d) => d.type !== 'PERCENTAGE' || d.value <= 100, {
    path: ['value'],
    message: 'Percentage discount cannot exceed 100',
  })
  .refine((d) => !d.expiresAt || !d.startsAt || d.expiresAt > d.startsAt, {
    path: ['expiresAt'],
    message: 'Expiry date must be after start date',
  });

export const inventoryBulkSchema = z.object({
  updates: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().optional().nullable(),
        stock: z.coerce.number().int('Stock must be a whole number').min(0, 'Stock cannot be negative').max(100000),
      }),
    )
    .min(1, 'Provide at least one update')
    .max(500),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type ProductInput = z.infer<typeof productInputSchema>;
export type CouponInput = z.infer<typeof couponInputSchema>;
