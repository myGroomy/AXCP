# Product Requirements Document — AXCP

## 1. Product Overview

AXCP is a browser-first POS with native desktop support via Tauri. It covers products/inventory, sales checkout, reporting, user roles, and supplier management. UI emphasizes smooth animations (Framer Motion) and minimal clicks-to-checkout.

## 2. User Personas

| Persona | Role | Goals | Pain Points |
|---------|------|-------|------------|
| **Sari** — Cashier | Frontline staff | Ring up sales fast, print receipts, handle returns | Slow UI, too many clicks, confusing discounts |
| **Budi** — Store Manager | Operations | Track inventory, view daily sales, manage staff | Reports take too long, can't see stock levels at a glance |
| **Ani** — Owner/Admin | Business owner | Full control, supplier management, profit analytics | Expensive subscriptions, locked into vendor ecosystems |

## 3. Functional Requirements

### FR-01: Products & Inventory [P0]
- CRUD products with name, SKU, price, cost price, category, image, barcode
- Variant support (size, color, material) — each variant tracks stock independently
- Hierarchical categories (unlimited depth via self-referencing parentId)
- Barcode/QR generation and scanner input (keyboard wedge mode)
- Low-stock alerts with per-product threshold configuration
- Stock adjustment with reason tracking (IN/OUT/ADJUSTMENT + note + user)
- Product search by name, SKU, barcode (debounced, 200ms)

### FR-02: Sales & Checkout [P0]
- Cart: add/remove/quantity, quick product search grid
- Payment methods: cash, card, bank transfer, mixed (split payment)
- Discounts: percentage, fixed amount, per-item, order-level
- Tax: per-item or per-order, configurable tax rates
- Receipts: browser print + thermal printer support (ESC/POS), digital copy
- Order hold/resume (store cart state temporarily)
- Returns/refunds: full or partial, with reason

### FR-03: Reporting & Dashboard [P1]
- Daily sales summary: revenue, transaction count, avg order value
- Top-selling products (by quantity and revenue)
- Sales trends: daily/weekly/monthly line charts
- Inventory valuation (total cost of stock on hand)
- Low-stock report (products below threshold)
- User activity log (who did what, when)

### FR-04: Users & Roles [P0]
- Roles: Admin (full), Manager (inventory + reports), Cashier (sales only)
- Cashier: limited to sales screen, max discount cap
- Manager: inventory adjustments, approve refunds over threshold, view reports
- Admin: create/deactivate users, change roles, full access
- Login: username/password, JWT session, auto-logout after inactivity

### FR-05: Suppliers & Purchasing [P1]
- Supplier CRUD: name, contact person, phone, email, address, tax ID
- Purchase order: create with supplier, items, quantities, expected cost
- Stock-in from PO: confirms receipt, updates inventory, records actual cost
- Purchase history per supplier (PO list with status tracking)

## 4. Non-Functional Requirements

| Category | Requirement |
|----------|-----------|
| Performance | Cart ops < 200ms; reports < 3s for 10k transactions |
| Offline | Desktop mode zero internet dependency; SQLite local |
| Security | JWT auth, bcrypt (12 rounds), Zod validation, Prisma parameterized queries |
| Cross-platform | Linux, Windows, macOS via Tauri |
| Animation | Page transitions (150ms fade+slide), button micro-interactions, skeleton loading |
| Accessibility | Keyboard-navigable checkout, ARIA labels, high-contrast mode |
| Reliability | Graceful error handling on all API endpoints; auto-save on desktop |

## 5. Acceptance Criteria (per module)

- **Products:** User creates a product with 3 variants → sees stock = 0 → records stock-in → stock updates correctly
- **Sales:** Cashier adds 3 items → applies 10% discount → takes cash → receipt prints → inventory decremented
- **Reports:** Manager opens dashboard → sees today's sales chart → filters to this week → data updates
- **Users:** Admin creates cashier account → cashier logs in → cannot access settings → admin deactivates → cashier blocked
- **Suppliers:** User creates supplier → creates PO for 5 items → receives stock → inventory shows +5
