/* eslint-disable no-console */
import { PrismaClient, type OrderStatus, type Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Deterministic PRNG so seeded data is identical on every run (stable test fixtures).
let seed = 42;
const rand = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const round2 = (n: number) => Math.round(n * 100) / 100;
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
const img = (text: string, color: string) => `/api/images/placeholder?text=${encodeURIComponent(text)}&color=${color}`;
const daysAgo = (d: number) => new Date(Date.now() - d * 86400_000);

type ProductSeed = {
  name: string;
  brand: string;
  price: number;
  compareAt?: number;
  stock: number;
  sub?: string;
  specs: Record<string, string>;
  variants?: { size?: string; color?: string; priceDelta?: number; stock: number }[];
  featured?: boolean;
  description: string;
};

const CATEGORIES: { name: string; slug: string; color: string; description: string; subs: string[] }[] = [
  { name: 'Electronics', slug: 'electronics', color: '4f46e5', description: 'Phones, laptops, audio and smart devices.', subs: ['Audio', 'Computers', 'Phones'] },
  { name: 'Fashion', slug: 'fashion', color: 'db2777', description: 'Clothing, shoes and accessories.', subs: ['Men', 'Women'] },
  { name: 'Food', slug: 'food', color: 'ea580c', description: 'Gourmet snacks, coffee and pantry staples.', subs: ['Beverages', 'Snacks'] },
  { name: 'Books', slug: 'books', color: '059669', description: 'Fiction, non-fiction and technical books.', subs: ['Fiction', 'Non-Fiction'] },
  { name: 'Sports', slug: 'sports', color: '0284c7', description: 'Fitness, outdoor and team sports gear.', subs: ['Fitness', 'Outdoor'] },
];

const SIZES = ['S', 'M', 'L', 'XL'];
const SHOE_SIZES = ['40', '41', '42', '43', '44'];

const PRODUCTS: Record<string, ProductSeed[]> = {
  electronics: [
    { name: 'AuraSound Pro Wireless Headphones', brand: 'AuraSound', price: 199.99, compareAt: 249.99, stock: 45, sub: 'Audio', featured: true, specs: { 'Battery life': '40 hours', Connectivity: 'Bluetooth 5.3', 'Noise cancelling': 'Active (ANC)', Weight: '250 g' }, variants: [{ color: 'Black', stock: 20 }, { color: 'Silver', stock: 15 }, { color: 'Navy', stock: 10 }], description: 'Immersive over-ear headphones with adaptive noise cancellation, 40-hour battery and plush memory-foam cushions for all-day comfort.' },
    { name: 'AuraSound Buds Mini', brand: 'AuraSound', price: 79.99, stock: 120, sub: 'Audio', specs: { 'Battery life': '24 hours with case', 'Water resistance': 'IPX5', Connectivity: 'Bluetooth 5.2' }, description: 'Compact true-wireless earbuds with punchy bass, touch controls and a pocket-sized charging case.' },
    { name: 'NovaBook Air 14 Laptop', brand: 'Nova', price: 1099.0, compareAt: 1299.0, stock: 12, sub: 'Computers', featured: true, specs: { Processor: 'Nova N3 8-core', RAM: '16 GB', Display: '14" 2.8K OLED', Weight: '1.2 kg' }, variants: [{ size: '256GB', stock: 6 }, { size: '512GB', priceDelta: 200, stock: 4 }, { size: '1TB', priceDelta: 400, stock: 2 }], description: 'Ultra-thin 14-inch laptop with a stunning OLED display, all-day battery and a silent fanless design.' },
    { name: 'NovaPhone 15', brand: 'Nova', price: 899.0, stock: 30, sub: 'Phones', featured: true, specs: { Display: '6.1" AMOLED 120Hz', Camera: '50MP triple', Battery: '4500 mAh', '5G': 'Yes' }, variants: [{ color: 'Graphite', stock: 12 }, { color: 'Glacier', stock: 10 }, { color: 'Rose', stock: 8 }], description: 'Flagship smartphone with a pro-grade triple camera, 120Hz display and fast wireless charging.' },
    { name: 'PixelView 27" 4K Monitor', brand: 'PixelView', price: 349.99, stock: 3, sub: 'Computers', specs: { Resolution: '3840x2160', Panel: 'IPS', 'Refresh rate': '60Hz', Ports: 'HDMI, DisplayPort, USB-C' }, description: 'Color-accurate 27-inch 4K IPS monitor with USB-C power delivery — perfect for creators.' },
    { name: 'VoltCharge 65W GaN Charger', brand: 'VoltCharge', price: 39.99, stock: 200, specs: { Output: '65W', Ports: '2x USB-C, 1x USB-A', Technology: 'GaN III' }, description: 'Compact multi-port fast charger that powers your laptop, phone and tablet at the same time.' },
    { name: 'SmartHome Hub Mini', brand: 'Homely', price: 59.99, compareAt: 79.99, stock: 0, specs: { Protocols: 'Zigbee, Wi-Fi, Matter', Voice: 'Built-in assistant' }, description: 'Control lights, plugs and sensors from one tiny hub with Matter support.' },
    { name: 'ClickPro Mechanical Keyboard', brand: 'ClickPro', price: 129.99, stock: 40, sub: 'Computers', specs: { Switches: 'Hot-swappable brown', Layout: '75%', Backlight: 'RGB' }, variants: [{ color: 'White', stock: 20 }, { color: 'Black', stock: 20 }], description: 'Premium 75% mechanical keyboard with hot-swappable switches and gasket-mounted typing feel.' },
    { name: 'GlidePro Wireless Mouse', brand: 'ClickPro', price: 49.99, stock: 4, sub: 'Computers', specs: { DPI: '26,000', Battery: '70 hours', Weight: '63 g' }, description: 'Ultra-light ergonomic wireless mouse with a precision sensor and silent clicks.' },
    { name: 'BoomBox Portable Speaker', brand: 'AuraSound', price: 89.99, stock: 60, sub: 'Audio', specs: { 'Battery life': '20 hours', 'Water resistance': 'IP67', Power: '30W' }, description: 'Rugged waterproof Bluetooth speaker with 360° sound for the beach, park or pool.' },
  ],
  fashion: [
    { name: 'Classic Oxford Shirt', brand: 'Threadline', price: 49.99, stock: 80, sub: 'Men', featured: true, specs: { Material: '100% cotton', Fit: 'Slim', Care: 'Machine wash' }, variants: SIZES.flatMap((s) => [{ size: s, color: 'White', stock: 10 }, { size: s, color: 'Blue', stock: 10 }]), description: 'A timeless button-down Oxford shirt in breathable cotton with a tailored slim fit.' },
    { name: 'Everyday Slim Chinos', brand: 'Threadline', price: 59.99, compareAt: 79.99, stock: 60, sub: 'Men', specs: { Material: '98% cotton, 2% elastane', Fit: 'Slim tapered' }, variants: ['30', '32', '34', '36'].map((s) => ({ size: s, color: 'Khaki', stock: 15 })), description: 'Comfortable stretch chinos that go from office to weekend with ease.' },
    { name: 'Floral Midi Dress', brand: 'Bloom & Co', price: 89.99, stock: 30, sub: 'Women', featured: true, specs: { Material: 'Viscose', Length: 'Midi', Lining: 'Yes' }, variants: SIZES.map((s) => ({ size: s, color: 'Floral', stock: s === 'XL' ? 0 : 10 })), description: 'Flowing midi dress with a vibrant floral print, flutter sleeves and a flattering wrap waist.' },
    { name: 'Cloudstep Running Sneakers', brand: 'Stride', price: 119.99, stock: 50, specs: { Upper: 'Engineered mesh', Sole: 'Responsive foam', Drop: '8 mm' }, variants: SHOE_SIZES.flatMap((s) => [{ size: s, color: 'Black', stock: 5 }, { size: s, color: 'White', stock: 5 }]), description: 'Lightweight, cushioned sneakers built for daily miles and all-day comfort.' },
    { name: 'Leather Crossbody Bag', brand: 'Bloom & Co', price: 149.0, stock: 2, sub: 'Women', specs: { Material: 'Full-grain leather', Dimensions: '24 x 16 x 7 cm' }, variants: [{ color: 'Tan', stock: 1 }, { color: 'Black', stock: 1 }], description: 'Handcrafted leather crossbody with an adjustable strap and secure zip closure.' },
    { name: 'Merino Wool Sweater', brand: 'Threadline', price: 99.0, stock: 0, sub: 'Men', specs: { Material: '100% merino wool', Fit: 'Regular' }, variants: SIZES.map((s) => ({ size: s, color: 'Charcoal', stock: 0 })), description: 'Soft, temperature-regulating merino sweater for chilly days.' },
    { name: 'Polarized Aviator Sunglasses', brand: 'SunRay', price: 69.99, stock: 75, specs: { Lens: 'Polarized UV400', Frame: 'Metal' }, description: 'Classic aviators with polarized lenses that cut glare and protect your eyes.' },
    { name: 'High-Rise Denim Jeans', brand: 'Bloom & Co', price: 79.99, stock: 45, sub: 'Women', specs: { Material: 'Stretch denim', Rise: 'High' }, variants: ['26', '28', '30', '32'].map((s) => ({ size: s, color: 'Indigo', stock: 11 })), description: 'Figure-flattering high-rise jeans with just the right amount of stretch.' },
    { name: 'Canvas Weekender Tote', brand: 'Threadline', price: 45.0, stock: 90, specs: { Material: 'Waxed canvas', Capacity: '30 L' }, description: 'Durable waxed canvas tote with leather handles — perfect for weekend getaways.' },
    { name: 'Minimalist Steel Watch', brand: 'Chrono', price: 189.0, compareAt: 229.0, stock: 18, specs: { Movement: 'Japanese quartz', 'Water resistance': '50 m', Case: '40 mm' }, variants: [{ color: 'Silver', stock: 10 }, { color: 'Gold', priceDelta: 20, stock: 8 }], description: 'Clean, minimalist watch with a sapphire-coated crystal and stainless steel mesh strap.' },
  ],
  food: [
    { name: 'Single-Origin Ethiopian Coffee Beans', brand: 'Roastery 9', price: 18.99, stock: 150, sub: 'Beverages', featured: true, specs: { Weight: '340 g', Roast: 'Light', Notes: 'Blueberry, jasmine' }, variants: [{ size: 'Whole bean', stock: 80 }, { size: 'Ground', stock: 70 }], description: 'Bright and floral single-origin beans, roasted in small batches for peak freshness.' },
    { name: 'Organic Matcha Powder', brand: 'Leaf & Co', price: 24.99, stock: 70, sub: 'Beverages', specs: { Weight: '100 g', Grade: 'Ceremonial', Origin: 'Uji, Japan' }, description: 'Vibrant ceremonial-grade matcha stone-ground from shade-grown tea leaves.' },
    { name: 'Dark Chocolate Sea Salt Bar', brand: 'Cacao Lab', price: 5.99, stock: 300, sub: 'Snacks', specs: { Cocoa: '72%', Weight: '90 g', Vegan: 'Yes' }, description: 'Rich 72% dark chocolate with a sprinkle of flaky sea salt.' },
    { name: 'Mixed Nuts Trail Mix', brand: 'Trailhead', price: 12.49, stock: 5, sub: 'Snacks', specs: { Weight: '500 g', Contains: 'Almonds, cashews, cranberries' }, description: 'A wholesome mix of roasted nuts, seeds and dried fruit for energy on the go.' },
    { name: 'Extra Virgin Olive Oil', brand: 'Oliva', price: 22.0, stock: 85, specs: { Volume: '750 ml', Origin: 'Crete, Greece', Acidity: '< 0.3%' }, description: 'Cold-pressed extra virgin olive oil with a fruity, peppery finish.' },
    { name: 'Wildflower Raw Honey', brand: 'Beehive', price: 14.5, stock: 0, specs: { Weight: '500 g', Type: 'Raw, unfiltered' }, description: 'Pure raw honey harvested from wildflower meadows — never heated or filtered.' },
    { name: 'Artisan Pasta Variety Pack', brand: 'Nonna', price: 16.99, stock: 60, specs: { Weight: '4 x 500 g', Shapes: 'Rigatoni, fusilli, penne, linguine' }, description: 'Bronze-cut Italian pasta in four classic shapes.' },
    { name: 'Sparkling Yuzu Lemonade (12 pack)', brand: 'Fizz', price: 19.99, stock: 40, sub: 'Beverages', specs: { Volume: '12 x 330 ml', Sugar: 'Low' }, description: 'Refreshing sparkling lemonade with Japanese yuzu citrus.' },
    { name: 'Spicy Kettle Chips', brand: 'Crunch', price: 3.99, stock: 220, sub: 'Snacks', specs: { Weight: '150 g', Heat: 'Medium' }, description: 'Thick-cut kettle chips seasoned with smoky chipotle and lime.' },
    { name: 'Earl Grey Loose Leaf Tea', brand: 'Leaf & Co', price: 11.99, stock: 95, sub: 'Beverages', specs: { Weight: '125 g', Caffeine: 'Medium' }, description: 'Fragrant black tea infused with natural bergamot oil.' },
  ],
  books: [
    { name: 'The Midnight Library', brand: 'Penfold Press', price: 16.99, stock: 50, sub: 'Fiction', featured: true, specs: { Author: 'Matt Haig', Pages: '304', Format: 'Paperback' }, description: 'Between life and death there is a library, and within that library, the shelves go on forever.' },
    { name: 'Atomic Habits', brand: 'Avery', price: 21.99, compareAt: 27.0, stock: 110, sub: 'Non-Fiction', featured: true, specs: { Author: 'James Clear', Pages: '320', Format: 'Hardcover' }, description: 'An easy and proven way to build good habits and break bad ones.' },
    { name: 'Clean Code', brand: 'Prentice Hall', price: 39.99, stock: 25, sub: 'Non-Fiction', specs: { Author: 'Robert C. Martin', Pages: '464', Format: 'Paperback' }, description: 'A handbook of agile software craftsmanship.' },
    { name: 'Project Hail Mary', brand: 'Ballantine', price: 18.99, stock: 40, sub: 'Fiction', specs: { Author: 'Andy Weir', Pages: '496', Format: 'Paperback' }, description: 'A lone astronaut must save the earth from disaster in this gripping sci-fi adventure.' },
    { name: 'Sapiens: A Brief History of Humankind', brand: 'Harper', price: 19.99, stock: 3, sub: 'Non-Fiction', specs: { Author: 'Yuval Noah Harari', Pages: '464', Format: 'Paperback' }, description: 'How Homo sapiens came to dominate the planet.' },
    { name: 'The Pragmatic Programmer', brand: 'Addison-Wesley', price: 44.99, stock: 20, sub: 'Non-Fiction', specs: { Authors: 'Hunt & Thomas', Pages: '352', Edition: '20th Anniversary' }, description: 'Your journey to mastery — timeless advice for software developers.' },
    { name: 'Dune', brand: 'Ace', price: 12.99, stock: 0, sub: 'Fiction', specs: { Author: 'Frank Herbert', Pages: '688', Format: 'Mass market' }, description: 'The epic science-fiction saga of politics, religion and ecology on the desert planet Arrakis.' },
    { name: 'Testing JavaScript Applications', brand: 'Manning', price: 49.99, stock: 15, sub: 'Non-Fiction', specs: { Author: 'Lucas da Costa', Pages: '584', Topics: 'Unit, integration, E2E' }, description: 'A practical guide to testing JavaScript with modern tools including Playwright.' },
    { name: 'The Silent Patient', brand: 'Celadon', price: 14.99, stock: 65, sub: 'Fiction', specs: { Author: 'Alex Michaelides', Pages: '336', Genre: 'Thriller' }, description: 'A woman shoots her husband and never speaks another word. A shocking psychological thriller.' },
    { name: 'Deep Work', brand: 'Grand Central', price: 17.5, stock: 55, sub: 'Non-Fiction', specs: { Author: 'Cal Newport', Pages: '304', Format: 'Paperback' }, description: 'Rules for focused success in a distracted world.' },
  ],
  sports: [
    { name: 'ProGrip Yoga Mat', brand: 'ZenFlex', price: 39.99, stock: 100, sub: 'Fitness', featured: true, specs: { Thickness: '6 mm', Material: 'Natural rubber', Size: '183 x 61 cm' }, variants: [{ color: 'Purple', stock: 40 }, { color: 'Teal', stock: 35 }, { color: 'Black', stock: 25 }], description: 'Non-slip, cushioned yoga mat with alignment lines for every practice.' },
    { name: 'Adjustable Dumbbell Set', brand: 'IronCore', price: 299.0, compareAt: 349.0, stock: 8, sub: 'Fitness', specs: { 'Weight range': '2.5 - 24 kg', Increments: '15 settings' }, description: 'Space-saving adjustable dumbbells that replace 15 sets of weights.' },
    { name: 'Trailblazer 35L Hiking Backpack', brand: 'Summit', price: 129.0, stock: 35, sub: 'Outdoor', specs: { Capacity: '35 L', Weight: '1.1 kg', 'Rain cover': 'Included' }, variants: [{ color: 'Forest', stock: 15 }, { color: 'Slate', stock: 20 }], description: 'Ventilated hiking pack with a hydration sleeve and integrated rain cover.' },
    { name: 'Pro Match Football', brand: 'Kickoff', price: 34.99, stock: 140, specs: { Size: '5', Construction: 'Thermo-bonded' }, description: 'FIFA-quality match ball with superb touch and flight stability.' },
    { name: 'Resistance Bands Set', brand: 'ZenFlex', price: 24.99, stock: 4, sub: 'Fitness', specs: { Bands: '5 levels', Includes: 'Handles, door anchor' }, description: 'Versatile resistance bands for strength training anywhere.' },
    { name: 'Ultralight Camping Tent (2P)', brand: 'Summit', price: 249.0, stock: 0, sub: 'Outdoor', specs: { Capacity: '2 person', Weight: '1.4 kg', Season: '3-season' }, description: 'Freestanding ultralight tent that sets up in minutes.' },
    { name: 'Insulated Steel Water Bottle', brand: 'Hydro', price: 29.99, stock: 180, specs: { Capacity: '750 ml', 'Keeps cold': '24 hours' }, variants: [{ color: 'Black', stock: 60 }, { color: 'White', stock: 60 }, { color: 'Ocean', stock: 60 }], description: 'Double-wall insulated bottle that keeps drinks cold for 24 hours or hot for 12.' },
    { name: 'Performance Running Shorts', brand: 'Stride', price: 34.99, stock: 70, sub: 'Fitness', specs: { Material: 'Recycled polyester', Liner: 'Built-in' }, variants: SIZES.map((s) => ({ size: s, color: 'Black', stock: 17 })), description: 'Lightweight running shorts with a zip pocket and reflective details.' },
    { name: 'Carbon Tennis Racket', brand: 'Ace', price: 179.0, stock: 14, specs: { Weight: '300 g', 'Head size': '100 sq in', Material: 'Graphite' }, description: 'Powerful, control-oriented racket for intermediate to advanced players.' },
    { name: 'Speed Jump Rope', brand: 'IronCore', price: 15.99, stock: 210, sub: 'Fitness', specs: { Cable: 'Adjustable steel', Bearings: 'Ball-bearing handles' }, description: 'Lightning-fast jump rope for HIIT, boxing and double-unders.' },
  ],
};

const FIRST = ['Alice', 'Bob', 'Charlie', 'Diana', 'Ethan', 'Fiona', 'George', 'Hannah', 'Ivan', 'Julia'];
const LAST = ['Johnson', 'Smith', 'Brown', 'Prince', 'Hunt', 'Gallagher', 'Miller', 'Lee', 'Petrov', 'Roberts'];
const CITIES = [
  { city: 'San Francisco', state: 'CA', postalCode: '94105' },
  { city: 'New York', state: 'NY', postalCode: '10001' },
  { city: 'Austin', state: 'TX', postalCode: '73301' },
  { city: 'Seattle', state: 'WA', postalCode: '98101' },
  { city: 'Chicago', state: 'IL', postalCode: '60601' },
];
const REVIEW_TITLES = ['Excellent quality!', 'Great value for money', 'Exactly as described', 'Pretty good overall', 'Would buy again', 'Not bad', 'Love it!', 'Decent but could be better'];
const REVIEW_TEXT = [
  'Arrived quickly and well packaged. The quality exceeded my expectations and I use it every day.',
  'Solid product for the price. A couple of minor issues but nothing that would stop me recommending it.',
  'Really happy with this purchase. It looks great and works exactly as the description says.',
  'Good product, though delivery took a bit longer than expected. Customer support was helpful.',
  'Fantastic! I bought one for myself and ended up ordering another as a gift for a friend.',
  'It is okay. Does the job but I expected slightly better build quality at this price point.',
];

async function reset() {
  // Delete in dependency order so seeding is idempotent.
  await prisma.$transaction([
    prisma.reviewVote.deleteMany(),
    prisma.review.deleteMany(),
    prisma.couponUsage.deleteMany(),
    prisma.orderStatusHistory.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.coupon.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.cart.deleteMany(),
    prisma.wishlistItem.deleteMany(),
    prisma.productVariant.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.searchHistory.deleteMany(),
    prisma.address.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.verificationToken.deleteMany(),
    prisma.newsletterSubscriber.deleteMany(),
    prisma.emailLog.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

async function main() {
  console.log('🌱 Resetting database…');
  await reset();

  // ---------- Users ----------
  console.log('👤 Creating users…');
  const [superHash, adminHash, customerHash] = await Promise.all([
    bcrypt.hash('SuperAdmin@123', 10),
    bcrypt.hash('Admin@123', 10),
    bcrypt.hash('Customer@123', 10),
  ]);
  const verified = daysAgo(120);
  await prisma.user.create({ data: { email: 'superadmin@nexashop.test', name: 'Sam Superadmin', role: 'SUPER_ADMIN', passwordHash: superHash, emailVerified: verified, createdAt: daysAgo(365) } });
  await prisma.user.create({ data: { email: 'admin1@nexashop.test', name: 'Avery Admin', role: 'ADMIN', passwordHash: adminHash, emailVerified: verified, createdAt: daysAgo(300) } });
  await prisma.user.create({ data: { email: 'admin2@nexashop.test', name: 'Morgan Admin', role: 'ADMIN', passwordHash: adminHash, emailVerified: verified, createdAt: daysAgo(280) } });

  const customers: Awaited<ReturnType<typeof prisma.user.create>>[] = [];
  for (let i = 0; i < 10; i++) {
    const loc = CITIES[i % CITIES.length];
    const name = `${FIRST[i]} ${LAST[i]}`;
    customers.push(
      await prisma.user.create({
        data: {
          email: `customer${i + 1}@nexashop.test`,
          name,
          role: 'CUSTOMER',
          passwordHash: customerHash,
          phone: `+1 555 010 ${String(1000 + i)}`,
          emailVerified: verified,
          createdAt: daysAgo(200 - i * 10),
          addresses: {
            create: [
              { label: 'Home', fullName: name, phone: `+1 555 010 ${String(1000 + i)}`, line1: `${100 + i * 7} Market Street`, line2: i % 2 ? `Apt ${i + 2}B` : null, ...loc, country: 'United States', isDefault: true },
              ...(i < 3 ? [{ label: 'Office', fullName: name, phone: `+1 555 020 ${String(2000 + i)}`, line1: `${500 + i} Business Ave`, city: 'Boston', state: 'MA', postalCode: '02108', country: 'United States', isDefault: false }] : []),
            ],
          },
        },
      }),
    );
  }
  // Special accounts for negative test scenarios.
  await prisma.user.create({ data: { email: 'banned@nexashop.test', name: 'Bert Banned', passwordHash: customerHash, emailVerified: verified, isBanned: true, bannedReason: 'Violation of terms of service' } });
  await prisma.user.create({ data: { email: 'unverified@nexashop.test', name: 'Una Unverified', passwordHash: customerHash, emailVerified: null } });
  await prisma.user.create({ data: { email: 'lockout@nexashop.test', name: 'Larry Lockout', passwordHash: customerHash, emailVerified: verified } });
  await prisma.user.create({ data: { email: 'empty@nexashop.test', name: 'Emma Empty', passwordHash: customerHash, emailVerified: verified } });

  // ---------- Categories ----------
  console.log('🗂  Creating categories…');
  const catBySlug: Record<string, { id: string; color: string }> = {};
  for (const c of CATEGORIES) {
    const parent = await prisma.category.create({ data: { name: c.name, slug: c.slug, description: c.description, image: img(c.name, c.color) } });
    catBySlug[c.slug] = { id: parent.id, color: c.color };
    for (const s of c.subs) {
      const sub = await prisma.category.create({ data: { name: s, slug: `${c.slug}-${slugify(s)}`, description: `${s} in ${c.name}`, parentId: parent.id } });
      catBySlug[`${c.slug}-${slugify(s)}`] = { id: sub.id, color: c.color };
    }
  }

  // ---------- Products ----------
  console.log('📦 Creating 50 products…');
  const products: { id: string; name: string; price: number; image: string; variants: { id: string; size: string | null; color: string | null; priceDelta: number }[] }[] = [];
  let skuN = 1000;
  let createdOffset = 0;
  for (const [catSlug, list] of Object.entries(PRODUCTS)) {
    for (const p of list) {
      const cat = p.sub ? catBySlug[`${catSlug}-${slugify(p.sub)}`] : catBySlug[catSlug];
      const sku = `NX-${catSlug.slice(0, 3).toUpperCase()}-${skuN++}`;
      const stock = p.variants ? p.variants.reduce((s, v) => s + v.stock, 0) : p.stock;
      const created = await prisma.product.create({
        data: {
          name: p.name,
          slug: slugify(p.name),
          description: `${p.description}\n\nBacked by our 30-day hassle-free return policy and a 1-year limited warranty.`,
          brand: p.brand,
          sku,
          price: p.price,
          compareAtPrice: p.compareAt ?? null,
          stock,
          lowStockThreshold: 5,
          specs: p.specs,
          isFeatured: Boolean(p.featured),
          categoryId: cat.id,
          createdAt: daysAgo(90 - createdOffset++),
          images: {
            create: [
              { url: img(p.name, cat.color), alt: p.name, position: 0 },
              { url: img(`${p.brand} detail`, cat.color.replace(/^(..)/, 'aa')), alt: `${p.name} detail`, position: 1 },
              { url: img(`${p.brand} lifestyle`, '1f2937'), alt: `${p.name} lifestyle`, position: 2 },
            ],
          },
          variants: p.variants
            ? {
                create: p.variants.map((v, i) => ({
                  sku: `${sku}-${[v.size, v.color].filter(Boolean).join('-').toUpperCase().replace(/\s+/g, '') || i}`,
                  size: v.size ?? null,
                  color: v.color ?? null,
                  priceDelta: v.priceDelta ?? 0,
                  stock: v.stock,
                })),
              }
            : undefined,
        },
        include: { variants: true },
      });
      products.push({
        id: created.id,
        name: created.name,
        price: p.price,
        image: img(p.name, cat.color),
        variants: created.variants.map((v) => ({ id: v.id, size: v.size, color: v.color, priceDelta: Number(v.priceDelta) })),
      });
    }
  }

  // ---------- Coupons ----------
  console.log('🎟  Creating coupons…');
  await prisma.coupon.createMany({
    data: [
      { code: 'WELCOME10', description: '10% off your order', type: 'PERCENTAGE', value: 10, perUserLimit: 1, startsAt: daysAgo(60) },
      { code: 'SAVE20', description: '$20 off orders over $100', type: 'FIXED', value: 20, minOrderAmount: 100, perUserLimit: 3, startsAt: daysAgo(60) },
      { code: 'SUMMER25', description: '25% off (max $50)', type: 'PERCENTAGE', value: 25, maxDiscount: 50, perUserLimit: 2, usageLimit: 500, startsAt: daysAgo(30), expiresAt: daysAgo(-90) },
      { code: 'FLASH15', description: '15% off orders over $50', type: 'PERCENTAGE', value: 15, minOrderAmount: 50, perUserLimit: 5, startsAt: daysAgo(10), expiresAt: daysAgo(-30) },
      { code: 'BIGSPENDER', description: '$50 off orders over $300', type: 'FIXED', value: 50, minOrderAmount: 300, perUserLimit: 1, startsAt: daysAgo(60) },
      // Negative-test coupons
      { code: 'EXPIRED10', description: 'Expired coupon', type: 'PERCENTAGE', value: 10, startsAt: daysAgo(60), expiresAt: daysAgo(1) },
      { code: 'INACTIVE5', description: 'Inactive coupon', type: 'FIXED', value: 5, isActive: false, startsAt: daysAgo(60) },
      { code: 'LIMITREACHED', description: 'Usage limit reached', type: 'PERCENTAGE', value: 20, usageLimit: 1, usedCount: 1, startsAt: daysAgo(60) },
      { code: 'FUTURE30', description: 'Not yet valid', type: 'PERCENTAGE', value: 30, startsAt: daysAgo(-10) },
    ],
  });

  // ---------- Orders + Reviews ----------
  console.log('🧾 Creating 20 delivered orders with reviews…');
  const reviewed = new Set<string>();
  const createOrder = async (customer: (typeof customers)[number], status: OrderStatus, ageDays: number, n: number) => {
    const address = await prisma.address.findFirstOrThrow({ where: { userId: customer.id, isDefault: true } });
    const chosen = new Map<string, { product: (typeof products)[number]; variant: (typeof products)[number]['variants'][number] | null; qty: number }>();
    while (chosen.size < n) {
      const product = pick(products);
      if (!chosen.has(product.id)) chosen.set(product.id, { product, variant: product.variants.length ? pick(product.variants) : null, qty: int(1, 2) });
    }
    const lines = Array.from(chosen.values());
    const subtotal = round2(lines.reduce((s, l) => s + (l.product.price + (l.variant?.priceDelta ?? 0)) * l.qty, 0));
    const shippingMethod = pick(['STANDARD', 'STANDARD', 'EXPRESS', 'SAME_DAY'] as const);
    const shippingCost = shippingMethod === 'STANDARD' ? (subtotal >= 100 ? 0 : 5.99) : shippingMethod === 'EXPRESS' ? 14.99 : 24.99;
    const tax = round2(subtotal * 0.1);
    const createdAt = daysAgo(ageDays);
    const flow: OrderStatus[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    const history = status === 'CANCELLED' ? (['PENDING', 'CANCELLED'] as OrderStatus[]) : flow.slice(0, flow.indexOf(status) + 1);
    const order = await prisma.order.create({
      data: {
        orderNumber: `NX-${createdAt.toISOString().slice(0, 10).replace(/-/g, '')}-${String(int(100000, 999999))}`,
        userId: customer.id,
        status,
        paymentStatus: status === 'CANCELLED' ? 'REFUNDED' : 'PAID',
        paymentMethod: 'Card ending 4242',
        shippingMethod,
        shippingAddress: {
          fullName: address.fullName,
          phone: address.phone,
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
        } satisfies Prisma.InputJsonValue,
        subtotal,
        shippingCost,
        tax,
        total: round2(subtotal + shippingCost + tax),
        trackingNumber: ['SHIPPED', 'DELIVERED'].includes(status) ? `1Z${int(10000000, 99999999)}` : null,
        createdAt,
        cancelledAt: status === 'CANCELLED' ? new Date(createdAt.getTime() + 3600_000) : null,
        items: {
          create: lines.map((l) => ({
            productId: l.product.id,
            variantId: l.variant?.id ?? null,
            name: l.product.name,
            variantName: l.variant ? [l.variant.size, l.variant.color].filter(Boolean).join(' / ') : null,
            image: l.product.image,
            unitPrice: round2(l.product.price + (l.variant?.priceDelta ?? 0)),
            quantity: l.qty,
          })),
        },
        statusHistory: {
          create: history.map((s, i) => ({ status: s, note: s === 'PENDING' ? 'Order placed' : `Status updated to ${s}`, createdAt: new Date(createdAt.getTime() + i * 86400_000) })),
        },
      },
    });
    for (const l of lines) await prisma.product.update({ where: { id: l.product.id }, data: { soldCount: { increment: l.qty } } });
    if (status === 'DELIVERED') {
      for (const l of lines) {
        const key = `${l.product.id}:${customer.id}`;
        if (reviewed.has(key)) continue;
        reviewed.add(key);
        await prisma.review.create({
          data: {
            productId: l.product.id,
            userId: customer.id,
            rating: pick([5, 5, 4, 4, 4, 3, 5, 2]),
            title: pick(REVIEW_TITLES),
            comment: pick(REVIEW_TEXT),
            helpfulCount: int(0, 12),
            createdAt: new Date(createdAt.getTime() + 5 * 86400_000),
          },
        });
      }
    }
    return order;
  };

  for (let i = 0; i < 20; i++) await createOrder(customers[i % 10], 'DELIVERED', 5 + i * 3, int(1, 3));
  // Additional in-flight orders for status tracking / cancellation tests.
  const pending = await createOrder(customers[0], 'PENDING', 1, 2);
  await createOrder(customers[0], 'PROCESSING', 2, 1);
  await createOrder(customers[1], 'SHIPPED', 3, 2);
  await createOrder(customers[1], 'CANCELLED', 10, 1);
  await createOrder(customers[2], 'PENDING', 0, 1);

  // Recompute cached rating aggregates.
  const aggs = await prisma.review.groupBy({ by: ['productId'], _avg: { rating: true }, _count: true });
  for (const a of aggs)
    await prisma.product.update({ where: { id: a.productId }, data: { ratingAvg: Math.round((a._avg.rating ?? 0) * 10) / 10, ratingCount: a._count } });

  // ---------- Wishlist / cart samples ----------
  await prisma.wishlistItem.createMany({ data: products.slice(0, 3).map((p) => ({ userId: customers[0].id, productId: p.id })) });
  const simple = products.filter((p) => !p.variants.length);
  await prisma.cart.create({ data: { userId: customers[0].id, items: { create: [{ productId: simple[0].id, quantity: 1 }] } } });

  // ---------- Notifications ----------
  console.log('🔔 Creating notifications…');
  const notes: Prisma.NotificationCreateManyInput[] = [];
  for (const c of customers) {
    notes.push(
      { userId: c.id, type: 'ACCOUNT', title: 'Welcome to NexaShop!', message: 'Thanks for joining. Explore thousands of products.', link: '/products', isRead: true, createdAt: c.createdAt },
      { userId: c.id, type: 'PROMOTION', title: 'Summer sale is live ☀️', message: 'Use code SUMMER25 for 25% off (max $50).', link: '/products', createdAt: daysAgo(2) },
      { userId: c.id, type: 'ORDER', title: 'Your order was delivered', message: 'We hope you love your purchase. Leave a review!', link: '/account/orders', createdAt: daysAgo(4) },
      { userId: c.id, type: 'SYSTEM', title: 'Scheduled maintenance', message: 'NexaShop will undergo maintenance on Sunday 2–3 AM UTC.', createdAt: daysAgo(6), isRead: true },
    );
  }
  notes.push({ userId: customers[0].id, type: 'ORDER', title: 'Order placed', message: `Your order ${pending.orderNumber} has been placed.`, link: `/account/orders/${pending.id}`, createdAt: daysAgo(1) });
  await prisma.notification.createMany({ data: notes });

  await prisma.newsletterSubscriber.create({ data: { email: 'subscribed@nexashop.test' } });

  const counts = await Promise.all([prisma.user.count(), prisma.product.count(), prisma.order.count(), prisma.review.count(), prisma.coupon.count()]);
  console.log(`✅ Seed complete: ${counts[0]} users, ${counts[1]} products, ${counts[2]} orders, ${counts[3]} reviews, ${counts[4]} coupons`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
