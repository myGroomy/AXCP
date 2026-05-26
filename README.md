# AXCP — Point of Sale System

A modern, full-featured Point of Sale (POS) application built with React and Express. Supports browser and desktop (Tauri) deployment.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Zustand, Framer Motion |
| Backend | Express, Prisma ORM |
| Database | SQLite (dev), PostgreSQL (production) |
| Desktop | Tauri v2 (Rust) |
| Testing | Vitest, Playwright |

## Features

- **Auth** — JWT-based login with access & refresh tokens, role-based access (Admin, Manager, Cashier)
- **Products** — CRUD with variants, categories, barcode search, low-stock alerts
- **Sales** — Checkout with cart, discount, split payment, hold/resume, returns
- **Reports** — Dashboard with daily sales, top products, inventory valuation, trends
- **Users** — Manage employees with role assignments
- **Suppliers & Purchases** — Supplier management, purchase orders, stock-in from PO
- **Desktop** — Runs as a native app via Tauri v2

## Prerequisites

- Node.js 18+
- npm 9+

## Installation

```bash
# Clone & enter
git clone https://github.com/myGroomy/AXCP.git
cd AXCP

# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Generate Prisma client & push schema
npx prisma generate
npx prisma db push

# Seed demo data
npm run db:seed
```

## Development

```bash
# Start both frontend & backend concurrently
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001

## Default Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| manager1 | cashier123 | Manager |
| cashier1 | cashier123 | Cashier |

## Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Start Vite + Express |
| `npm run build` | Build for production |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run lint` | ESLint |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run tauri:dev` | Start Tauri desktop |
| `npm run tauri:build` | Build desktop installer |

## Environment

See `.env.example` for all config options. Defaults use SQLite — set `DATABASE_PROVIDER=postgresql` and update `DATABASE_URL` for PostgreSQL.
