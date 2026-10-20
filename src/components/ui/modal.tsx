'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  testId?: string;
  className?: string;
}

export function Modal({ open, onClose, title, children, footer, testId = 'modal', className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title} data-testid={testId}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} data-testid={`${testId}-overlay`} />
      <div className={cn('relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-card p-6 shadow-xl animate-slide-in', className)}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold" data-testid={`${testId}-title`}>
            {title}
          </h2>
          <button onClick={onClose} aria-label="Close" data-testid={`${testId}-close`} className="rounded p-1 hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

interface ConfirmProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  testId?: string;
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', destructive, loading, onConfirm, onCancel, testId = 'confirm-dialog' }: ConfirmProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      testId={testId}
      footer={
        <>
          <Button variant="outline" onClick={onCancel} data-testid={`${testId}-cancel`}>
            Cancel
          </Button>
          <Button variant={destructive ? 'destructive' : 'default'} onClick={onConfirm} loading={loading} data-testid={`${testId}-confirm`}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm text-muted-foreground" data-testid={`${testId}-message`}>
        {message}
      </div>
    </Modal>
  );
}
