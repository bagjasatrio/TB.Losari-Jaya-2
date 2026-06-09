# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

POS & Inventory system for **TB. Losari Jaya 2** — a building materials store. Two deployment modes:

1. **Laravel full-stack app** (`laravel-app/`) — primary, uses MySQL, server-rendered Blade SPA with vanilla JS
2. **Static HTML/JS fallback** (`assets/` + `index.html`) — standalone client-side version deployed to Vercel, uses localStorage

Both share the same UI design, but only the Laravel version has a real database, auth, and multi-user support.

## Commands

### Laravel app (primary)

```bash
# Navigate to the Laravel app
cd laravel-app

# Install dependencies
composer install && npm install

# Setup environment (copy .env.example, gen key)
php artisan key:generate

# Build frontend assets (Vite + Tailwind CSS 4)
npm run build        # production build
npm run dev          # Vite dev server with HMR

# Run migrations + seed demo data (sets up everything)
php artisan migrate:fresh --seed

# Run tests
php artisan test

# Run a single test
php artisan test --filter=test_admin_can_add_cashier

# Code style check (Laravel Pint)
./vendor/bin/pint --test     # dry-run: check for issues
./vendor/bin/pint            # auto-fix

# Serve locally (Laravel built-in server)
php artisan serve
# Then open http://127.0.0.1:8000

# Or via Laragon: http://tb-losari-jaya-2.localhost/
```

### Demo credentials

```
Username: admin
Password: losari123
```

Or use the **Reset Data** button inside the app to re-seed from scratch.

### Vercel static build (fallback)

```bash
# From repo root
npm run build   # Copies files from assets/ -> dist/
```

## Architecture

### Laravel Backend (`laravel-app/`)

**Single controller, single-service architecture:**
- `PosController` — all API endpoints, route-based auth with session, admin/cashier role checks
- `PosBootstrapService` — builds the entire application state as a single JSON payload (inventory items, categories, units, suppliers, goods receipts, sales, users) returned after every mutation
- `PosDemoSeederService` — resets all data and re-seeds from the Excel-derived dataset (369 inventory items, 18 demo sales, 24 goods receipts)

**Models & DB schema (SQLite for tests, MySQL for dev/prod):**

| Model | Table | Key fields |
|---|---|---|
| `User` | `users` | name, username, role (admin/cashier), password (hashed) |
| `InventoryItem` | `inventory_items` | sku, name, category, unit, supplier_id, stock (dec 12,3), min_stock, price (int), description |
| `InventoryCategory` | `inventory_categories` | name (auto-populated from items) |
| `InventoryUnit` | `inventory_units` | name (auto-populated from items) |
| `Supplier` | `suppliers` | name |
| `GoodsReceipt` | `goods_receipts` | inventory_item_id, supplier_id, quantity (dec 12,3), unit_cost, received_at |
| `Sale` | `sales` | invoice_number (TR-YYMMDD-NNN), subtotal, discount, total, payment_amount, change_amount, sold_at |
| `SaleItem` | `sale_items` | sale_id, inventory_item_id, sku, item_name, category, unit, quantity, unit_price, line_total |

**Key backend pattern:** Every mutation endpoint validates → performs action → returns full `{message, state}` where `state` comes from `PosBootstrapService::build()`. The frontend replaces its entire state on every response — no incremental updates.

**Routes** (`routes/web.php`):
- `GET /` — main page (bootstraps state if authenticated)
- `POST /login` / `POST /logout`
- Auth-required: CRUD items, categories, units, suppliers; goods-in, checkout, reset demo, manage users, PDF reports
- Admin-only: all write operations (items, categories, units, suppliers, goods-in, users, reset, reports)
- Cashier: checkout only

**Database migrations** (`database/migrations/`): 13 migrations total — the default Laravel tables (users, cache, jobs) plus supplier, inventory_items, goods_receipts, sales, sale_items, inventory_categories, inventory_units tables, a decimal precision migration, and a foreign-key-enable migration.

**Database seeders** (`database/seeders/`):
- `PosDemoSeeder` — the main seeder that populates demo data (items, sales, goods receipts, users)
- `PosDemoSeederService` (in `app/Services/`) — wraps PosDemoSeeder with transaction handling and is also callable from the UI's "Reset Data" button
- `DatabaseSeeder` — calls PosDemoSeeder
- `database/seeders/data/losari_inventory.php` — source-of-truth data file with 369 items derived from an Excel spreadsheet (used by PosDemoSeeder)

### Laravel Frontend

**Blade views** (`resources/views/`):
- `welcome.blade.php` — login page (landing page before authentication)
- `pos/app.blade.php` — the main SPA shell; injects `window.POS_BOOTSTRAP` state via `@json`, loads Vite-built assets
- `pos/report-pdf.blade.php` — PDF report template rendered server-side with `barryvdh/laravel-dompdf`

**Vite build pipeline:**
- Entry points: `resources/js/app.js` (JS) and `resources/css/app.css` (Tailwind CSS 4)
- Plugins: `laravel-vite-plugin` + `@tailwindcss/vite`
- Output: `public/pos/app.js`, `public/pos/styles.css`, `public/pos/inventory-data.js` (built artifacts)
- `npm run dev` for HMR during development; `npm run build` for production

**Frontend runtime (`public/pos/app.js`):**
- **Vanilla JavaScript SPA** (~3k lines in built app.js, ~1.9k lines CSS)
- No framework (no React, Vue, Alpine, Livewire)
- State stored in `window.POS_BOOTSTRAP` (injected server-side via Blade `@json`, also cached in `sessionStorage`)
- All DOM rendering is manual: `innerHTML` building, direct event binding via `addEventListener`
- 6 views: Dashboard, Inventory (4 sub-tabs), Cashier, Finance, Reports, Users

### Static Fallback (`assets/` + `index.html`)

- Same UI but uses `localStorage` for persistence
- Contains hardcoded demo credentials and inventory data
- Deployed to Vercel via `scripts/vercel-static-build.mjs` (copies root `assets/` + `index.html` → `dist/`)
- No auth, no multi-user
- **Important:** The Laravel frontend (`public/pos/`) and static fallback (`assets/`) are independent copies. Changes to CSS/JS in `resources/` must be rebuilt with Vite; changes to `public/pos/` or `assets/` must be manually synced to the other.

### Test Patterns

PHPUnit with `RefreshDatabase` trait and SQLite in-memory. Tests create users directly via `User::query()->create()`, then use `$this->actingAs()`. Tests for PDF generation use reflection to call private methods. Key test file: `tests/Feature/InventoryMasterTest.php`.

## Important Notes

- **Inventory data source**: `database/seeders/data/losari_inventory.php` — a PHP array of 369 items derived from an Excel spreadsheet. This is the single source of truth for demo data.
- **Decimal quantities**: Stock, min_stock, and sale quantities support 3 decimal places. The UI allows decimal input for units like kg, liter, meter.
- **Price tiers**: Item descriptions encode `Harga dasar`, `Harga toko`, `Harga eceran` as pipe-delimited text. `PosBootstrapService::priceTextFromDescription()` parses these for display.
- **Invoice format**: `TR-YYMMDD-NNN` (sequential per day, e.g., `TR-260602-001`)
- **Role check**: `$this->ensureAdmin()` in PosController — called at the start of all admin-only methods; returns 403 for cashiers
- **Static version**: The `assets/app.js` and `assets/styles.css` files are the standalone copies. The Laravel version lives in `public/pos/`. When making CSS/JS changes, you may need to update both copies.
