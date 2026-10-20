'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CreditCard, Plus, Tag, Truck, Wallet, X } from 'lucide-react';
import type { Address, Cart, Order, ShippingMethod } from '@/types';
import { api, errorMessage, fieldErrors } from '@/lib/client';
import { validate } from '@/lib/form';
import { couponCodeSchema, testCardSchema } from '@/lib/validation';
import { formatPrice, cn } from '@/lib/utils';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/toast';
import { Stepper } from '@/components/checkout/stepper';
import { TestCardForm, type CardValues } from '@/components/checkout/test-card-form';
import { StripePayment, type StripeHandle } from '@/components/checkout/stripe-payment';
import { AddressBlock, AddressForm } from '@/components/account/address-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState, ErrorState, FormError, Spinner } from '@/components/ui/states';
import { Textarea } from '@/components/ui/textarea';

type Totals = { subtotal: number; shipping: number; discount: number; tax: number; total: number };
type Quote = {
  totals: Totals;
  coupon: { code: string; type: string } | null;
  shippingOptions: { method: ShippingMethod; label: string; price: number; eta: string }[];
};
type PayConfig = { paymentProvider: 'stripe' | 'test_card'; stripePublishableKey: string; testCards: { number: string; result: string }[] };

export default function CheckoutPage() {
  const router = useRouter();
  const setServer = useCartStore((s) => s.setServer);
  const [step, setStep] = useState(0);
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [addingAddress, setAddingAddress] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('STANDARD');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string>();
  const [couponLoading, setCouponLoading] = useState(false);
  const [payConfig, setPayConfig] = useState<PayConfig | null>(null);
  const [payMethod, setPayMethod] = useState<'card' | 'cod'>('card');
  const [card, setCard] = useState<CardValues>({ cardholderName: '', cardNumber: '', expiry: '', cvc: '' });
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const stripeRef = useRef<StripeHandle>(null);

  const init = useCallback(async () => {
    setLoadError(null);
    try {
      const [c, a, p] = await Promise.all([api<Cart>('/api/cart'), api<Address[]>('/api/addresses'), api<PayConfig>('/api/checkout/config')]);
      setCart(c);
      setAddresses(a);
      setPayConfig(p);
      setAddressId((cur) => cur ?? a.find((x) => x.isDefault)?.id ?? a[0]?.id ?? null);
    } catch (e) {
      setLoadError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  const refreshQuote = useCallback(
    async (method: ShippingMethod, code: string | null) => {
      const q = await api<Quote>('/api/checkout/quote', { method: 'POST', body: { shippingMethod: method, couponCode: code } });
      setQuote(q);
      return q;
    },
    [],
  );

  useEffect(() => {
    if (cart?.items.length) refreshQuote(shippingMethod, coupon).catch((e) => toast.error(errorMessage(e)));
  }, [cart, shippingMethod, coupon, refreshQuote]);

  // Create a Stripe PaymentIntent whenever the payable amount changes on the payment step.
  useEffect(() => {
    if (step !== 3 || payConfig?.paymentProvider !== 'stripe' || payMethod !== 'card') return;
    setClientSecret(null);
    api<{ clientSecret: string }>('/api/checkout/payment-intent', { method: 'POST', body: { shippingMethod, couponCode: coupon } })
      .then((r) => setClientSecret(r.clientSecret))
      .catch((e) => setFormError(errorMessage(e)));
  }, [step, payConfig, payMethod, shippingMethod, coupon, quote?.totals.total]);

  const applyCoupon = async () => {
    setCouponError(undefined);
    const v = validate(couponCodeSchema, couponInput);
    if (v.errors) return setCouponError(v.errors._form);
    setCouponLoading(true);
    try {
      const res = await api<{ code: string; discount: number }>('/api/coupons/validate', { method: 'POST', body: { couponCode: v.data } });
      setCoupon(res.code);
      setCouponInput('');
      toast.success(`Coupon ${res.code} applied — you save ${formatPrice(res.discount)}`);
    } catch (e) {
      setCouponError(fieldErrors(e).couponCode ?? errorMessage(e));
    } finally {
      setCouponLoading(false);
    }
  };

  const goNext = () => {
    setFormError(null);
    if (step === 1 && !addressId) return setFormError('Please select or add a shipping address');
    setStep((s) => Math.min(s + 1, 3));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const placeOrder = async () => {
    setFormError(null);
    setErrors({});
    if (!addressId) return setFormError('Please select a shipping address');
    let payment: Record<string, unknown>;
    if (payMethod === 'cod') payment = { method: 'cod' };
    else if (payConfig?.paymentProvider === 'stripe') {
      setPlacing(true);
      const res = await stripeRef.current?.confirm();
      if (!res || res.error) {
        setPlacing(false);
        return setFormError(res?.error ?? 'Payment failed');
      }
      payment = { method: 'stripe', paymentIntentId: res.paymentIntentId };
    } else {
      const v = validate(testCardSchema, card);
      if (v.errors) {
        const mapped: Record<string, string> = {};
        Object.entries(v.errors).forEach(([k, m]) => (mapped[`payment.card.${k}`] = m));
        return setErrors(mapped);
      }
      payment = { method: 'test_card', card: v.data };
    }
    setPlacing(true);
    try {
      const order = await api<Order>('/api/orders', {
        method: 'POST',
        body: { addressId, shippingMethod, couponCode: coupon, notes: notes || null, payment },
      });
      setServer({ id: cart!.id, items: [], subtotal: 0, itemCount: 0 });
      useAuthStore.getState().fetchMe();
      toast.success('Order placed successfully!');
      router.push(`/checkout/success?order=${order.id}`);
    } catch (e) {
      setErrors(fieldErrors(e));
      setFormError(errorMessage(e));
      if (fieldErrors(e).couponCode) setCoupon(null);
    } finally {
      setPlacing(false);
    }
  };

  if (loadError) return <div className="container py-10"><ErrorState message={loadError} onRetry={init} /></div>;
  if (!cart || !addresses || !payConfig) return <div className="container py-10"><Spinner label="Loading checkout…" /></div>;
  if (cart.items.length === 0)
    return (
      <div className="container py-10" data-testid="checkout-page">
        <EmptyState
          title="Your cart is empty"
          description="Add items to your cart before checking out."
          testId="checkout-empty"
          action={
            <Link href="/products">
              <Button data-testid="checkout-shop-btn">Shop products</Button>
            </Link>
          }
        />
      </div>
    );

  const totals = quote?.totals;
  const selectedAddress = addresses.find((a) => a.id === addressId);

  return (
    <div className="container py-6" data-testid="checkout-page">
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>
      <Stepper current={step} />
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <FormError message={formError} testId="checkout-error" />

          {step === 0 && (
            <Card data-testid="checkout-cart-step">
              <CardHeader>
                <CardTitle>Review your cart</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y">
                  {cart.items.map((i) => (
                    <li key={i.id} className="flex items-center gap-3 py-3" data-testid="checkout-cart-item">
                      <img src={i.image ?? '/favicon.svg'} alt="" className="h-14 w-14 rounded object-cover" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{i.name}</p>
                        {i.variantName && <p className="text-xs text-muted-foreground">{i.variantName}</p>}
                        <p className="text-xs text-muted-foreground">Qty: {i.quantity}</p>
                      </div>
                      <span className="text-sm font-semibold">{formatPrice(i.lineTotal)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex justify-between">
                  <Link href="/cart">
                    <Button variant="outline" data-testid="checkout-edit-cart-btn">
                      Edit cart
                    </Button>
                  </Link>
                  <Button onClick={goNext} data-testid="checkout-continue-btn">
                    Continue to address
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 1 && (
            <Card data-testid="checkout-address-step">
              <CardHeader>
                <CardTitle>Shipping address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {addresses.length > 0 && !addingAddress && (
                  <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Shipping address">
                    {addresses.map((a) => (
                      <label key={a.id} className={cn('cursor-pointer rounded-lg border-2 p-4', addressId === a.id ? 'border-primary' : 'border-border')} data-testid={`checkout-address-option-${a.id}`}>
                        <div className="mb-1 flex items-center gap-2">
                          <input type="radio" name="address" checked={addressId === a.id} onChange={() => setAddressId(a.id)} data-testid="checkout-address-radio" />
                          <span className="font-semibold">{a.label}</span>
                          {a.isDefault && <span className="rounded bg-primary/10 px-1.5 text-xs text-primary">Default</span>}
                        </div>
                        <AddressBlock a={a} />
                      </label>
                    ))}
                  </div>
                )}
                {addingAddress || addresses.length === 0 ? (
                  <AddressForm
                    onSaved={(a) => {
                      setAddresses((prev) => [...(prev ?? []).map((x) => (a.isDefault ? { ...x, isDefault: false } : x)), a]);
                      setAddressId(a.id);
                      setAddingAddress(false);
                      toast.success('Address saved');
                    }}
                    onCancel={addresses.length ? () => setAddingAddress(false) : undefined}
                  />
                ) : (
                  <Button variant="outline" onClick={() => setAddingAddress(true)} data-testid="checkout-add-address-btn">
                    <Plus className="h-4 w-4" /> Add new address
                  </Button>
                )}
                {!addingAddress && (
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(0)} data-testid="checkout-back-btn">
                      Back
                    </Button>
                    <Button onClick={goNext} disabled={!addressId} data-testid="checkout-continue-btn">
                      Continue to shipping
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card data-testid="checkout-shipping-step">
              <CardHeader>
                <CardTitle>Shipping method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quote?.shippingOptions.map((o) => (
                  <label key={o.method} className={cn('flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4', shippingMethod === o.method ? 'border-primary' : 'border-border')} data-testid={`shipping-option-${o.method.toLowerCase()}`}>
                    <input type="radio" name="shipping" checked={shippingMethod === o.method} onChange={() => setShippingMethod(o.method)} data-testid={`shipping-radio-${o.method.toLowerCase()}`} />
                    <Truck className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">{o.label}</p>
                      <p className="text-xs text-muted-foreground">{o.eta}</p>
                    </div>
                    <span className="font-semibold" data-testid={`shipping-price-${o.method.toLowerCase()}`}>
                      {o.price === 0 ? 'FREE' : formatPrice(o.price)}
                    </span>
                  </label>
                ))}
                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep(1)} data-testid="checkout-back-btn">
                    Back
                  </Button>
                  <Button onClick={goNext} data-testid="checkout-continue-btn">
                    Continue to payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card data-testid="checkout-payment-step">
              <CardHeader>
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
                  <label className={cn('flex cursor-pointer items-center gap-2 rounded-lg border-2 p-3', payMethod === 'card' ? 'border-primary' : 'border-border')} data-testid="payment-method-card">
                    <input type="radio" name="pay" checked={payMethod === 'card'} onChange={() => setPayMethod('card')} data-testid="payment-radio-card" />
                    <CreditCard className="h-5 w-5" /> Credit / Debit card
                  </label>
                  <label className={cn('flex cursor-pointer items-center gap-2 rounded-lg border-2 p-3', payMethod === 'cod' ? 'border-primary' : 'border-border')} data-testid="payment-method-cod">
                    <input type="radio" name="pay" checked={payMethod === 'cod'} onChange={() => setPayMethod('cod')} data-testid="payment-radio-cod" />
                    <Wallet className="h-5 w-5" /> Cash on delivery
                  </label>
                </div>
                {payMethod === 'card' &&
                  (payConfig.paymentProvider === 'stripe' ? (
                    clientSecret ? (
                      <StripePayment ref={stripeRef} publishableKey={payConfig.stripePublishableKey} clientSecret={clientSecret} />
                    ) : (
                      <Spinner label="Loading secure payment form…" />
                    )
                  ) : (
                    <>
                      <TestCardForm values={card} onChange={setCard} errors={errors} />
                      <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground" data-testid="test-cards-hint">
                        <p className="mb-1 font-semibold">Test mode cards (any future expiry, any CVC):</p>
                        {payConfig.testCards.map((c) => (
                          <p key={c.number}>
                            <code>{c.number}</code> — {c.result}
                          </p>
                        ))}
                      </div>
                    </>
                  ))}
                {payMethod === 'cod' && <p className="text-sm text-muted-foreground">Pay with cash when your order is delivered.</p>}
                <Textarea label="Order notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} showCount rows={2} error={errors.notes} testId="checkout-notes-input" />
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)} data-testid="checkout-back-btn">
                    Back
                  </Button>
                  <Button size="lg" onClick={placeOrder} loading={placing} disabled={!totals} data-testid="place-order-btn">
                    Place order {totals && `· ${formatPrice(totals.total)}`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="h-fit space-y-4 rounded-lg border p-5" data-testid="checkout-summary">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <p className="text-sm text-muted-foreground">{cart.itemCount} item(s)</p>
          {selectedAddress && step > 1 && (
            <div className="rounded-md bg-muted/50 p-3" data-testid="checkout-summary-address">
              <p className="mb-1 text-xs font-semibold uppercase">Ship to</p>
              <AddressBlock a={selectedAddress} />
            </div>
          )}
          <div>
            {coupon ? (
              <div className="flex items-center justify-between rounded-md bg-emerald-100 px-3 py-2 text-sm text-emerald-800" data-testid="applied-coupon">
                <span className="flex items-center gap-1">
                  <Tag className="h-4 w-4" /> {coupon}
                </span>
                <button onClick={() => setCoupon(null)} aria-label="Remove coupon" data-testid="remove-coupon-btn">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex gap-2">
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                    placeholder="Promo code"
                    aria-label="Promo code"
                    maxLength={30}
                    className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm uppercase"
                    data-testid="coupon-input"
                  />
                  <Button variant="outline" onClick={applyCoupon} loading={couponLoading} data-testid="apply-coupon-btn">
                    Apply
                  </Button>
                </div>
                {couponError && (
                  <p className="text-xs text-destructive" role="alert" data-testid="coupon-error">
                    {couponError}
                  </p>
                )}
              </div>
            )}
          </div>
          {totals ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span data-testid="summary-subtotal">{formatPrice(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span data-testid="summary-shipping">{totals.shipping === 0 ? 'FREE' : formatPrice(totals.shipping)}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span data-testid="summary-discount">-{formatPrice(totals.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax (10%)</span>
                <span data-testid="summary-tax">{formatPrice(totals.tax)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <span>Total</span>
                <span data-testid="summary-total">{formatPrice(totals.total)}</span>
              </div>
            </div>
          ) : (
            <Spinner label="Calculating…" />
          )}
        </aside>
      </div>
    </div>
  );
}
