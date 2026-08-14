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

- **Settings** — site name, currency `GHS`, WhatsApp number, chatbot text (all editable in Admin → Settings)
- **Payment Method** — Mobile Money: `Emmanuel Darkoh`, `0547359015` (edit/replace in Admin → Payment Methods; add more anytime)
- A sample catalog: **Data Bundles**, **Picture Frames & Gifts**, **Security & Alarm Systems** (School Siren, flagged to route to WhatsApp instead of Add to Cart), **Scripts & Source Code** — delete or edit these once you add your real products.

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

## 4. Create your admin account

Get to the admin portal either way:

- Click the **shield icon** (🛡) in the top-right of the storefront header, or the **Admin Portal** link in the footer, or
- Append `?page=admin` to your web app URL.

The **first** time you open it, it shows a one-time **"Create your admin
account"** form — pick your own name, username and password. That form
disappears permanently once an account exists, and from then on the same page
shows a normal login. No default password is ever created, so there's nothing
to look up in a log and nothing insecure left lying around.

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
  - Tick **"Send customers to WhatsApp instead of Add to Cart"** for anything needing a conversation first (installs, custom quotes — e.g. the School Siren).
  - Use the **In Stock / Out of Stock** button in the products table to flip availability instantly without editing the product.
- **Banners** — upload images for the homepage carousel.
- **Discounts** — run a sale storewide, for one business, or for a single product, percent or fixed amount, with an optional date range.

Every image field is a **photo picker**: paste a URL or click *Choose Photo* to
upload from your device, with a live thumbnail preview either way.

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
- Ghana Mobile Money numbers are auto-formatted for WhatsApp links (`0XXXXXXXXX` → `233XXXXXXXX`); adjust `formatWaNumber()` in `index.html` if you operate in a different country.
- Apps Script web apps are rate-limited and not meant for very high traffic; fine for a small/medium multi-business shop.
- Admin sessions last 6 hours, then the portal returns you to the login screen.
- Sheet tabs are matched case-insensitively and ignoring stray spaces, so renaming `Products` to `products` won't break the app — but don't create two tabs whose names differ only by case.
- Upgrading the code adds any new columns to your existing sheets automatically (`SCHEMA_VERSION` in `Code.gs`), so you never lose data when pulling a newer version.
