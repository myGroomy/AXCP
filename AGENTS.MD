# AGENTS.MD — AXCP POS Project

## Project Identity
- **Name:** AXCP
- **Type:** Point of Sale (POS) system
- **Stack:** React 18 + Vite + TypeScript + Tailwind CSS + Framer Motion + Zustand + Express + Prisma + SQLite/PostgreSQL + Tauri v2
- **Deployment:** Browser-first (Vite) + Tauri desktop shell

## Code Conventions

### TypeScript
- Strict mode enabled
- No `any` — use `unknown` and type guards
- No `// @ts-ignore` or `// @ts-expect-error`
- Interfaces over types for object shapes
- Exported types in `types/`; inline types for local-only

### Naming
| Thing | Convention | Example |
|-------|-----------|---------|
| Components | PascalCase | `ProductCard.tsx` |
| Hooks | camelCase, `use` prefix | `useProducts.ts` |
| Stores | camelCase, `Store` suffix | `cartStore.ts` |
| Files (React) | PascalCase | `PaymentModal.tsx` |
| Files (logic) | camelCase | `format.ts` |
| Routes | kebab-case | `/purchase-orders/new` |
| API routes | kebab-case | `purchase-orders` |

### React
- Functional components only — no class components
- Props typed with `interface` (not inline), exported if shared
- `useCallback`/`useMemo` only when profiling shows a bottleneck
- No default exports — named exports only

### State Management
- Zustand for client state (auth, cart, UI)
- Custom hooks with `useQuery` pattern for server data fetching
- No putting server data into Zustand — fetch fresh instead

### API
- Shared Zod schemas in `packages/validation/` — used by both client and server
- All mutations go through `api.ts` Axios instance (base URL, interceptors, error handling)

### CSS
- Tailwind utility classes — no custom CSS files except `index.css` for Tailwind directives
- No CSS modules, no styled-components, no CSS-in-JS
- Animation classes via Framer Motion `motion.div` components

### Git
- Branch: `main` (stable), `develop` (integration), `feat/<name>` (features)
- Commits: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)
- No commits directly to `main` — PRs only

## Project Structure

```
axcp/
├── src/                    # React frontend
│   ├── components/
│   │   ├── ui/             # Button, Input, Modal, Table, Card, Badge
│   │   ├── layout/         # AppLayout, Sidebar, Header
│   │   └── shared/         # DataTable, SearchBar, Pagination, ConfirmDialog
│   ├── features/           # Domain modules (auth, products, sales, reports...)
│   ├── stores/             # Zustand stores
│   ├── hooks/              # Custom hooks
│   ├── lib/                # api.ts, format.ts, validators.ts
│   └── types/              # TypeScript interfaces
├── server/
│   ├── routes/             # Express route handlers
│   ├── middleware/         # auth, validate, errorHandler
│   └── services/           # Business logic
├── prisma/                 # schema.prisma, migrations, seed.ts
├── src-tauri/              # Tauri Rust config + icons
├── packages/
│   └── validation/         # Shared Zod schemas
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── docs/
```

## Build Phases

### Phase 1 — Foundation (Scaffold + Auth + Core DB)
**Goal:** Running app shell with auth and database
- Initialize npm workspace, Vite + React + TS + Tailwind
- Scaffold Express server with middleware stack (cors, helmet, morgan, rate-limit, error handler)
- Write Prisma schema for all models (User, Product, Variant, Category, Sale, SaleItem, Customer, StockMovement, Supplier, PurchaseOrder, POItem)
- Implement auth: login endpoint, JWT middleware, refresh token
- Build login page UI + auth store (Zustand) + protected route wrapper
- Seed script: admin user, sample categories, 20 products

**Deliverable:** User can log in, see empty dashboard, logout. DB has seeded data.

### Phase 2 — Core POS (Products + Sales)
**Goal:** Complete product management and sales checkout flow
- Product CRUD pages: list table, create/edit form, variant editor, category tree
- Product search (debounced) and barcode filtering
- Sales checkout screen: product grid search, cart panel, quantity/discount controls
- Payment modal: cash, card, transfer, split payment
- Receipt view (screen + browser print)
- Sale creation API (transactional: sale + items + stock decrement)
- Hold/resume orders, return/refund processing

**Deliverable:** User can add products, browse inventory, perform full sale flow from cart to receipt.

### Phase 3 — Reports + Users
**Goal:** Dashboard analytics and role-based access control
- Dashboard: daily sales summary cards, top products table, sales trend chart (Recharts)
- Report endpoints: daily-sales, top-products, inventory valuation, low-stock
- Report pages with date range picker and export placeholder
- User management: create/edit/deactivate users, assign roles
- Role-based middleware on backend, role-gated UI on frontend
- Low-stock alerts and stock adjustment history

**Deliverable:** Manager can view reports; admin can manage users; role restrictions enforced.

### Phase 4 — Suppliers, Desktop & Polish
**Goal:** Purchasing module, Tauri desktop build, testing, deployment
- Supplier CRUD pages
- Purchase order creation with product selector
- Stock-in from PO (updates inventory, records cost)
- Purchase order history and status tracking
- Tauri v2 integration: configure sidecar, bundle Express binary via pkg
- Offline mode validation (SQLite, no-network test)
- E2E tests (Playwright) for critical paths
- Documentation: README with setup instructions, environment guide

**Deliverable:** Full POS application running in browser and as Tauri desktop app.

## Environment Variables
| Var | Purpose | Default |
|-----|---------|---------|
| `DATABASE_PROVIDER` | `sqlite` or `postgresql` | `sqlite` |
| `DATABASE_URL` | Connection string | `file:./prisma/dev.db` |
| `JWT_SECRET` | Token signing key | — |
| `JWT_EXPIRES_IN` | Access token TTL | `15m` |
| `CORS_ORIGIN` | Allowed origins | `http://localhost:5173` |
| `PORT` | Server port | `3001` |

## Commands
| Command | Action |
|---------|--------|
| `npm run dev` | Start Vite + Express concurrently |
| `npm run build` | Build frontend + compile TS server |
| `npm run test` | Run all tests (Vitest) |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run lint` | ESLint check |
| `npm run db:push` | Push Prisma schema to current DB |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:seed` | Seed development data |
| `npm run tauri:dev` | Start Tauri dev mode |
| `npm run tauri:build` | Build Tauri desktop installer |
