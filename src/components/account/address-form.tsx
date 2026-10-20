'use client';

import { useState } from 'react';
import type { Address } from '@/types';
import { api, errorMessage, fieldErrors } from '@/lib/client';
import { validate } from '@/lib/form';
import { addressSchema } from '@/lib/validation';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/states';
import { Select } from '@/components/ui/select';

const COUNTRIES = ['United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'Indonesia', 'Singapore', 'Japan'];

const empty = { label: 'Home', fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'United States', isDefault: false };

export function AddressForm({ address, onSaved, onCancel }: { address?: Address | null; onSaved: (a: Address) => void; onCancel?: () => void }) {
  const [values, setValues] = useState(address ? { ...empty, ...address, line2: address.line2 ?? '' } : empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setValues({ ...values, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const v = validate(addressSchema, values);
    if (v.errors) return setErrors(v.errors);
    setErrors({});
    setLoading(true);
    try {
      const saved = address
        ? await api<Address>(`/api/addresses/${address.id}`, { method: 'PATCH', body: v.data })
        : await api<Address>('/api/addresses', { method: 'POST', body: v.data });
      onSaved(saved);
    } catch (err) {
      setErrors(fieldErrors(err));
      setFormError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4" data-testid="address-form">
      <FormError message={formError} testId="address-form-error" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Label" value={values.label} onChange={set('label')} error={errors.label} placeholder="Home, Office…" maxLength={30} testId="address-label-input" />
        <Input label="Full name" required value={values.fullName} onChange={set('fullName')} error={errors.fullName} testId="address-fullname-input" />
        <Input label="Phone" required type="tel" value={values.phone} onChange={set('phone')} error={errors.phone} placeholder="+1 555 123 4567" testId="address-phone-input" />
        <Select label="Country" required value={values.country} onChange={set('country')} error={errors.country} options={COUNTRIES.map((c) => ({ value: c, label: c }))} testId="address-country-select" />
        <div className="sm:col-span-2">
          <Input label="Address line 1" required value={values.line1} onChange={set('line1')} error={errors.line1} placeholder="Street address" testId="address-line1-input" />
        </div>
        <div className="sm:col-span-2">
          <Input label="Address line 2" value={values.line2} onChange={set('line2')} error={errors.line2} placeholder="Apartment, suite, etc. (optional)" testId="address-line2-input" />
        </div>
        <Input label="City" required value={values.city} onChange={set('city')} error={errors.city} testId="address-city-input" />
        <Input label="State / Province" required value={values.state} onChange={set('state')} error={errors.state} testId="address-state-input" />
        <Input label="Postal code" required value={values.postalCode} onChange={set('postalCode')} error={errors.postalCode} testId="address-postal-code-input" />
      </div>
      <Checkbox label="Set as default address" checked={values.isDefault} onChange={set('isDefault')} testId="address-default-checkbox" />
      <div className="flex gap-2">
        <Button type="submit" loading={loading} data-testid="address-save-btn">
          {address ? 'Update address' : 'Save address'}
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel} data-testid="address-cancel-btn">
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

export function AddressBlock({ a }: { a: Omit<Address, 'id' | 'label' | 'isDefault'> }) {
  return (
    <address className="text-sm not-italic text-muted-foreground" data-testid="address-block">
      <span className="font-medium text-foreground">{a.fullName}</span>
      <br />
      {a.line1}
      {a.line2 && (
        <>
          <br />
          {a.line2}
        </>
      )}
      <br />
      {a.city}, {a.state} {a.postalCode}
      <br />
      {a.country}
      <br />
      {a.phone}
    </address>
  );
}
