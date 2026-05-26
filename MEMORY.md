# AXCP — Memory & Context

## Overview

AXCP is a dual-mode (web + Tauri desktop) Point of Sale system for F&B, retail, fashion, and hardware verticals. Built with React 18 + Vite + TypeScript + Tailwind CSS + Express + Prisma + SQLite.

## Architecture

```
AXCP/
├── prisma/                  # Schema + seed
│   ├── schema.prisma        # 12 models
│   └── seed.ts              # 3 users, 14 products, categories, suppliers
├── server/                  # Express API
│   ├── index.ts             # App entry (8 routers)
│   ├── routes/
│   │   ├── auth.ts          # JWT login/refresh/me
│   │   ├── products.ts      # CRUD
│   │   ├── categories.ts    # Tree + CRUD
│   │   ├── sales.ts         # Create (transactional), list, return
│   │   ├── reports.ts       # daily-sales, top-products, inventory, low-stock
│   │   ├── users.ts         # CRUD (admin-only write)
│   │   ├── suppliers.ts     # CRUD
│   │   └── purchase-orders.ts # Create, list, receive
│   └── middleware/
│       └── auth.ts          # JWT verify + requireRole
├── src/                     # React client
│   ├── App.tsx              # Routes (landing → login → dashboard + pages)
│   ├── stores/
│   │   ├── authStore.ts     # Zustand: JWT storage, auto-refresh
│   │   └── themeStore.ts    # Zustand: 3-color gradient, localStorage
│   ├── components/
│   │   ├── ui/              # Button, Input, Icons, ColorPicker
│   │   └── layout/          # AppLayout, ProtectedRoute
│   ├── features/
│   │   ├── auth/            # LoginPage
│   │   ├── products/        # List + Form pages
│   │   ├── categories/      # CategoryListPage
│   │   ├── sales/           # POSCheckout, SalesHistory
│   │   ├── reports/         # Dashboard, Reports
│   │   ├── users/           # UsersPage
│   │   ├── suppliers/       # SuppliersPage
│   │   └── purchases/       # PurchaseOrdersPage
│   ├── pages/               # LandingPage
│   └── lib/                 # api.ts (axios), format.ts, theme.ts
├── packages/
│   └── validation/          # Shared Zod schemas
└── package.json             # npm workspaces monorepo
```

## Key Stack Decisions

| Decision | Rationale |
|----------|-----------|
| String fields not Prisma enums | SQLite doesn't support enums |
| Zustand for cart | Avoids re-renders on frequent POS updates |
| localStorage for JWT | Acceptable for desktop; httpOnly cookies better for web |
| features/ dirs | Domain-driven grouping over pages/ |
| SQLite default | Swap schema for PostgreSQL in production |
| CSS variable colors | 3-color gradient system with color picker persistence |

## Auth System

- **JWT in localStorage** via Zustand authStore
- **Axios interceptor** auto-refreshes on 401
- **requireRole middleware**: ADMIN for users write, MANAGER+ for products write
- **JWT_SECRET** validated at startup — no fallback, exits if missing or `dev-secret`

## Theme System

- 3-color gradient palette stored in CSS variables (`--color-g-1`, `--color-g-2`, `--color-g-3`)
- Persisted to localStorage via Zustand `themeStore`
- ColorPicker component with 4 presets + manual color inputs
- Default: Indigo → Violet → Cyan (#2563eb → #7c3aed → #06b6d4)
- Typography: Plus Jakarta Sans throughout

## API Endpoints

| Route | Description |
|-------|-------------|
| POST /api/auth/login | Returns access + refresh tokens |
| POST /api/auth/refresh | Refresh token rotation |
| GET /api/auth/me | Current user info |
| CRUD /api/products | Products with variant support |
| CRUD /api/categories | Category tree with product-count guard |
| POST/GET /api/sales | Create (stock decrement) + list with date filter |
| POST /api/sales/:id/return | Restock items |
| GET /api/reports/* | Daily sales, top products, inventory, low-stock |
| CRUD /api/users | Admin-only write |
| CRUD /api/suppliers | Supplier management |
| CRUD /api/purchase-orders | PO creation + receive stock-in |

## Seed Users

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | ADMIN |
| cashier1 | cashier123 | CASHIER |
| manager1 | manager123 | MANAGER |

## Critical Notes

- **NVM required**: Always source nvm before npm commands: `export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"`
- **Build**: `npm run build:client` (TS check + Vite) → 780KB JS bundle
- **Dev server** runs in tmux session `axcp` — stop with `tmux kill-session -t axcp`
- **Seed ID assumption**: Seed uses `categories.indexOf(cat) + 1` for upsert IDs — fragile if DB state changes
- **Gitignore**: `.env` is NOT in `.gitignore` — only `.env.local` and `.env.production` are
- **Build after server change**: Must remove `server/dist/` before `npm run build:server`
