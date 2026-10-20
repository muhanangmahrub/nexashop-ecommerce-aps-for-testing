'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, Loader2, Search, Tag, X } from 'lucide-react';
import { api } from '@/lib/client';
import { useDebounce } from '@/hooks/use-debounce';
import { useAuthStore } from '@/store/auth';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

type Suggestions = {
  products: { id: string; name: string; slug: string; price: number; image: string | null }[];
  categories: { id: string; name: string; slug: string }[];
  brands: string[];
};

const LOCAL_KEY = 'nexashop-recent-searches';

function readLocalRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function SearchBar({ className, testId = 'search' }: { className?: string; testId?: string }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Suggestions | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const [active, setActive] = useState(-1);
  const debounced = useDebounce(q.trim(), 300);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => !boxRef.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (!debounced) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api<Suggestions>(`/api/search/suggestions?q=${encodeURIComponent(debounced)}`)
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setData(null))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const loadRecent = async () => {
    if (user) {
      const items = await api<{ query: string }[]>('/api/search/history').catch(() => []);
      setRecent(items.map((i) => i.query));
    } else setRecent(readLocalRecent());
  };

  const submit = (term: string) => {
    const t = term.trim();
    if (!t) return;
    if (!user) {
      const next = [t, ...readLocalRecent().filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, 8);
      try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
    setQ(t);
    router.push(`/search?q=${encodeURIComponent(t)}`);
  };

  const clearRecent = async () => {
    if (user) await api('/api/search/history', { method: 'DELETE' }).catch(() => undefined);
    else localStorage.removeItem(LOCAL_KEY);
    setRecent([]);
  };

  const products = data?.products ?? [];
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, products.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (active >= 0 && products[active]) {
        setOpen(false);
        router.push(`/products/${products[active].slug}`);
      } else submit(q);
    } else if (e.key === 'Escape') setOpen(false);
  };

  const showRecent = open && !q.trim() && recent.length > 0;
  const showSuggest = open && Boolean(q.trim());

  return (
    <div ref={boxRef} className={cn('relative w-full', className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit(q);
        }}
      >
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            loadRecent();
          }}
          onKeyDown={onKeyDown}
          maxLength={100}
          placeholder="Search products, brands, categories…"
          role="combobox"
          aria-controls={`${testId}-listbox`}
          aria-label="Search products"
          aria-autocomplete="list"
          aria-expanded={showSuggest}
          data-testid={`${testId}-input`}
          className="h-10 w-full rounded-full border border-input bg-background pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {q && (
          <button type="button" onClick={() => setQ('')} aria-label="Clear search" data-testid={`${testId}-clear`} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          </button>
        )}
      </form>

      {(showRecent || showSuggest) && (
        <div id={`${testId}-listbox`} className="absolute z-50 mt-2 w-full overflow-hidden rounded-lg border bg-card shadow-lg" data-testid={`${testId}-dropdown`}>
          {showRecent && (
            <div className="p-2" data-testid="recent-searches">
              <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">
                Recent searches
                <button onClick={clearRecent} className="normal-case text-primary hover:underline" data-testid="recent-searches-clear">
                  Clear
                </button>
              </div>
              {recent.map((r, i) => (
                <button key={r + i} onClick={() => submit(r)} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent" data-testid={`recent-search-item-${i}`}>
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {r}
                </button>
              ))}
            </div>
          )}
          {showSuggest && (
            <div className="max-h-96 overflow-y-auto p-2" data-testid={`${testId}-suggestions`}>
              {loading && !data && <p className="px-2 py-3 text-sm text-muted-foreground">Searching…</p>}
              {data && !products.length && !data.categories.length && !data.brands.length && (
                <p className="px-2 py-3 text-sm text-muted-foreground" data-testid={`${testId}-no-suggestions`}>
                  No suggestions for “{q}”
                </p>
              )}
              {products.map((p, i) => (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  onClick={() => setOpen(false)}
                  className={cn('flex items-center gap-3 rounded px-2 py-1.5 text-sm hover:bg-accent', active === i && 'bg-accent')}
                  data-testid={`${testId}-suggestion-${i}`}
                >
                  {p.image && <img src={p.image} alt="" className="h-8 w-8 rounded object-cover" />}
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="text-xs text-muted-foreground">{formatPrice(p.price)}</span>
                </Link>
              ))}
              {data?.categories.map((c) => (
                <Link key={c.id} href={`/products?category=${c.slug}`} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent" data-testid={`${testId}-category-suggestion`}>
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" /> in <b>{c.name}</b>
                </Link>
              ))}
              {data?.brands.map((b) => (
                <Link key={b} href={`/products?brand=${encodeURIComponent(b)}`} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent" data-testid={`${testId}-brand-suggestion`}>
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" /> Brand: <b>{b}</b>
                </Link>
              ))}
              {q.trim() && (
                <button onClick={() => submit(q)} className="mt-1 w-full rounded px-2 py-1.5 text-left text-sm font-medium text-primary hover:bg-accent" data-testid={`${testId}-see-all`}>
                  See all results for “{q.trim()}”
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
