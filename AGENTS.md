# AGENTS.md

POS & Inventory system for **TB. Losari Jaya 2** (building materials store).

## Project Layout

- `laravel-app/` — primary Laravel 12 full-stack app (MySQL, Blade SPA, vanilla JS)
- `assets/` + `index.html` — static fallback (localStorage, deployed to Vercel)
- `scripts/` — build/deploy scripts

## Laravel App

| Command | Action |
|---------|--------|
| `cd laravel-app && composer install && npm install` | Install deps |
| `cd laravel-app && npm run build` | Build frontend (Vite + Tailwind 4) |
| `cd laravel-app && npm run dev` | Vite dev server (HMR) |
| `cd laravel-app && php artisan serve` | Serve locally (port 8000) |
| `cd laravel-app && php artisan migrate:fresh --seed` | Reset DB + seed demo |
| `cd laravel-app && php artisan test` | Run all tests |
| `cd laravel-app && ./vendor/bin/pint` | Auto-fix code style |
| `cd laravel-app && ./vendor/bin/pint --test` | Check code style |

**Demo creds:** `admin` / `losari123`

## Architecture

- **Single controller** (`PosController`) + **single service** (`PosBootstrapService`)
- Every mutation returns full state payload — frontend replaces entirely
- **Admin** (all ops) vs **Cashier** (checkout only)
- Source-of-truth for demo data: `database/seeders/data/losari_inventory.php` (369 items)

## Static Fallback

| Command | Action |
|---------|--------|
| `npm run build` | Copy `assets/` + `index.html` → `dist/` |

Files in `assets/` and `public/pos/` are independent copies. Sync manually when changing both.

## Commit Attribution

AI commits MUST include:
```
Co-Authored-By: (agent model name and attribution)
```
