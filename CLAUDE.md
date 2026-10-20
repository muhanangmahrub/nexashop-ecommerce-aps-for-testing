Build a production-ready, full-stack web application called "NexaShop" —
a modern B2C e-commerce platform. The app must be complex enough to support
200+ positive and negative UI test cases for both Playwright and Katalon Studio portfolios.

## Tech Stack (your choice, but recommended):

- Frontend: Next.js 14+ with TypeScript, Tailwind CSS, shadcn/ui
- Backend: Node.js with Express or Next.js API Routes
- Database: PostgreSQL with Prisma ORM
- Auth: NextAuth.js with JWT
- State Management: Zustand or Redux Toolkit
- Payment: Stripe (test mode)
- Email: Nodemailer (mock)
- Storage: Local or Cloudinary (for product images)
- Containerization: Docker + docker-compose

## Core Modules (must be complete and production-like):

### 1. Authentication & Authorization

- Register with email verification flow
- Login / Logout
- Forgot password / Reset password via email token
- Google OAuth (optional but preferred)
- Role-based access: Customer, Admin, Super Admin
- Session management with refresh tokens
- Account lockout after 5 failed login attempts
- Password strength validation
- Profile management (update name, email, avatar, password)

### 2. Product Catalog

- Product listing with pagination (20 items/page)
- Product detail page (images, description, specs, stock)
- Product search with debounce
- Filter by: category, price range, rating, availability
- Sort by: price asc/desc, newest, best seller, rating
- Product image gallery with zoom
- Product variants (size, color, quantity)
- Stock indicator (In Stock / Low Stock / Out of Stock)
- Related products section
- Product breadcrumb navigation

### 3. Shopping Cart

- Add/remove/update item quantity
- Persistent cart (saved to DB for logged-in users)
- Guest cart (localStorage, merge on login)
- Cart item count badge in header
- Price calculation (subtotal, shipping, tax, discount)
- Cart validation (stock check before checkout)
- Empty cart state

### 4. Wishlist

- Add/remove products to wishlist
- View wishlist page
- Move item from wishlist to cart
- Wishlist count badge

### 5. Checkout & Orders

- Multi-step checkout: Cart → Address → Shipping → Payment → Confirmation
- Address management (add/edit/delete, set default)
- Multiple shipping options (standard, express, same-day)
- Coupon/promo code validation
- Stripe payment integration (test mode)
- Order confirmation page with order number
- Order history list with status
- Order detail page
- Order status tracking (Pending → Processing → Shipped → Delivered → Cancelled)
- Cancel order (only when status is Pending)
- Invoice download (PDF)

### 6. Reviews & Ratings

- Submit review with star rating (1-5) and comment
- Only verified purchasers can review
- Edit/delete own review
- Review listing with pagination
- Average rating display
- Rating breakdown (5★ x%, 4★ x%, etc.)
- Helpful votes on reviews

### 7. Admin Dashboard

- Dashboard with analytics (total orders, revenue, users, products)
- Product management: CRUD, bulk actions, image upload
- Category management: CRUD, nested categories
- Order management: list, filter, update status
- User management: list, ban/unban, change role
- Coupon management: create, activate/deactivate
- Inventory management: stock alerts, bulk update
- Sales report with chart (daily/weekly/monthly)

### 8. Notifications

- In-app notification center (order updates, promotions)
- Mark as read / Mark all as read
- Notification count badge
- Email notifications (order confirmation, shipping update)

### 9. Search & Discovery

- Global search bar with suggestions (autocomplete)
- Search results page with filters
- Recent searches history
- No results state with suggestions
- Search by product name, category, brand

### 10. Miscellaneous UI Features

- Responsive design (mobile, tablet, desktop)
- Dark/light mode toggle
- Loading skeletons
- Toast notifications (success, error, warning)
- Infinite scroll OR pagination
- Breadcrumb navigation
- 404, 500 error pages
- Maintenance mode page
- Cookie consent banner
- Newsletter subscription (footer)
- Social sharing buttons on product page

## API Requirements (RESTful):

All endpoints must return proper HTTP status codes:

- 200 OK, 201 Created, 204 No Content
- 400 Bad Request (validation errors with field-level messages)
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 409 Conflict (duplicate email, etc.)
- 422 Unprocessable Entity
- 429 Too Many Requests (rate limiting)
- 500 Internal Server Error

## Validation Requirements (critical for negative test cases):

Every form must have thorough validation:

- Required field validation
- Min/max length validation
- Email format validation
- Password strength (min 8 chars, uppercase, number, special char)
- Phone number format
- Numeric range validation (price, quantity)
- File type and size validation (images)
- Cross-field validation (confirm password, date ranges)
- Server-side validation returning structured error responses:
  {
  "success": false,
  "errors": {
  "email": "Email already exists",
  "password": "Password must be at least 8 characters"
  }
  }

## Seed Data Requirements:

Provide a seed script that creates:

- 3 admin users + 10 customer users (with known credentials)
- 5 categories (Electronics, Fashion, Food, Books, Sports)
- 50 products with variants, images, and realistic data
- 20 completed orders with reviews
- 5 active coupon codes
- Sample notifications

## Test-Friendly Requirements:

- All interactive elements must have data-testid attributes
- Example: data-testid="login-email-input", data-testid="add-to-cart-btn"
- Consistent and predictable URL structure
- No CAPTCHAs
- No rate limiting on test endpoints (configurable via env)
- API health check endpoint: GET /api/health
- Test mode flag via environment variable: NEXT_PUBLIC_TEST_MODE=true
- When TEST_MODE=true: skip email verification, use test payment

## Project Structure:

├── src/
│ ├── app/ # Next.js app router
│ ├── components/ # Reusable UI components
│ ├── lib/ # Utilities, helpers
│ ├── hooks/ # Custom React hooks
│ ├── store/ # State management
│ ├── types/ # TypeScript types
│ └── styles/ # Global styles
├── prisma/
│ ├── schema.prisma
│ └── seed.ts
├── tests/ # Placeholder for Playwright tests
├── docker-compose.yml
├── .env.example
└── README.md

## README must include:

- Project overview
- Tech stack
- Setup instructions (docker + manual)
- Environment variables documentation
- Seed data credentials
- API documentation (or link to Swagger)
- Known test accounts (admin/customer credentials)
- List of all features for test coverage reference

## Quality Standards:

- TypeScript strict mode
- ESLint + Prettier configured
- Error boundaries for React components
- Proper loading and error states for all async operations
- Optimistic UI updates where appropriate
- Proper HTTP caching headers
- Security: helmet, cors, rate limiting, input sanitization
- No console.logs in production code
- Environment-based configuration

Build this application completely — all modules, all pages, all API endpoints.
Do not leave placeholders or TODOs. The application must be runnable with
docker-compose up in one command after setting up .env from .env.example.
