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

> Standalone script instead of bound? Set a `SPREADSHEET_ID` Script Property (see step 3 below) pointing at your sheet; `getSS_()` falls back to it automatically.

## 2. (Optional but recommended) Set your initial admin credentials

Before running setup, open **Project Settings → Script Properties** and add:

| Property | Value |
|---|---|
| `ADMIN_USERNAME` | e.g. `owner` |
| `ADMIN_PASSWORD` | a strong password |

If you skip this, `setupSheets()` generates a random temporary password and
prints it to the execution log (`View → Logs`) — copy it immediately and
change it from the Admin Portal's "Admin Users" tab afterwards.

## 3. Run setup

In the Apps Script editor, select the function `setupSheets` from the
dropdown next to **Run**, and click **Run**. Grant the requested
permissions (Sheets + Drive, for image uploads).

This creates every sheet/tab with the right headers, and seeds:
- Default **Settings** (site name, currency `GHS`, a WhatsApp number, chatbot text — edit these in Admin → Settings)
- One **Admin** account (see step 2)
- One **Payment Method**: Mobile Money — `Emmanuel Darkoh`, `0547359015` (edit/replace in Admin → Payment Methods; add more anytime)
- A sample catalog: **Data Bundles**, **Picture Frames & Gifts**, **Security & Alarm Systems** (School Siren, flagged to route to WhatsApp instead of Add to Cart), **Scripts & Source Code** — delete/edit these from the admin portal once you add your real products.

It's safe to re-run `setupSheets()` later — it only fills in what's missing, it never overwrites existing data.

## 4. Deploy the web app

**Deploy → New deployment → Web app**
- Execute as: **Me**
- Who has access: **Anyone**
- Click **Deploy**, copy the web app URL.

That URL is your **storefront**: `https://script.google.com/macros/s/XXXX/exec`
Your **admin portal** is the same URL with `?page=admin` appended:
`https://script.google.com/macros/s/XXXX/exec?page=admin`

Whenever you edit the code, use **Deploy → Manage deployments → Edit (pencil) → New version** to push changes live.

## 5. Log in to the Admin Portal and finish configuring

Go to `...exec?page=admin`, log in, then:
- **Settings** — set your Site Name, WhatsApp number (used for the floating WhatsApp button and for "Enquire on WhatsApp" products), chatbot greeting.
- **Payment Methods** — edit the seeded Mobile Money entry or add Bank Transfer / Cash on Delivery / other Mobile Money numbers. Customers pick one at checkout.
- **Businesses** — add/edit your real businesses (name, description, logo — upload an image or paste a URL).
- **Products** — add products/services per business. Leave **Stock** blank for unlimited/digital items (data bundles, source code). Tick **"Direct customers to WhatsApp instead of Add to Cart"** for anything that needs a conversation first (installs, custom quotes — e.g. the School Siren).
- **Banners** — upload images for the homepage carousel.
- **Discounts** — run a sale storewide, for one business, or for a single product, with a percent or fixed amount and optional date range.

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

1. Customer adds items to cart (works with **no account** — cart lives in the browser's `localStorage`).
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

- Ghana Mobile Money numbers are auto-formatted for WhatsApp links (`0XXXXXXXXX` → `233XXXXXXXX`); adjust `formatWaNumber()` in `index.html` if you operate in a different country.
- Apps Script web apps are rate-limited and not meant for very high traffic; fine for a small/medium multi-business shop.
- Change the seeded admin password immediately (Admin Portal → Admin Users → Change My Password).
