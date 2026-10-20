'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';

export function ProductGallery({ images, name }: { images: { id: string; url: string; alt: string | null }[]; name: string }) {
  const list = images.length ? images : [{ id: 'none', url: '/favicon.svg', alt: name }];
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const current = list[index];

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };
  const go = (d: number) => setIndex((i) => (i + d + list.length) % list.length);

  return (
    <div className="space-y-3" data-testid="product-gallery">
      <div
        className="relative aspect-square cursor-zoom-in overflow-hidden rounded-lg border bg-muted"
        onMouseMove={onMove}
        onMouseLeave={() => setZoom(null)}
        onClick={() => setLightbox(true)}
        data-testid="product-main-image-container"
        data-zoomed={Boolean(zoom)}
      >
        <img
          src={current.url}
          alt={current.alt ?? name}
          className="h-full w-full object-cover transition-transform duration-150"
          style={zoom ? { transform: 'scale(2)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          data-testid="product-main-image"
        />
        <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-background/80 p-2">
          <ZoomIn className="h-4 w-4" />
        </span>
        {list.length > 1 && (
          <>
            <button onClick={(e) => (e.stopPropagation(), go(-1))} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5" aria-label="Previous image" data-testid="gallery-prev-btn">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={(e) => (e.stopPropagation(), go(1))} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5" aria-label="Next image" data-testid="gallery-next-btn">
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto" data-testid="product-thumbnails">
          {list.map((img, i) => (
            <button key={img.id} onClick={() => setIndex(i)} className={cn('h-16 w-16 shrink-0 overflow-hidden rounded border-2', i === index ? 'border-primary' : 'border-transparent')} aria-label={`View image ${i + 1}`} aria-current={i === index} data-testid={`product-thumbnail-${i}`}>
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <Modal open={lightbox} onClose={() => setLightbox(false)} title={name} testId="image-lightbox" className="max-w-3xl">
        <img src={current.url} alt={current.alt ?? name} className="w-full rounded" data-testid="lightbox-image" />
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Image {index + 1} of {list.length}
        </p>
      </Modal>
    </div>
  );
}
