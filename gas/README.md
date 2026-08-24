# School Management — Google Apps Script Source

This folder holds the source for the school's Google Apps Script (GAS) web
app (the tool deployed at the `script.google.com/macros/.../exec` URL that
`index.html` at the repo root redirects to).

- `Code.gs` — server-side backend (Apps Script functions, Google Sheets
  data access).
- `index.html` — the admin/staff web app (single-page app).
- `Portal.html` — the parent-facing fee portal.

## Deploying changes

This repo is the source of truth for review/history, but Apps Script itself
doesn't pull from GitHub automatically. After merging changes here, copy the
updated file(s) into the Apps Script project (Extensions → Apps Script from
the linked Google Sheet, or via `clasp push` if the project is set up with
[clasp](https://github.com/google/clasp)), then re-deploy the web app.

## POS / Inventory / Stock Transactions / Vendors / Sales Reports

Added under the **Inventory & Sales** sidebar group:

- **POS / Sell** — a point-of-sale screen for selling uniforms, books,
  stationery, and other items. Items are shown as a searchable icon grid
  with live stock badges; the customer can be a **walk-in** (with an
  optional name) or a **currently enrolled student**, picked from a
  type-to-search combo box. Checkout creates one "Sale" Stock Transaction
  per cart line, decrements Inventory stock, and prints a receipt.
- **Inventory** — the item catalog (name, category, SKU, price, cost,
  stock, reorder level). Stock is normally moved by Stock Transactions, not
  edited here directly (except manual corrections).
- **Stock Transactions** — the full stock activity log: every Sale,
  Purchase, and Adjustment, with filters, CSV/PDF export, and print. Editing
  or deleting a transaction automatically reverses/reapplies its effect on
  Inventory stock.
- **Vendors** — suppliers used as the "Party" on Purchase transactions.
- **Sales Reports** — Daily / Weekly / Monthly / Termly sales summaries
  (revenue, items sold, top-selling items, outstanding balances), with a
  printable report.

### New Google Sheets

The backend creates these sheets automatically on first use (same
`getOrCreateSheet` pattern as the rest of the app): `Inventory`, `Vendors`,
`Stock Transactions`.

### New backend entry points (`Code.gs`)

`getInventoryItems`, `saveInventoryItem`, `deleteInventoryItem`,
`getVendors`, `saveVendor`, `deleteVendor`, `getStockTransactions`,
`saveStockTransaction`, `deleteStockTransaction`, `completeSale`,
`getActiveStudentsList`.
