'use client';

import { Facebook, Link2, Linkedin, Twitter } from 'lucide-react';
import { toast } from '@/store/toast';

export function ShareButtons({ name, slug }: { name: string; slug: string }) {
  const url = () => (typeof window !== 'undefined' ? `${window.location.origin}/products/${slug}` : `/products/${slug}`);
  const open = (href: string) => window.open(href, '_blank', 'noopener,noreferrer,width=600,height=500');
  const btn = 'inline-flex h-9 w-9 items-center justify-center rounded-full border hover:bg-accent';
  return (
    <div className="flex items-center gap-2" data-testid="social-share">
      <span className="text-sm text-muted-foreground">Share:</span>
      <button className={btn} aria-label="Share on Facebook" data-testid="share-facebook-btn" onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`)}>
        <Facebook className="h-4 w-4" />
      </button>
      <button className={btn} aria-label="Share on X" data-testid="share-twitter-btn" onClick={() => open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url())}&text=${encodeURIComponent(name)}`)}>
        <Twitter className="h-4 w-4" />
      </button>
      <button className={btn} aria-label="Share on LinkedIn" data-testid="share-linkedin-btn" onClick={() => open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url())}`)}>
        <Linkedin className="h-4 w-4" />
      </button>
      <button
        className={btn}
        aria-label="Copy link"
        data-testid="share-copy-link-btn"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url());
            toast.success('Link copied to clipboard');
          } catch {
            toast.error('Could not copy link');
          }
        }}
      >
        <Link2 className="h-4 w-4" />
      </button>
    </div>
  );
}
