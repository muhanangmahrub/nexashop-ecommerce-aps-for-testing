'use client';

import { Input } from '@/components/ui/input';

export type CardValues = { cardholderName: string; cardNumber: string; expiry: string; cvc: string };

export function TestCardForm({ values, onChange, errors }: { values: CardValues; onChange: (v: CardValues) => void; errors: Record<string, string> }) {
  const fmtCard = (v: string) =>
    v
      .replace(/\D/g, '')
      .slice(0, 19)
      .replace(/(\d{4})(?=\d)/g, '$1 ');
  const fmtExp = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };
  return (
    <div className="grid gap-4 sm:grid-cols-2" data-testid="test-card-form">
      <div className="sm:col-span-2">
        <Input label="Cardholder name" required value={values.cardholderName} onChange={(e) => onChange({ ...values, cardholderName: e.target.value })} error={errors['payment.card.cardholderName']} autoComplete="cc-name" testId="payment-cardholder-input" />
      </div>
      <div className="sm:col-span-2">
        <Input label="Card number" required inputMode="numeric" value={values.cardNumber} onChange={(e) => onChange({ ...values, cardNumber: fmtCard(e.target.value) })} error={errors['payment.card.cardNumber'] ?? errors.cardNumber} placeholder="4242 4242 4242 4242" autoComplete="cc-number" testId="payment-card-number-input" />
      </div>
      <Input label="Expiry (MM/YY)" required inputMode="numeric" value={values.expiry} onChange={(e) => onChange({ ...values, expiry: fmtExp(e.target.value) })} error={errors['payment.card.expiry']} placeholder="12/30" autoComplete="cc-exp" testId="payment-expiry-input" />
      <Input label="CVC" required inputMode="numeric" maxLength={4} value={values.cvc} onChange={(e) => onChange({ ...values, cvc: e.target.value.replace(/\D/g, '') })} error={errors['payment.card.cvc']} placeholder="123" autoComplete="cc-csc" testId="payment-cvc-input" />
    </div>
  );
}
