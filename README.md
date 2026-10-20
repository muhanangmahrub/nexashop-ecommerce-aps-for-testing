# NexaShop

NexaShop is a full-stack B2C e-commerce app built as a **test target for UI automation portfolios** (Playwright, Katalon Studio). It behaves like a production storefront and admin console, and it's designed to be easy to test:

- every interactive element has a `data-testid`
- validation is thorough on both client and server, with structured field-level errors
- seed data is deterministic, with known credentials
- a test mode skips email verification and uses test cards
- there are dedicated accounts and coupons for negative scenarios

It covers auth, catalog, cart, wishlist, multi-step checkout, orders, reviews, notifications, search and a full admin dashboard. That's enough surface for **200+ positive and negative test cases**.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | Next.js 14 (App Router) · React 18 · TypeScript (strict) · Tailwind CSS · shadcn-style UI primitives · lucide icons |
| State | Zustand (auth, cart with guest `localStorage` persistence, wishlist, toasts) |
| Backend | Next.js Route Handlers (REST) · Zod validation |
| Database | PostgreSQL 16 · Prisma ORM 5 |
| Auth | JWT access token (15 min) + rotating refresh token (7 days, stored hashed in DB), httpOnly cookies · bcrypt · Google OAuth 2.0 (optional) |
| Payments | Stripe Payment Element (test mode) **or** built-in test-card processor in `TEST_MODE` |
| Email | Nodemailer → Mailpit in Docker (mock JSON transport otherwise). Every email is also logged to the DB |
| Files | Local disk volume (`/app/uploads`) with type, size and magic-byte validation |
| Charts / PDF | Recharts · pdf-lib (invoices) |
| Infra | Docker multi-stage build (standalone output) · docker-compose (app + Postgres + Mailpit) |
| Quality | ESLint (`no-console`, Next core-web-vitals) · Prettier · error boundaries · security headers |

---

## Quick start (Docker, one command)

```bash
cp .env.example .env
docker compose up --build
```

| Service | URL |
| --- | --- |
| App | http://localhost:3000 |
| Health check | http://localhost:3000/api/health |
| Mailpit (view sent emails) | http://localhost:8025 |
| Postgres | `localhost:5432` (nexashop / nexashop) |

On first start, the container syncs the schema (`prisma db push`) and seeds the DB automatically if it's empty (`SEED_MODE=if-empty`).

To **reset to pristine seed data**:

```bash
docker compose exec app node prisma/seed.js        # re-seed in place
# or wipe everything
docker compose down -v && docker compose up --build
```

## Manual setup (local Node)

Requirements: Node 20+, PostgreSQL 14+.

```bash
npm install
cp .env.example .env                    # set DATABASE_URL to your Postgres
docker compose up -d db mailpit         # optional: just the infra
npx prisma db push                      # create tables
npm run db:seed                         # load seed data
npm run dev                             # http://localhost:3000
```

Production build: `npm run build && npm start`.

> **macOS note:** if the project lives in an iCloud-synced folder (e.g. `~/Documents` with "Desktop & Documents" sync on), iCloud can stall reads on freshly installed `node_modules`. Commands like `tsc` or `next build` may then hang. Move the project outside iCloud, or exclude `node_modules` from sync. Docker builds aren't affected.

---

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Public base URL (email links, OAuth redirect) |
| `TEST_MODE` | `true` | **Runtime** test mode for the server: skips email verification, enables test-card payments and the `/api/test/*` helpers |
| `NEXT_PUBLIC_TEST_MODE` | `true` | Same flag, baked into the client bundle at build time |
| `MAINTENANCE_MODE` | `false` | `true` → non-admins get the maintenance page (HTTP 503) and APIs return 503 |
| `CORS_ALLOWED_ORIGINS` | – | Extra origins allowed to call `/api/*` cross-origin (comma-separated or `*`); same-origin always allowed |
| `RATE_LIMIT_ENABLED` | `false` in example | In-memory rate limiting on auth/newsletter endpoints. Disable for automated test runs |
| `DATABASE_URL` | – | Postgres connection string (compose overrides it to point at `db`) |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `nexashop` | Used by docker-compose |
| `SEED_MODE` | `if-empty` | Container start behaviour: `if-empty`, `always`, `never` |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | – | **Change in production** (≥ 32 chars) |
| `ACCESS_TOKEN_TTL_SECONDS` | `900` | Access-token lifetime |
| `REFRESH_TOKEN_TTL_DAYS` | `7` | Refresh-token lifetime ("remember me"; 1 day when unchecked) |
| `LOCKOUT_MINUTES` | `15` | Lock duration after 5 failed logins |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | – | Enables "Continue with Google". Redirect URI: `{APP_URL}/api/auth/google/callback` |
| `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | – | Stripe test keys. Used only when `TEST_MODE=false` |
| `STRIPE_WEBHOOK_SECRET` | – | For `POST /api/webhooks/stripe` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | – | SMTP server. Empty `SMTP_HOST` → mock JSON transport |
| `EMAIL_FROM` | `NexaShop <no-reply@nexashop.test>` | Sender address |
| `UPLOAD_DIR` | `./uploads` | Where avatars and product images are stored |

---

## Seed data & test accounts

All seed data is deterministic, so it's identical on every run.

| Role | Email | Password | Notes |
| --- | --- | --- | --- |
| Super Admin | `superadmin@nexashop.test` | `SuperAdmin@123` | Can change roles and ban admins |
| Admin | `admin1@nexashop.test` | `Admin@123` | |
| Admin | `admin2@nexashop.test` | `Admin@123` | |
| Customer | `customer1@nexashop.test` … `customer10@nexashop.test` | `Customer@123` | Have addresses, orders, reviews and notifications |
| Banned | `banned@nexashop.test` | `Customer@123` | Login → 403 `ACCOUNT_BANNED` |
| Unverified | `unverified@nexashop.test` | `Customer@123` | Login → 403 `EMAIL_NOT_VERIFIED` when `TEST_MODE=false` |
| Lockout target | `lockout@nexashop.test` | `Customer@123` | Use this for the 5-failed-attempts test. Reset with `POST /api/test/unlock` |
| Empty | `empty@nexashop.test` | `Customer@123` | No orders, addresses or wishlist, for empty-state tests |

**Useful seeded state**

- `customer1` has 1 cart item, 3 wishlist items, a **PENDING** order (cancellable), a **PROCESSING** order and 2 addresses.
- `customer2` has a **SHIPPED** order and a **CANCELLED** order. `customer3` has a **PENDING** order.
- 5 top-level categories (Electronics, Fashion, Food, Books, Sports) with 11 **nested** subcategories.
- **50 products**: 10 per category. They include products with color, size and size+color variants, out-of-stock items (e.g. *SmartHome Hub Mini*, *Dune*, *Merino Wool Sweater*), low-stock items (≤ 5) and sale items (with compare-at prices).
- **25 orders**: 20 DELIVERED (with reviews) plus PENDING, PROCESSING, SHIPPED and CANCELLED ones.

**Coupons**

| Code | Rule | Use for |
| --- | --- | --- |
| `WELCOME10` | 10% off, once per user | ✅ valid |
| `SAVE20` | $20 off, min order $100 | ✅ / ❌ min-order |
| `SUMMER25` | 25% off, max $50 | ✅ cap |
| `FLASH15` | 15% off, min order $50 | ✅ |
| `BIGSPENDER` | $50 off, min order $300 | ✅ / ❌ min-order |
| `EXPIRED10` | expired | ❌ 422 "This coupon has expired" |
| `INACTIVE5` | inactive | ❌ 422 "no longer active" |
| `LIMITREACHED` | usage limit hit | ❌ 422 "usage limit" |
| `FUTURE30` | starts in 10 days | ❌ 422 "not yet valid" |
| *anything else* | – | ❌ 404 "Coupon code not found" |

**Test cards** (when `TEST_MODE=true`; any future expiry and any 3–4 digit CVC)

| Card | Result |
| --- | --- |
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | 402 "Your card was declined" |
| `4000 0000 0000 9995` | 402 "insufficient funds" |
| `4000 0000 0000 0069` | 402 "expired" |
| `4000 0000 0000 0127` | 402 "security code is incorrect" |
| Fails Luhn (e.g. `4242 4242 4242 4241`) | 400 "Card number is invalid" |

Cash on delivery is also available (limited to $500 outside test mode).

---

## Test-friendly design

- **`data-testid` everywhere.** The convention is `<area>-<element>-<type>`, e.g. `login-email-input`, `add-to-cart-btn`, `cart-count-badge`, `checkout-step-payment`. A field's error message is always `${testId}-error` (e.g. `register-password-input-error`). List rows expose IDs via `data-*` attributes (`data-product-id`, `data-order-id`, `data-status`, `data-read`).
- **Toasts** use `toast-success`, `toast-error`, `toast-warning` and `toast-info`, plus `toast-message` and `toast-close`.
- **Native validation is off** (`noValidate`), so the app's own validation messages always render.
- **Predictable URLs**: `/products?category=books&sort=price_asc&page=2`, `/products/{slug}`, `/search?q=…`, `/account/orders/{id}`, `/admin/orders/{id}`.
- **No CAPTCHA.** Rate limiting can be turned off with `RATE_LIMIT_ENABLED=false`.
- **Test-mode helpers** (they return 404 unless `TEST_MODE=true`):
  - `GET /api/test/emails?to=<email>&type=verification|password_reset|order_confirmation|order_status` returns sent emails, including `meta.token` and `meta.link`, so you can automate the verify-email and reset-password flows.
  - `DELETE /api/test/emails` clears the email log.
  - `POST /api/test/unlock` with `{ "email": "…" }` clears the lockout state.
- **Mark-up hooks**: `<body data-test-mode="true">` exposes the mode, and the cookie banner can be pre-dismissed with `localStorage['nexashop-cookie-consent']='accepted'`.

A starter Playwright setup is included (`playwright.config.ts`, `tests/fixtures.ts`, `tests/e2e/smoke.spec.ts`):

```bash
npx playwright install chromium
npm run test:e2e                 # BASE_URL defaults to http://localhost:3000
```

---

## API reference

All JSON responses use one envelope:

```jsonc
// success
{ "success": true, "data": { ... } }
// failure
{ "success": false, "message": "Validation failed", "errors": { "email": "Email already exists" }, "code": "CONFLICT" }
```

Status codes used: `200`, `201`, `204`, `400` (validation, with field `errors`), `401`, `402` (payment declined), `403` (forbidden, banned or locked), `404`, `409` (duplicate), `422` (business-rule violations: stock, coupon, status transition), `429` (rate limited), `500`, `503` (maintenance or DB down).

Auth is cookie-based (`nx_access`, `nx_refresh`, both httpOnly). 🔒 = requires login; 🛡 = admin; 👑 = super admin.

### System
| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Service and DB health, test/maintenance flags |
| GET | `/api/images/placeholder?text=&color=` | Deterministic SVG placeholder |
| GET | `/api/uploads/:name` | Serve an uploaded image |

### Auth
| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | `{name,email,password,confirmPassword,acceptTerms}` → 201; 409 on duplicate email |
| POST | `/api/auth/login` | `{email,password,rememberMe}`. 401 invalid (shows attempts remaining); 403 `ACCOUNT_LOCKED`, `ACCOUNT_BANNED` or `EMAIL_NOT_VERIFIED` |
| POST | `/api/auth/logout` | Revokes the refresh token and clears cookies |
| POST | `/api/auth/refresh` | Rotates tokens (refresh-token reuse revokes all sessions) |
| GET | `/api/auth/me` | Current user and badge counts (`user: null` for guests) |
| POST | `/api/auth/verify-email` | `{token}` |
| POST | `/api/auth/resend-verification` | `{email}` |
| POST | `/api/auth/forgot-password` | `{email}`. Always 200 (no user enumeration) |
| POST | `/api/auth/reset-password` | `{token,password,confirmPassword}`. Token is valid for 1 hour and single-use |
| GET | `/api/auth/google` · `/api/auth/google/callback` | Google OAuth flow |

### Profile 🔒
| Method | Path | Description |
| --- | --- | --- |
| GET / PATCH | `/api/profile` | `{name,email,phone}` |
| PATCH | `/api/profile/password` | `{currentPassword,newPassword,confirmPassword}` |
| POST / DELETE | `/api/profile/avatar` | multipart `avatar`: JPG, PNG, WEBP or GIF, ≤ 2 MB |

### Catalog & search
| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/products` | `q, category, brand, minPrice, maxPrice, rating, availability=in_stock\|out_of_stock, sort=price_asc\|price_desc\|newest\|best_seller\|rating, featured, page, pageSize (≤100, default 20)` |
| GET | `/api/products/:slug` | Detail with images, variants and specs |
| GET | `/api/products/:slug/related` | 4 related products |
| GET | `/api/products/:slug/reviews` | `page, pageSize, sort=newest\|helpful\|rating_high\|rating_low, rating`. Returns the summary and rating breakdown |
| POST | `/api/products/:slug/reviews` 🔒 | `{rating,title,comment}`. 403 unless you have a delivered order; 409 if already reviewed |
| PATCH / DELETE | `/api/reviews/:id` 🔒 | Edit or delete your own review (admins can delete) |
| POST | `/api/reviews/:id/helpful` 🔒 | Toggle a helpful vote (403 on your own review) |
| GET | `/api/categories` | Flat list and tree |
| GET | `/api/brands` | Brands with product counts |
| GET | `/api/search/suggestions?q=` | Autocomplete: products, categories, brands |
| GET / DELETE | `/api/search/history` 🔒 | Recent searches |
| POST | `/api/newsletter` | `{email}`. 409 if already subscribed |

### Cart & wishlist 🔒
| Method | Path | Description |
| --- | --- | --- |
| GET / DELETE | `/api/cart` | View or clear the cart |
| POST | `/api/cart/items` | `{productId,variantId?,quantity}`. 422 when stock is insufficient |
| PATCH / DELETE | `/api/cart/items/:id` | `{quantity}` (1–99, ≤ stock) |
| POST | `/api/cart/merge` | `{items:[…]}` merges the guest cart after login |
| POST | `/api/cart/validate` | 200 valid, or 422 with `issues[]` |
| GET / POST | `/api/wishlist` | `{productId}`. 409 if it's already there |
| DELETE | `/api/wishlist/:productId` | Remove |
| POST | `/api/wishlist/:productId/move-to-cart` | Move to the cart |

### Checkout & orders 🔒
| Method | Path | Description |
| --- | --- | --- |
| GET / POST | `/api/addresses` | Max 10 per user; the first becomes the default |
| GET / PATCH / DELETE | `/api/addresses/:id` | |
| POST | `/api/addresses/:id/default` | Set as default |
| POST | `/api/coupons/validate` | `{couponCode}` checked against the current cart |
| GET | `/api/checkout/config` | Payment provider and the test-card list |
| POST | `/api/checkout/quote` | `{shippingMethod,couponCode?}` → subtotal, shipping, discount, tax (10%), total |
| POST | `/api/checkout/payment-intent` | Stripe PaymentIntent (Stripe mode only) |
| GET | `/api/orders` | `page, pageSize, status` |
| POST | `/api/orders` | `{addressId,shippingMethod,couponCode?,notes?,payment:{method:'test_card',card}\|{method:'stripe',paymentIntentId}\|{method:'cod'}}` |
| GET | `/api/orders/:idOrNumber` | Detail and status history |
| POST | `/api/orders/:id/cancel` | `{reason}`. Only while PENDING; restocks and refunds |
| GET | `/api/orders/:id/invoice` | PDF download (unavailable for cancelled orders) |

Shipping: STANDARD $5.99 (free at ≥ $100), EXPRESS $14.99, SAME_DAY $24.99. Tax is 10% of (subtotal − discount).

### Notifications 🔒
| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/notifications` | `page, pageSize, filter=all\|unread, type` |
| POST | `/api/notifications/:id/read` | Mark one as read |
| POST | `/api/notifications/read-all` | Mark all as read |

### Admin 🛡
| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/admin/stats` | Totals, orders by status, recent orders, low stock, top products |
| GET / POST | `/api/admin/products` | List (`q, category, status, stock, sort`) and create |
| GET / PATCH / DELETE | `/api/admin/products/:id` | DELETE soft-deactivates a product that has orders |
| POST | `/api/admin/products/bulk` | `{ids,action:activate\|deactivate\|feature\|unfeature\|delete}` |
| POST | `/api/upload` | multipart `file` → `{url}` |
| GET / POST | `/api/admin/categories` | Nested via `parentId` |
| PATCH / DELETE | `/api/admin/categories/:id` | Cycle-safe. 409 if the category has products |
| GET | `/api/admin/orders` | `q, status, from, to` |
| GET / PATCH | `/api/admin/orders/:id` | `{status,trackingNumber?,note?}`. Enforces transitions (422); SHIPPED requires a tracking number |
| GET | `/api/admin/users` | `q, role, status=active\|banned\|locked\|unverified` |
| PATCH | `/api/admin/users/:id` | `{isBanned,bannedReason}`, `{unlock:true}`, `{role}` 👑 |
| GET / POST | `/api/admin/coupons` | |
| PATCH / DELETE | `/api/admin/coupons/:id` | `{isActive}` toggle or a full update. 409 when deleting a used coupon |
| GET | `/api/admin/inventory` | `filter=all\|low\|out`, with alert counts |
| POST | `/api/admin/inventory/bulk` | `{updates:[{productId,variantId?,stock}]}` |
| GET | `/api/admin/reports/sales` | `period=daily\|weekly\|monthly, from, to` (zero-filled series) |

### Webhooks & test helpers
| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/webhooks/stripe` | Signed Stripe events (payment failed, refunded) |
| GET / DELETE | `/api/test/emails` | TEST_MODE only |
| POST | `/api/test/unlock` | TEST_MODE only |

---

## Pages

| Area | Routes |
| --- | --- |
| Storefront | `/`, `/products`, `/products/[slug]`, `/search`, `/categories/[slug]` (redirects), `/cart`, `/wishlist` 🔒 |
| Auth | `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password` |
| Checkout 🔒 | `/checkout` (Cart → Address → Shipping → Payment), `/checkout/success?order=` (Confirmation) |
| Account 🔒 | `/account` (profile and avatar), `/account/security`, `/account/addresses`, `/account/orders`, `/account/orders/[id]`, `/account/notifications` |
| Admin 🛡 | `/admin`, `/admin/products`, `/admin/products/new`, `/admin/products/[id]`, `/admin/categories`, `/admin/orders`, `/admin/orders/[id]`, `/admin/users`, `/admin/coupons`, `/admin/inventory`, `/admin/reports` |
| System | 404 (any unknown URL), `/server-error`, `/forbidden` (403, shown for `/admin` as a customer), `/maintenance` |

---

## Feature checklist for test coverage

**Authentication and authorization**
- [ ] Register: required fields, name charset, email format, password rules (8+ chars, upper, lower, number, special), live strength meter, confirm mismatch, terms required, duplicate email (409)
- [ ] Email verification (with `TEST_MODE=false`): link from `/api/test/emails`, invalid, expired, used and resend
- [ ] Login: valid, invalid, remaining-attempts message, **lockout after 5 failures**, banned, unverified, remember-me, redirect back to the protected page
- [ ] Logout, session refresh (access token expiry is transparent), refresh-token rotation
- [ ] Forgot/reset password: generic response, invalid, used or expired token, password rules
- [ ] Google OAuth button (an error message appears when it isn't configured)
- [ ] Role-based access: guests are redirected to `/login?redirect=`, customers get 403 on `/admin`, only super admins can change roles
- [ ] Profile: update name, email (409 duplicate) and phone format; avatar type and size validation; change password (wrong current, same as old, mismatch)

**Catalog**
- [ ] 20 per page with pagination; sort by price asc/desc, newest, best seller, rating
- [ ] Filters: category (including subcategories), price range (with invalid-range error), rating, availability, brand (multi-select); active-filter chips; reset
- [ ] Product detail: breadcrumb, gallery thumbnails, prev/next, hover zoom, lightbox, specs tab, variants (color, size, unavailable combinations), quantity bounds, stock badge (In, Low, Out), out-of-stock disables the add button, social share and copy link, related products
- [ ] Loading skeletons and error and retry states

**Cart and wishlist**
- [ ] Add, update and remove; quantity bounds (1–99, ≤ stock); header badge count; guest cart persisted in `localStorage` and merged on login; clear cart with confirmation; empty state; free-shipping hint; stock validation before checkout
- [ ] Wishlist toggle from cards and the detail page, wishlist page, move to cart, badge count, login required, empty state

**Checkout and orders**
- [ ] Stepper navigation (back and continue), address select, add and default; shipping options with price changes; coupon valid, invalid, expired, inactive, limit-reached, min-order and already-used cases; remove coupon
- [ ] Card validation (required, Luhn, MM/YY, expired, CVC) and declined, insufficient-funds cases; cash on delivery; order notes length
- [ ] Confirmation page with order number; order history with status tabs and pagination; order detail timeline; cancel (PENDING only, reason required); PDF invoice download

**Reviews**
- [ ] Only verified purchasers (delivered orders) can review; one per product; star input required; title and comment length; edit and delete your own; helpful vote toggle (not on your own); sort, filter by star, pagination; average and breakdown percentages

**Admin**
- [ ] Dashboard KPIs, revenue chart, status breakdown, stock alerts
- [ ] Products: search, filter, bulk select and actions, create and edit with full validation (price > 0, compare-at > price, unique SKU and slug, variants, specs, image upload type, size and count), delete or soft-delete
- [ ] Categories: nested CRUD, duplicate slug, cannot delete with products, cannot nest under itself or a descendant
- [ ] Orders: search, status and date-range filter (invalid range), status transitions (invalid → 422), tracking number required for SHIPPED
- [ ] Users: search, filter, ban/unban with reason, unlock locked accounts, role change (super admin only)
- [ ] Coupons: create and edit validation (percentage ≤ 100, expiry after start, duplicate code), activate/deactivate toggle, delete restrictions
- [ ] Inventory: low and out-of-stock alerts, inline bulk stock edit with validation
- [ ] Reports: daily, weekly and monthly charts, date range, totals and average order value

**Notifications and misc UI**
- [ ] Bell dropdown, unread badge, mark one or all as read, notifications page with filters and pagination; email notifications (in Mailpit) for order placed and status changes
- [ ] Global search autocomplete (debounced, keyboard navigation), recent searches (stored server-side when logged in, in `localStorage` for guests), clear history, no-results suggestions
- [ ] Dark/light mode toggle (persisted), responsive layout (mobile menu and filter toggle), toasts, cookie consent (accept or essential-only), newsletter (format and duplicate), 404, 500, 403 and maintenance pages

---

## Project structure

```
├── src/
│   ├── app/            # App Router pages + /api route handlers
│   ├── components/     # ui/ primitives, layout/, product/, checkout/, account/, admin/, reviews/
│   ├── lib/            # auth, jwt, validation (zod), pricing, cart, orders, email, invoice, api helpers
│   ├── hooks/          # useApi, useDebounce, useTheme, useAddToCart, useWishlistToggle
│   ├── store/          # Zustand stores (auth, cart, wishlist, toast)
│   ├── types/          # Shared TypeScript types
│   ├── styles/         # Tailwind globals + theme tokens
│   └── middleware.ts   # Route protection, admin guard, maintenance mode
├── prisma/             # schema.prisma, seed.ts
├── tests/              # Playwright fixtures + smoke specs
├── Dockerfile · docker-compose.yml · docker-entrypoint.sh
└── .env.example
```

## Security notes

- Passwords are hashed with bcrypt. Refresh tokens, verification tokens and reset tokens are stored only as SHA-256 hashes.
- Cookies are httpOnly and `SameSite=Lax`. They're `Secure` when the app is served over HTTPS.
- CORS is enforced in `middleware.ts` (same-origin plus `CORS_ALLOWED_ORIGINS`; preflight from unknown origins gets 403).
- Security headers (frame, content-type, referrer, HSTS and permissions policy) are set in `next.config.mjs`. API responses are sent with `Cache-Control: no-store`.
- All input goes through Zod validation. Free text is stripped of HTML tags and control characters, and email HTML is escaped.
- Uploads are checked against a MIME allow-list, a size limit and magic bytes.
- Rate limiting covers login, register, password reset and the newsletter (toggle with `RATE_LIMIT_ENABLED`).
- Order placement decrements stock atomically, so the store can't oversell. The PaymentIntent amount and owner are verified, and a PaymentIntent can't be reused for a second order.
