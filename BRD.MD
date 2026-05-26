# Business Requirements Document — AXCP

## 1. Executive Summary

AXCP is a mid-level Point of Sale (POS) system for small to medium businesses in F&B, retail, fashion, clothing, and hardware verticals. It covers inventory management, sales processing, reporting, user roles, and supplier management in a single platform with a modern animated UI.

The system uses a dual-deployment model: browser-based web for multi-device access, and Tauri desktop for offline-capable single-machine use — sharing the same codebase.

## 2. Market Context

Existing POS solutions fall into two camps:
- **Cloud POS (Square, Toast):** subscription-heavy, require constant internet, expensive for small shops
- **Legacy Desktop POS (QuickBooks POS, Vend):** outdated UI, expensive licenses, no cross-platform

AXCP fills the gap: modern UI, works offline or online, open-source stack, mid-level pricing.

## 3. Business Objectives

- **O1:** Single codebase that serves both web and desktop deployments without duplication
- **O2:** Full offline capability via Tauri + SQLite — no internet dependency for daily operations
- **O3:** Multi-vertical support without per-client customization (F&B, retail, fashion, hardware)
- **O4:** Modern animated UI that reduces cashier training time by 50% vs legacy POS systems

## 4. Target Audience

| Segment | Size | Key Need |
|---------|------|----------|
| Small Retail Stores | < 10 employees, single location | Simple inventory + fast checkout |
| F&B Outlets | Cafes, restaurants, fast food | Menu management, table orders, fast payment |
| Fashion/Clothing Brands | Boutiques, multi-brand stores | Variant-based inventory (size, color, season) |
| Hardware Stores | Tools, materials suppliers | Supplier management, bulk pricing, stock tracking |

## 5. Key Business Features (v1)

| Module | Business Value |
|--------|---------------|
| Products & Inventory | Single source of truth for stock, categories, variants |
| Sales & Checkout | Core revenue-generating flow — cart, payment, receipts |
| Reporting & Dashboard | Data-driven decisions — sales trends, top products |
| Users & Roles | Access control — cashier, manager, admin |
| Suppliers & Purchasing | Stock replenishment — PO creation, stock-in |

## 6. Success Metrics

- Sale transaction completed in < 30 seconds (cashier workflow)
- 1,000+ product SKUs without page load > 2s
- Desktop app fully functional with zero internet connectivity
- Web deployment supports 10+ concurrent users per instance
- Cashier able to process first sale after 5 minutes of training

## 7. Constraints

- Mid-level scope — no ERP features (manufacturing, full CRM, accounting GL)
- Open-source stack only (React, Express, Prisma, SQLite/PostgreSQL)
- Cross-platform desktop via Tauri (Windows, macOS, Linux)
- No cloud infrastructure costs in desktop mode — fully self-contained

## 8. Risks

| Risk | Mitigation |
|------|-----------|
| SQLite concurrent write contention | Single-user desktop mode; web mode uses PostgreSQL |
| Tauri sidecar complexity | Start with web-only dev, add Tauri wrapper after API is stable |
| Cross-vertical requirements divergence | Keep features generic — customization via config, not forks |
| Printer/barcode hardware compatibility | Abstract hardware layer; start with browser Print API + serial fallback |
