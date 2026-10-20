import Link from 'next/link';
import { ArrowRight, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { productCardInclude, toProductCard } from '@/lib/products';
import { ProductGrid } from '@/components/product/product-card';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

const CATEGORY_COLORS: Record<string, string> = {
  electronics: 'from-indigo-500 to-blue-500',
  fashion: 'from-pink-500 to-rose-500',
  food: 'from-amber-500 to-orange-500',
  books: 'from-emerald-500 to-teal-500',
  sports: 'from-sky-500 to-cyan-500',
};

export default async function HomePage() {
  const [featured, bestSellers, categories] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true, isFeatured: true }, include: productCardInclude, take: 8, orderBy: { createdAt: 'desc' } }),
    prisma.product.findMany({ where: { isActive: true }, include: productCardInclude, take: 4, orderBy: { soldCount: 'desc' } }),
    prisma.category.findMany({ where: { parentId: null }, orderBy: { name: 'asc' }, include: { _count: { select: { products: true } } } }),
  ]);

  return (
    <div data-testid="home-page">
      <section className="bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white">
        <div className="container grid items-center gap-8 py-16 md:grid-cols-2 md:py-24">
          <div className="space-y-5">
            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">New season · Up to 30% off</span>
            <h1 className="text-4xl font-extrabold leading-tight md:text-5xl" data-testid="hero-title">
              Everything you love,
              <br /> delivered fast.
            </h1>
            <p className="max-w-md text-white/80">Shop electronics, fashion, food, books and sports gear from top brands — with free shipping on orders over $100.</p>
            <div className="flex gap-3">
              <Link href="/products">
                <Button size="lg" className="bg-white text-indigo-700 hover:bg-white/90" data-testid="hero-shop-now-btn">
                  Shop now <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/products?sort=best_seller">
                <Button size="lg" variant="outline" className="border-white bg-transparent text-white hover:bg-white/10" data-testid="hero-bestsellers-btn">
                  Best sellers
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden grid-cols-2 gap-4 md:grid">
            {featured.slice(0, 4).map((p) => (
              <Link key={p.id} href={`/products/${p.slug}`} className="overflow-hidden rounded-xl bg-white/10 shadow-xl" data-testid="hero-product-link">
                <img src={p.images[0]?.url} alt={p.name} className="aspect-square w-full object-cover" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container grid gap-4 py-8 sm:grid-cols-3">
        {[
          { icon: Truck, title: 'Free shipping', text: 'On orders over $100' },
          { icon: RotateCcw, title: '30-day returns', text: 'Hassle-free returns' },
          { icon: ShieldCheck, title: 'Secure payment', text: 'Powered by Stripe' },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-center gap-3 rounded-lg border p-4">
            <Icon className="h-8 w-8 text-primary" />
            <div>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="container py-8" data-testid="home-categories">
        <h2 className="mb-4 text-2xl font-bold">Shop by category</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => (
            <Link key={c.id} href={`/products?category=${c.slug}`} className={`flex h-28 flex-col justify-end rounded-xl bg-gradient-to-br p-4 text-white shadow transition-transform hover:-translate-y-1 ${CATEGORY_COLORS[c.slug] ?? 'from-slate-500 to-slate-700'}`} data-testid={`home-category-${c.slug}`}>
              <span className="text-lg font-bold">{c.name}</span>
              <span className="text-xs text-white/80">{c._count.products} products</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container py-8" data-testid="home-featured">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Featured products</h2>
          <Link href="/products?featured=true" className="text-sm text-primary hover:underline" data-testid="home-featured-view-all">
            View all
          </Link>
        </div>
        <ProductGrid products={featured.map(toProductCard)} testId="featured-products-grid" />
      </section>

      <section className="container py-8" data-testid="home-bestsellers">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Best sellers</h2>
          <Link href="/products?sort=best_seller" className="text-sm text-primary hover:underline" data-testid="home-bestsellers-view-all">
            View all
          </Link>
        </div>
        <ProductGrid products={bestSellers.map(toProductCard)} testId="bestseller-products-grid" />
      </section>
    </div>
  );
}
