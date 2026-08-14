# Multi-Business Store — Setup Guide

This is a Google Apps Script web app: **one Google Sheet is the database**,
`Code.gs` is the backend, and `index.html` / `admin.html` are the two pages
(customer storefront and admin portal).

It supports any number of businesses (data bundles, picture frames, school
sirens/smart bells, source code, etc.) grouped under one storefront, with
guest or account checkout, Mobile Money payment confirmation, WhatsApp +
a shopping-assistant chatbot, order tracking, banners, discounts, and a full
admin portal (sales, income, expenses, reports).

## 1. Create the Google Sheet + Script

1. Go to [Google Sheets](https://sheets.google.com) and create a new, blank spreadsheet. Name it e.g. "Store Database".
2. Open **Extensions → Apps Script**. This creates a script *bound* to the sheet (recommended — simplest setup).
3. Delete the default `Code.gs` content and paste in this repo's `Code.gs`.
4. Add two new HTML files (**File → New → HTML file**), named exactly `index` and `admin`, and paste in `index.html` and `admin.html` respectively.
5. Open **Project Settings** (gear icon) and tick **"Show appsscript.json manifest file in editor"**. Go back to the editor, open `appsscript.json` and replace its contents with this repo's `appsscript.json`. This declares the Google Drive permission that photo uploads need.

> Standalone script instead of bound? Set a `SPREADSHEET_ID` Script Property (see step 3 below) pointing at your sheet; `getSS_()` falls back to it automatically.

## 2. Setup — there isn't one

**You don't need to run anything.** The first time the web app is opened it
builds itself: every sheet/tab is created with the right headers, and defaults
are seeded:

- **Settings** — site name, currency, chatbot text and theme (all editable in Admin → Settings)
- **Payment Method** — an empty Mobile Money entry, filled in by the first-run wizard in step 4
- A demo catalog: **Data Bundles**, **Electronics & Gadgets**, **Picture Frames & Gifts**, **Security & Alarm Systems**, **Scripts & Source Code** — edit them, or delete them all from Settings once you've added your own.

No personal details are baked into the code, so a fresh copy of this project
starts clean for whoever sets it up.

Seeding is skipped for anything that already has rows, so it never overwrites
your data, and it's safe for the app to re-check on every load.

There's also a `setupSheets()` function you can run manually from the editor if
you ever delete a tab by accident and want it rebuilt immediately.

## 3. Deploy the web app

**Deploy → New deployment → Web app**
- Execute as: **Me**
- Who has access: **Anyone**
- Click **Deploy**, copy the web app URL.

That URL is your **storefront**: `https://script.google.com/macros/s/XXXX/exec`

Whenever you edit the code, use **Deploy → Manage deployments → Edit (pencil) → New version** to push changes live.

## 4. Set up your store (first-run wizard)

Get to the admin portal either way:

- Click the **shield icon** (🛡) in the top-right of the storefront header, or the **Admin Portal** link in the footer, or
- Append `?page=admin` to your web app URL.

The **first** time you open it you get a one-time setup wizard that collects:

- your **admin account** (your own name, username and password),
- your **store name, currency and WhatsApp number**,
- your **Mobile Money account name and number**, which becomes the payment
  method customers see at checkout.

That's enough to start selling. The wizard disappears permanently once an
account exists, and the page shows a normal login from then on. No default
password is ever created, so there is nothing to look up in a log and nothing
insecure left lying around.

## 5. Authorize Google Drive (needed for photo uploads)

Uploaded photos are stored in your Google Drive, and Apps Script only asks for
Drive permission when code that uses it actually runs. Do this once:

1. In the Apps Script editor, pick **`authorizeDrive`** from the function dropdown and click **Run**.
2. Accept the permission prompt ("Advanced → Go to project (unsafe)" is normal for your own scripts).
3. Redeploy: **Deploy → Manage deployments → Edit (pencil) → New version → Deploy**.

If you skip this, everything else still works — the uploader just shows a
message explaining what to do, and you can paste image URLs instead.

## 6. Finish configuring

Log in to the admin portal, then:

- **Settings** — Site Name, currency, the **scrolling news headline** for the top of the store, **theme colors** (pick a primary/accent color or a preset, and light/dark mode), **contact details, social media links and a Google Maps embed** for the footer, WhatsApp number, and the default bundle disclaimer.
- **Payment Methods** — edit the seeded Mobile Money entry or add Bank Transfer / Cash on Delivery / other numbers. Customers pick one at checkout, where the number is shown large with a one-tap **Copy** button.
- **Businesses** — add/edit your businesses (name, description, logo).
- **Products** — add products/services per business:
  - Leave **Stock** blank for unlimited/digital items (data bundles, source code).
  - Tick **"Ask for a phone number before adding to cart"** for data bundles. The customer then enters the receiving number and gets a *Confirm Purchase* popup quoting the product, the number, and your disclaimer. Each confirmed number becomes its own cart line, so one customer can buy the same bundle for several different numbers in a single order.
  - Choose a WhatsApp option (see the table below) for items customers usually ask about before buying.
  - Use the **In Stock / Out of Stock** button in the products table to flip availability instantly without editing the product.
- **Banners** — upload images for the homepage carousel.
- **Discounts** — run a sale storewide, for one business, or for a single product, percent or fixed amount, with an optional date range.

Every image field is a **photo picker**: paste a URL or click *Choose Photo* to
upload from your device, with a live thumbnail preview either way.

The store ships with a demo catalog (Data Bundles, Electronics & Gadgets,
Picture Frames, Security & Alarm Systems, Scripts & Source Code) so you can see
how everything works. When you're ready, **Settings → Starter Content → Delete
demo businesses & products** removes it in one click, leaving anything you
created yourself untouched. Renaming a demo business also adopts it as your
own, so it survives the cleanup.

### The two WhatsApp options on a product

| Setting | Effect |
|---|---|
| *Send customers to WhatsApp **instead of** Add to Cart* | No buy button — quote-only items. |
| *Also show an "Ask a question" WhatsApp button* | Keeps Add to Cart **and** adds an enquiry button. Use for source code, sirens, electronics — anything people ask about before buying. |

Both keep showing the product's price and full description, so nothing is
hidden behind "Contact for price" unless you actually leave the price at 0.

## How it works (data model)

Every sheet lives in the same spreadsheet:

- `Businesses`, `Products` — your catalog, grouped by business.
- `Customers` — optional accounts (passwords are SHA-256 hashed, never stored in plain text). Guests never touch this sheet.
- `Orders` / `OrderItems` — every checkout, guest or account. Prices are always recalculated server-side from the current catalog + active discounts, never trusted from the browser.
- `PaymentMethods` — Mobile Money / bank / other options shown at checkout.
- `Banners`, `Discounts`, `Settings` — merchandising & site config.
- `Expenses` — manual entries for cost tracking; combined with confirmed order income on the Dashboard for a profit figure.
- `Admins` — admin portal logins (also SHA-256 hashed). Admin sessions use a random token cached server-side for 6 hours.

## Checkout & payment flow

1. Customer adds items to cart (works with **no account** — cart lives in the browser's `localStorage`). For products flagged as needing a recipient number, they enter the number and confirm before the item is added.
2. At checkout, they enter delivery details (name/phone/address — prefilled if logged in) and pick a payment method.
3. They pay the shown Mobile Money number/name off-app, then enter **the number they paid from** and the **Transaction ID** back into the form — this is what the admin uses to verify payment.
4. Order is created with `Payment Status = Pending Verification`. Admin confirms or rejects it from Orders in the portal; separately updates `Order Status` (Pending → Processing → Shipped → Completed).
5. Anyone can look up an order any time with **Track Order** (Order ID + phone number), no login required.

## AI Chatbot

The storefront ships with a lightweight rule-based shopping assistant (no
external API key needed) that answers questions about payment, tracking,
delivery, discounts and your businesses, and can hand off to WhatsApp. If
you later want to plug in a real LLM (OpenAI/Anthropic/etc.), replace the
`getBotReply()` function in `index.html` with a call to a new Apps Script
function that calls the provider's API via `UrlFetchApp`, and store the API
key in Script Properties (never in the HTML/JS).

## Notes / things to review before going live

- Both pages are mobile-first: the storefront collapses to a hamburger menu with a scrolling business strip and a category dropdown, and the admin portal's sidebar becomes an off-canvas drawer. Tables scroll horizontally rather than squashing.
- The WhatsApp and chat buttons live behind a single floating launcher (the headset icon) so they never sit on top of a product's own buy controls on a phone.
- Both pages have a **theme toggle** (sun/moon) and a **refresh** button in the header. The toggle is per-device and overrides the store's default theme; refresh pulls live data, bypassing the cache.
- Tapping any product card opens a detail view with the **full description**, price and buy actions.
- Ghana Mobile Money numbers are auto-formatted for WhatsApp links (`0XXXXXXXXX` → `233XXXXXXXX`); adjust `formatWaNumber()` in `index.html` if you operate in a different country.
- Apps Script web apps are rate-limited and not meant for very high traffic; fine for a small/medium multi-business shop.
- Admin sessions last 6 hours, then the portal returns you to the login screen.
- Sheet tabs are matched case-insensitively and ignoring stray spaces, so renaming `Products` to `products` won't break the app — but don't create two tabs whose names differ only by case.
- Upgrading the code adds any new columns to your existing sheets automatically (`SCHEMA_VERSION` in `Code.gs`), so you never lose data when pulling a newer version.

## Speed

Apps Script sheet reads are slow, so the catalog is cached in two places:

- **Server:** the whole storefront payload is cached for 5 minutes. Any admin save clears it immediately, so edits are never stale. Within a single request, each sheet is read at most once (this alone cut a page load from 6 sheet reads to 0 on a warm cache).
- **Browser:** the last payload is kept in `sessionStorage` and painted instantly on a repeat visit while fresh data loads in the background.

There is no blocking spinner anywhere — a thin progress bar at the top of the
page shows work in flight, so the interface stays usable while it loads. Hit
**Refresh** any time to force live data.
