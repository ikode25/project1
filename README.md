# Golden Clippers — Barber & Salon Enterprise Management System

A complete, production-ready **Barber & Salon management system for Ghana**, built entirely on **Google Apps Script** with a bound **Google Sheet** as the database. It ships as two files:

- **`Code.gs`** — all backend logic: Google Sheets data access, authentication, booking, POS, inventory, reports, SMS/Email notifications.
- **`index.html`** — the entire front-end: public marketing/booking website **and** the secured admin/staff dashboard, in one responsive, low-bandwidth-friendly page.

## Features

### Public website
- Mobile-first hero carousel, fully admin-editable (images, titles, buttons)
- Live services & price list (GH₵) grouped by category, pulled from the sheet
- Staff/team showcase, each stylist showing their working days
- **Photo gallery** of work samples with a lightbox viewer, fully admin-managed
- Multi-branch selector
- **Step-by-step booking wizard**: Branch → Service (with category filter) → Stylist (with live "Available/Not Available" status and working-day tags, or "Anyone") → a real calendar with a live availability grid per time slot → your details → a review-and-confirm summary — ending in a polished confirmation screen with your booking reference. Ghana phone number validation throughout (`0XXXXXXXXX` or `+233XXXXXXXXX`)
- SMS/Email confirmation the moment a booking is submitted
- Customer reviews display **plus a public "Leave a Review" star-rating form**
- Contact section: click-to-call, WhatsApp deep link, embedded Google Map, opening hours
- A small hand-built inline-SVG icon set throughout (no emoji, no icon-font download)

### Admin / staff dashboard (role-based: Owner, Manager, Staff, Receptionist)
- Secure login (SHA-256 salted password hashing, session tokens via `CacheService`)
- Overview dashboard: today's revenue, today's appointments, upcoming bookings, low-stock alerts, plus a **7-day revenue trend chart**
- Appointment management: confirm / reschedule / cancel / mark completed / no-show, filter by branch, staff, date, status; live per-slot availability prevents double-booking
- Point of Sale (POS): add services/products to a cart, discounts, **Cash / MTN MoMo / Vodafone Cash / Telecel Cash / AirtelTigo Money / Card**, printable receipt
- Staff management with commission rates, **working-day scheduling** (drives booking-wizard availability), and a photo picker (upload or paste a URL, with live preview)
- Inventory management with low-stock alerts and restock logging
- Customer CRM: profiles, visit & purchase history, loyalty points
- Multi-branch support with an "All Branches" consolidated view for the Owner
- Reports: revenue by day, best-selling services, staff performance/commissions, expenses vs income, **CSV and PDF export**, all shown as **built-in inline-SVG charts** (revenue trend line, best-seller bars, payment-method donut, staff performance bars) — no external charting library
- Expense tracking per branch
- **Theme customization** — Owner can change primary/secondary/accent/background/text colors live from Settings, plus business name, tagline, and logo (photo picker with preview)
- **Photo gallery manager** — Owner/Manager can add/edit/reorder photos that showcase the salon's work on the public site
- **Hero carousel & image manager** — Owner/Manager can add/edit/reorder hero slides and upload images directly to Google Drive (no external image host needed)
- **Services page** — a dedicated admin screen to add/edit/photograph exactly the menu the POS sells from (name, category, price, duration, branch, active flag, photo)
- Point of Sale item grid shows a **photo thumbnail** for every service/product; the cart defaults to a **walk-in sale** (no customer lookup required) with a one-click "Register customer" toggle for the times you do want to capture loyalty points
- Every "image URL" field across Staff, Services, Products, Hero Slides, Gallery, and the Logo uses the same **upload-or-paste photo picker with a live thumbnail preview**
- **Booking QR code** — a "Scan to Book" card styled with your logo and theme colors, generated live in Branding & Theme, with a one-click Print button (save as PDF or print to hand out at the shop)
- Dark/light mode toggle for the dashboard UI; the admin sidebar collapses into a compact scrollable icon strip on mobile instead of pushing content off-screen
- SMS + **branded HTML Email** notifications (business logo, name, and theme colors in a proper header banner, not plain text): booking confirmation, status updates, appointment reminders, **post-service "thank you" with loyalty points earned**, sales receipts — via `MailApp` and a pluggable SMS gateway (Arkesel or Hubtel, both popular in Ghana), with a "simulate" mode for testing before you have SMS credentials
- User management (create staff logins, assign roles/branches, reset passwords); staff can also **self-register** from the login screen — new accounts are created inactive with the lowest-privilege role until an Owner reviews and activates them in Users
- Login screen has a show/hide password toggle

### Ghana-specific details
- All monetary values shown as **GH₵** with 2 decimal places
- Ghana phone number validation/normalization (`0XXXXXXXXX`, `+233XXXXXXXXX`, `233XXXXXXXXX`)
- Mobile Money is a first-class payment method in POS
- All dates/times use the **Africa/Accra** timezone
- Lightweight, dependency-free front-end for low-bandwidth mobile users
- Server-side price resolution everywhere — the browser can never submit an arbitrary price

## Data model (auto-created by `setupSheets()`)

| Sheet | Columns |
|---|---|
| Branches | BranchID, Name, Location, Phone, OpeningHours |
| Services | ServiceID, Name, Category, Description, DurationMinutes, Price, BranchID, Active, ImageURL |
| Staff | StaffID, Name, Role, BranchID, Phone, Specialties, PhotoURL, Active, CommissionRate, WorkDays |
| Customers | CustomerID, Name, Phone, Email, DateJoined, LoyaltyPoints, Notes |
| Appointments | AppointmentID, Reference, CustomerID, StaffID, ServiceID, BranchID, Date, TimeSlot, Status, CreatedAt, Notes |
| Sales | SaleID, Date, BranchID, CustomerID, StaffID, Items (JSON), Subtotal, Discount, Tax, Total, PaymentMethod, PaymentStatus |
| Products | ProductID, Name, Category, CostPrice, SellingPrice, QuantityInStock, ReorderLevel, BranchID, ImageURL |
| Expenses | ExpenseID, Date, BranchID, Category, Amount, Description |
| Users | Username, PasswordHash, Salt, Role, BranchID, Active, StaffID, Email, Phone, FullName |
| Reviews | ReviewID, CustomerID, StaffID, Rating, Comment, Date |
| Settings | Key, Value (branding, theme colors, tax rate, loyalty rules, SMS gateway config…) |
| HeroSlides | SlideID, ImageURL, Title, Subtitle, ButtonText, ButtonLink, SortOrder, Active |
| Gallery | GalleryID, ImageURL, Caption, Category, BranchID, SortOrder, Active |
| Notifications | NotificationID, Type, Recipient, Message, Status, Date |

`Staff.WorkDays` is a comma-separated list of weekday abbreviations (e.g. `Mon,Tue,Wed,Thu,Fri,Sat`) that drives each stylist's "Available/Not Available" status and the calendar in the public booking wizard. `Settings` also stores `BookingStartHour`, `BookingEndHour`, and `SlotIntervalMinutes`, which control the time slots offered in the wizard (defaults: 9am–6pm, 30-minute slots). `Users.FullName` is captured so an Owner can tell who a pending self-registered account actually belongs to before approving it.

The schema self-heals: if a sheet or column above is missing from an already-deployed spreadsheet (e.g. you update to a newer version of this app that added a column), the next page load automatically creates/fixes it — no manual re-run of `setupSheets()` needed.

Sample data (2 branches, 10 services, 5 staff with working days, 4 products, 5 customers, 8 reviews, 2 hero slides, 6 gallery photos) is seeded automatically on first run so the app is immediately demoable.

## Deployment

1. **Create the Google Sheet.** Go to [sheets.google.com](https://sheets.google.com), create a new blank spreadsheet (this will be your database).
2. **Open the Apps Script editor.** In the Sheet, go to `Extensions → Apps Script`.
3. **Add the code.**
   - Rename the default `Code.gs` file (or paste over it) with the contents of `Code.gs` from this repo.
   - Click the `+` next to Files → `HTML` → name it exactly `index` → paste in the contents of `index.html`.
4. **Run setup once.** In the Apps Script editor toolbar, select the `setupSheets` function from the function dropdown and click **Run**. Grant the requested permissions (Sheets, Drive, Gmail/MailApp, external requests for SMS). This creates every tab with headers and seeds sample data, including a default admin login (see below).
5. **Deploy as a Web App.**
   - Click **Deploy → New deployment**.
   - Select type **Web app**.
   - Set **Execute as**: `Me`.
   - Set **Who has access**: `Anyone` (so customers can reach the public booking page without logging in).
   - Click **Deploy**, authorize, and copy the **Web app URL** — this is your live site.
6. **(Optional) Update an existing deployment.** After making changes, use **Deploy → Manage deployments → Edit → New version** so the live URL picks up your changes.
7. **(Optional) Daily appointment reminders.** In the Apps Script editor, go to `Triggers` (clock icon) → `Add Trigger` → function `sendUpcomingAppointmentReminders`, time-driven, run daily (e.g. every day 8am–9am, Africa/Accra time zone) to automatically SMS/email customers about tomorrow's appointment.

### Default admin login
- **Username:** `admin`
- **Password:** `admin123`

⚠️ **Change this password immediately** after first login via *My Account* in the dashboard, or by editing the `Users` sheet directly.

### Configuring SMS (optional but recommended)
Open the dashboard → **Branding & Theme** → *SMS Gateway* section, and choose:
- **Arkesel** — enter your Arkesel API key and sender ID.
- **Hubtel** — enter your Hubtel Client ID/Secret and sender ID.
- **Simulate** (default) — no real SMS is sent; every message is logged to the `Notifications` sheet so you can verify the flow before going live.

Email notifications work out of the box via `MailApp` (sent from your Google account) as soon as a customer has an email on file — no extra setup needed.

### Customizing branding & theme
Dashboard → **Branding & Theme** lets the Owner change the business name, tagline, logo (upload or URL), contact details, WhatsApp number, Google Maps embed, and the five theme colors (primary/secondary/accent/background/text) with a live preview before saving. Dashboard → **Hero Carousel** lets the Owner/Manager add, edit, reorder, and upload images for the homepage carousel — uploaded images are stored in a `SalonSystem_Uploads` folder in Google Drive automatically.

## Notes on architecture
- Every price shown to a customer or used in a sale is resolved **server-side** from the `Services`/`Products` sheets — the client only ever sends IDs and quantities, preventing price tampering.
- All `google.script.run` calls go through a single `api()` wrapper with a visible loading bar and toast-based error handling — no silent failures.
- Sessions are stateless server tokens (`CacheService`, 6-hour TTL) — no passwords are ever kept in the browser beyond the login form submission.
- The whole front end is one HTML file with no external JS/CSS framework, keeping the public page light for customers on mobile data in Ghana.
