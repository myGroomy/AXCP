# AXCP Architecture Document

## 1. System Overview

AXCP is a dual-mode POS system sharing one React + Express codebase, switching DB via Prisma multi-provider. Desktop mode runs fully offline via Tauri + SQLite. Web mode runs on a server with PostgreSQL for multi-user access.

## 2. Monorepo Layout

```
axcp/                          # Single npm workspace
├── package.json               # Workspace root — npm workspaces
├── vite.config.ts             # Vite config (React SPA)
├── tsconfig.json              # Shared TS config
├── tailwind.config.ts
├── src/                       # Frontend (React SPA)
├── server/                    # Backend (Express API)
├── prisma/                    # Database schema + migrations
├── src-tauri/                 # Tauri v2 Rust shell
├── packages/
│   └── validation/            # Shared Zod schemas (client + server)
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

The monorepo uses **npm workspaces** (`packages/*`). `src/` and `server/` are not separate packages — they share the root `tsconfig.json` and `node_modules`, but have separate `tsconfig.server.json` for server-side compilation.

## 3. Frontend Architecture

### Directory Design Rationale

The `features/` directory groups code by business domain rather than technical role. This means each feature folder owns its components, but shared UI primitives live in `components/ui/`. Benefits:

- **Cohesion:** All code for "products" is in one place
- **Enforcement:** No cross-feature imports — features only share via `components/ui/` and `stores/`
- **Tree-shakeable:** Dead features are obvious and deletable

### Key Patterns

**Component hierarchy:**
```
Page (route component)
  └── Feature-specific components (features/<domain>/)
        └── Shared UI (components/ui/)
              └── Layout (components/layout/)
```

**Data flow:**
```
User action → Zustand store action → API call (lib/api.ts)
  → Express handler → Prisma query → Response
  → Zustand store update → React re-render → Framer Motion animation
```

### Error Boundaries
- One error boundary per route group (sales/*, products/*, etc.)
- Global error boundary at App level for uncaught errors
- Error boundaries show retry button and error code (not stack trace to user)

## 4. Backend Architecture

### Layered Structure

```
Route (thin — validation + delegation) → Service (business logic) → Prisma (data)
```

- **Routes:** Parse HTTP, call validation middleware, delegate to service, format response
- **Services:** Business logic, Prisma transactions, error generation
- **Middleware:** Cross-cutting concerns — auth, validation, logging, rate limiting

This matters because Prisma transactions are complex (nested creates, stock updates) — keeping them in services keeps routes readable and testable.

### Sidecar Configuration (Tauri)

The Express server runs as a Tauri sidecar process: Tauri spawns the Node.js server at app startup, kills it on app close. The sidecar binary is compiled via `pkg` (Node.js → standalone executable) and bundled into the Tauri app resources.

```
tauri.conf.json:
  "bundle": {
    "externalBin": ["bin/axcp-server"]
  }
```

## 5. Database Strategy

### Dual-Provider Approach

Prisma supports switching providers via `DATABASE_PROVIDER` env var, but some features differ:

| Feature | SQLite | PostgreSQL |
|---------|--------|-----------|
| Auto-increment | Implicit | Serial/bigserial |
| Enums | String field | Native enum |
| Migrations | `db push` | `migrate dev` |
| Concurrency | Single-writer | Full MVCC |

**Workaround strategy:**
- Model enums as string fields (works in both)
- No native JSON fields (use varchar in SQLite, JSON in PG — both accessed via Prisma `String`)
- All dev work done on SQLite for speed
- Separate CI job runs migrations against PostgreSQL to catch compatibility issues

### Migration Workflow

```bash
# Local dev (SQLite — schema-first)
npm run db:push

# Prod web (PostgreSQL — migration-first)
DATABASE_PROVIDER=postgresql DATABASE_URL=... npx prisma migrate deploy
```

### Seed Script
`prisma/seed.ts` creates: 1 admin user, 3 categories, 20 sample products with variants, 5 customers, 3 suppliers, 50 sample sales (past 30 days), 5 purchase orders.

## 6. State Management Architecture

| State | Store | Why not React Query / Context |
|-------|-------|------------------------------|
| Auth token & user | `useAuthStore` (Zustand) | Persisted to localStorage; needed globally before any fetch |
| Cart items | `useCartStore` (Zustand) | Highly transient, high-frequency updates, complex partial mutations |
| Sidebar open, active modal | `useUIStore` (Zustand) | Trivial global UI toggles — Context would cause unnecessary re-renders |
| Product list, sales history | Custom `useQuery` hooks | Server state — cached, refetched, stale-while-revalidate |
| Form state | React Hook Form + Zod | Complex multi-field forms with validation |

**Why Zustand over Context:** Zustand stores only re-render subscribers, not entire subtrees. For a POS cart that updates on every item scan, this means the product search panel doesn't re-render when cart total changes.

## 7. Animation Architecture (Framer Motion)

### Performance Budget
- Animations must not block user input — use `layout="position"` instead of layout animations on large lists
- Use `willChange: "transform, opacity"` on animated elements
- Skip animation on initial mount for first paint performance

### Animation Map
| Element | Animation | Trigger | Duration |
|---------|-----------|---------|----------|
| Page transition | Fade + slide Y (20px) | Route change | 150ms |
| Cart item add | Slide in from right + opacity | Add to cart | 200ms |
| Cart item remove | Slide out to left + opacity | Remove | 150ms |
| Buttons | Scale 1.02 on hover, 0.98 on tap | Hover/click | 100ms |
| Cards (product grid) | Lift (y: -3, shadow increase) | Hover | 150ms |
| Modal | Backdrop fade (0→0.5) + scale 0.95→1 | Open/close | 200ms |
| Toast notifications | Slide in from right edge | Trigger event | 300ms |
| Sidebar | Width transition (64px ↔ 240px) | Toggle | 200ms |
| DataTable rows | Stagger children (30ms delay each) | Table mount | 300ms total |
| Skeleton loading | Pulse opacity | Data loading | 1s cycle |

## 8. Error Handling Architecture

### Error Propagation
```
throw new AppError('NOT_FOUND', 'Product not found')  // Service layer
  → errorHandler middleware                            // Catches all
  → { success: false, error: string, code: string }    // Response
```

### Frontend Error Handling
- Axios interceptor catches 401 → clear auth store → redirect `/login`
- Axios interceptor catches 403 → toast "You don't have permission"
- Network error (no internet) → show offline banner (desktop) or retry overlay (web)
- React error boundaries → show fallback UI with error code + retry button
- Form errors → Zod validation display inline per field

## 9. Testing Architecture

### Unit Tests (Vitest)
- Test Zustand stores (dispatch action → assert state)
- Test utility functions (format currency, date, generate invoice number)
- Test Zod validation schemas (valid input passes, invalid fails)
- Test API route handlers in isolation (mock service layer)

### Integration Tests (Vitest + supertest)
- Start Express app with in-memory SQLite test DB
- Run full API flow: login → create product → create sale → assert stock decremented
- Prisma test helpers: `setupTestDb()` seeds minimal data before each test suite

### E2E Tests (Playwright)
```typescript
// Example test: Complete sale flow
test('cashier completes a sale', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name=username]', 'cashier1');
  await page.fill('[name=password]', 'testpass');
  await page.click('button[type=submit]');
  await expect(page).toHaveURL('/sales/new');
  
  await page.click('[data-testid=product-1]');
  await page.click('[data-testid=product-3]');
  await expect(page.locator('[data-testid=cart-count]')).toHaveText('2');
  
  await page.click('[data-testid=checkout-btn]');
  await page.click('[data-testid=payment-cash]');
  await page.fill('[data-testid=amount-received]', '100000');
  await page.click('[data-testid=complete-sale]');
  
  await expect(page.locator('[data-testid=receipt]')).toBeVisible();
});
```

## 10. Build & CI Pipeline

### Build Process
```bash
# Development
npm run dev          # Concurrently: Vite dev server (5173) + Express (3001)

# Production web build
npm run build        # Vite build → dist/ + tsc server → server/dist/

# Tauri desktop build
npm run tauri:build  # Vite build → Tauri bundles .deb/.dmg/.msi + sidecar
```

### CI (GitHub Actions)
```
push → lint → typecheck → test (Vitest + SQLite)
                                    ↓
                            Playwright E2E
                                    ↓
                            Build + Deploy (web)
                                    ↓
                            (optional) Tauri build
```

### PostgreSQL CI Job
```
Seperate job runs against PostgreSQL service container:
  - prisma migrate deploy
  - Integration tests with PG-specific features
  - Catch provider incompatibilities before merge
```
