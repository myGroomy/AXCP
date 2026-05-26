# Software Requirements Specification — AXCP

## 1. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, Framer Motion | React 18+, Node 20+ |
| State | Zustand | latest |
| Backend | Node.js, Express, TypeScript | Express 4.x |
| ORM | Prisma (multi-provider: SQLite + PostgreSQL) | latest |
| Desktop | Tauri v2 (Rust) | v2 |
| Auth | jsonwebtoken + bcryptjs | latest |
| Validation | Zod (shared between client & server) | latest |
| API | REST (JSON) | — |
| Unit Tests | Vitest | latest |
| E2E Tests | Playwright | latest |

## 2. Environment & Setup

- **Node:** >= 20 LTS
- **Package manager:** npm (lockfile `package-lock.json`)
- **Dev DB:** SQLite file at `prisma/dev.db`
- **Prod DB (web):** PostgreSQL 15+
- **Tauri CLI:** `cargo install tauri-cli --version "^2.0"`

## 3. System Architecture

### Deployment Modes

**Desktop (Tauri):** Frontend Vite build served by Tauri webview. Express backend launched as a Tauri sidecar process. SQLite DB at platform appdata directory. Fully offline.

**Web:** Vite dev server or static build. Express backend on a server. PostgreSQL. Multi-user.

### High-Level Architecture

```
┌──────────────────────────────────────┐
│            Tauri Shell               │
│  ┌─────────────────────────────┐     │
│  │   React SPA (Vite build)    │     │
│  │   - Zustand stores          │     │
│  │   - React Router v6        │     │
│  │   - Framer Motion           │     │
│  └──────────┬──────────────────┘     │
│             │ HTTP REST (localhost)   │
│  ┌──────────▼──────────────────┐     │
│  │   Express API Server        │     │
│  │   (Tauri sidecar process)   │     │
│  └──────────┬──────────────────┘     │
│             │ Prisma ORM              │
│  ┌──────────▼──────────────────┐     │
│  │  SQLite (desktop) /         │     │
│  │  PostgreSQL (web)           │     │
│  └─────────────────────────────┘     │
└──────────────────────────────────────┘
```

### Monorepo Structure

```
axcp/
├── src/                    # React frontend
├── server/                 # Express backend
├── prisma/                 # Prisma schema + migrations
├── src-tauri/              # Tauri Rust shell + config
├── packages/               # Shared types, validation schemas
├── tests/                  # Integration + E2E tests
├── docs/                   # Documentation
├── package.json            # Root workspace config
└── tauri.conf.json         # Tauri configuration
```

## 4. Database Schema

### Core Models (Prisma)

```
enum Role { ADMIN, MANAGER, CASHIER }
enum StockMovementType { IN, OUT, ADJUSTMENT }
enum SaleStatus { ACTIVE, COMPLETED, REFUNDED, VOID }
enum PaymentMethod { CASH, CARD, TRANSFER, MIXED }
enum POStatus { DRAFT, SENT, PARTIAL, RECEIVED, CANCELLED }

User            { id, username, password, role, name, active, createdAt, updatedAt }
Product         { id, sku, name, description, price, costPrice, categoryId, image, barcode, active, createdAt, updatedAt }
ProductVariant  { id, productId, name, value, priceOverride, stock }
Category        { id, name, parentId?, description }
StockMovement   { id, productId, variantId?, type, quantity, reason, userId, createdAt }
Sale            { id, invoiceNo, subtotal, tax, discount, total, paymentMethod, status, userId, customerId?, notes, createdAt }
SaleItem        { id, saleId, productId, variantId?, quantity, unitPrice, discount, total }
Customer        { id, name, phone, email, loyaltyPoints, createdAt }
Supplier        { id, name, contactPerson, phone, email, address, taxId, createdAt }
PurchaseOrder   { id, poNumber, supplierId, status, notes, total, userId, createdAt, updatedAt }
POItem          { id, poId, productId, variantId?, quantity, unitCost, total, received }
```

### Multi-Provider Strategy

```prisma
datasource db {
  provider = env("DATABASE_PROVIDER")  // "sqlite" or "postgresql"
  url      = env("DATABASE_URL")
}
```

A startup script detects `DATABASE_PROVIDER` and runs `prisma generate + db push` with the correct provider. For PostgreSQL, use `prisma migrate deploy` instead of `db push` in production.

## 5. API Endpoints

### Auth
```
POST   /api/auth/login          → { token, user }
POST   /api/auth/refresh        → { token }
```

### Products
```
GET    /api/products            → paginated list (?search, ?category, ?page, ?limit)
GET    /api/products/:id        → detail with variants
POST   /api/products            → create
PUT    /api/products/:id        → update
DELETE /api/products/:id        → soft-delete (active=false)
```

### Categories
```
GET    /api/categories          → tree (with children nested)
POST   /api/categories          → create
PUT    /api/categories/:id      → update
DELETE /api/categories/:id      → delete (fails if has products)
```

### Sales
```
POST   /api/sales               → create (transactional: sale + items + stock decrement)
GET    /api/sales               → list (?dateFrom, ?dateTo, ?userId)
GET    /api/sales/:id           → detail with items
POST   /api/sales/:id/return    → process return (partial or full)
```

### Reports
```
GET    /api/reports/daily-sales    → { date, revenue, count, avgOrder }
GET    /api/reports/top-products   → [{ product, quantity, revenue }]
GET    /api/reports/inventory      → { totalItems, totalValue, categoryBreakdown }
GET    /api/reports/low-stock      → [{ product, currentStock, threshold }]
```

### Users
```
GET    /api/users               → list
POST   /api/users               → create (admin only)
PUT    /api/users/:id           → update
DELETE /api/users/:id           → deactivate
```

### Suppliers & POs
```
GET    /api/suppliers                → list
POST   /api/suppliers                → create
PUT    /api/suppliers/:id            → update
GET    /api/purchase-orders          → list
POST   /api/purchase-orders          → create
POST   /api/purchase-orders/:id/receive  → stock-in
```

### Unified Response Format
```typescript
// Success
{ success: true, data: T }

// Error
{ success: false, error: string, code: string }
```

## 6. Frontend Routes

| Route | Page | Key Components |
|-------|------|---------------|
| `/login` | Login | LoginForm |
| `/dashboard` | Dashboard | SalesSummaryCard, TopProductsTable, TrendChart, RecentSalesList |
| `/products` | Product List | DataTable, SearchBar, FilterPanel, ProductCard |
| `/products/new` | Add Product | ProductForm, VariantEditor, CategoryPicker, ImageUploader |
| `/products/:id` | Edit Product | ProductForm, VariantEditor |
| `/categories` | Categories | CategoryTree, CategoryForm |
| `/sales/new` | POS Checkout | ProductGrid, CartPanel, PaymentModal, ReceiptPane |
| `/sales` | Sales History | DataTable, SaleDetailModal, ReturnModal |
| `/reports` | Reports | TabNav, ChartView, DateRangePicker, ExportButton |
| `/users` | Users | DataTable, UserForm, RoleBadge |
| `/suppliers` | Suppliers | DataTable, SupplierForm |
| `/purchase-orders` | PO List | DataTable, POForm, StatusBadge |
| `/purchase-orders/new` | New PO | POForm, SupplierPicker, ProductSelector |
| `/settings` | Settings | StoreInfoForm, TaxRateForm, PrinterConfig |

## 7. Middleware Stack (Express)

```typescript
app.use(cors({ origin: whitelist }));
app.use(express.json({ limit: '10mb' }));
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(morgan('combined'));  // logging
app.use('/api', apiRouter);   // all routes
app.use(errorHandler);        // global error handler
```

### Auth Gateway
```typescript
// Applied to all routes except /api/auth/*
// Extracts Bearer token → verifies JWT → attaches req.user
// Returns 401 if expired/invalid
```

### Validation Middleware
```typescript
// Generic zod validation factory
// validate(schema) → validates req.body, req.query, req.params
// Returns 400 with { error: "Validation failed", details: [...] }
```

## 8. Error Handling

### Error Codes
| Code | Meaning | HTTP Status |
|------|---------|------------|
| `UNAUTHORIZED` | Invalid/expired token | 401 |
| `FORBIDDEN` | Insufficient role | 403 |
| `NOT_FOUND` | Resource doesn't exist | 404 |
| `VALIDATION_ERROR` | Zod validation failed | 400 |
| `CONFLICT` | Duplicate SKU, etc. | 409 |
| `INTERNAL_ERROR` | Unexpected server error | 500 |

### Error Response
```json
{ "success": false, "error": "Product not found", "code": "NOT_FOUND" }
```

## 9. Testing Strategy

| Type | Tool | What | Target |
|------|------|------|--------|
| Unit | Vitest | Stores, utils, validation schemas | 80%+ coverage |
| Integration | Vitest + supertest | API routes with test DB (SQLite in-memory) | All endpoints |
| E2E | Playwright | Sales flow, product CRUD, auth, reports | 5 critical paths |
| Desktop | Manual | Tauri build, print, offline behavior | N/A |

### E2E Critical Paths
1. Login → Dashboard loads correctly
2. Create product with variants → appears in product list
3. Open POS → search product → add to cart → checkout → receipt
4. Create supplier → create PO → receive stock → inventory updates
5. Admin creates user → new user logs in → role restrictions apply

## 10. Security

- Passwords: bcrypt (12 salt rounds)
- JWT: access token 15min + refresh token 7d
- Web: httpOnly cookie; Desktop: localStorage (no server-side cookie)
- CORS: whitelist origins only (configurable via env)
- Rate limit: 10 req/min on `/api/auth/login`
- Input validation: Zod on every endpoint
- SQL injection: prevented by Prisma parameterized queries
- XSS: React JSX escape by default + Content-Security-Policy headers

## 11. Logging

- Request logging: Morgan (combined format in prod, dev in dev)
- Application errors: Winston (file transport, error level)
- Stock movements, user actions: DB audit via StockMovement/UserActivityLog tables
- No PII in logs
