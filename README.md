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
- **"My Bookings"** — search by the phone number you booked with, *or* by your booking reference code; results show as a **Kanban board grouped by status** (Pending/Confirmed/Completed/No-show/Cancelled), with a Cancel button on any upcoming booking
- Contact section: click-to-call, WhatsApp deep link, embedded Google Map, opening hours, **social media icon row** (only shows platforms the Owner has filled in)
- A floating **WhatsApp button** (pre-filled "I'd like to book an appointment" message) and a floating **chat-bubble FAQ assistant** that answers from your live services/prices/hours/contact data — a fast rule-based assistant, not a paid generative AI, so it works with no API key or ongoing cost
- A small hand-built inline-SVG icon set throughout (no emoji, no icon-font download)

### Admin / staff dashboard (role-based: Owner, Manager, Staff, Receptionist)
- Secure login (SHA-256 salted password hashing, session tokens via `CacheService`); show/hide password toggle; staff can **self-register**, created inactive with the lowest-privilege role until an Owner approves them in Users
- Overview dashboard: today's revenue, today's appointments, upcoming bookings, low-stock alerts, a **7-day revenue trend chart**, and **Tomorrow / This Week / Next Week / This Month** booking-volume counters
- A **notification bell** in the topbar badges new Pending bookings in real time (polls every 60s) with a quick-view dropdown, plus a one-click **refresh** button
- Appointment management: confirm / reschedule / cancel / mark completed / no-show, filter by branch, staff, date, status; live per-slot availability prevents double-booking. Switch between a **Table view** and a **Kanban board** (one column per status) with native **drag-and-drop** to change an appointment's status
- **Manage Slots** — pick a branch and date and click any time slot to close it (lunch break, fully booked, holiday) so it's never offered in the public booking wizard; clicking gives instant visual feedback and a confirmation toast; already-booked slots are shown separately and can't be closed out from under a customer
- Point of Sale (POS): add services/products to a cart (with **photo thumbnails**), discounts, **Cash / MTN MoMo / Vodafone Cash / Telecel Cash / AirtelTigo Money / Card**, a **modern, colorful branded receipt** (your logo/theme colors, not plain text) with a Print button. The cart defaults to a **walk-in sale** (no customer lookup required) with a one-click "Register customer" toggle for when you do want to capture loyalty points
- **Services page** — a dedicated admin screen to add/edit/photograph exactly the menu the POS sells from (name, category, price, duration, branch, active flag, photo)
- Staff management with commission rates, **working-day scheduling** (drives booking-wizard availability, and is shown to customers on the public Team section too), and a photo picker
- Inventory management with low-stock alerts and restock logging
- Customer CRM: profiles, visit & purchase history, loyalty points
- **Table ⇄ Grid view toggle** on Customers, Staff, Services, and Inventory — flip any of these record lists into a photo-card grid instead of a table (each page remembers your last choice)
- Multi-branch support with an "All Branches" consolidated view for the Owner
- Reports: revenue by day, best-selling services, staff performance/commissions, expenses vs income, **CSV and PDF export**, shown as **vibrant built-in inline-SVG charts** — a revenue trend line, best-seller/staff-performance bar charts, and a true **pie chart** for payment methods that separates every Mobile Money network (MTN MoMo, Vodafone Cash, Telecel Cash, AirtelTigo Money) plus Cash and Card, by both amount **and transaction count** — no external charting library
- Expense tracking per branch
- **Branding & Theme, now organized into tabs** — Branding, Theme & Colors (with live preview), Social & Contact, Booking, Payments & Loyalty, SMS Gateway, and QR Code
- **Social media links** — Owner adds Facebook/Instagram/Twitter(X)/TikTok/YouTube URLs once; only the ones filled in appear as icons on the public site
- **Photo gallery manager** and **Hero carousel manager** — add/edit/reorder site photos and slides, uploaded straight to Google Drive
- Every "image URL" field across Staff, Services, Products, Hero Slides, Gallery, and the Logo uses the same **upload-or-paste photo picker with a live thumbnail preview**
- **Booking QR code** — a "Scan to Book" card styled with your logo and theme colors, with a one-click Print button
- **SMS module** — a dedicated page showing sent/failed/simulated counts, live Arkesel balance (when configured), full delivery history, and a form to **broadcast an SMS to selected staff**
- **Admin FAQ chat assistant** (bottom-right bubble) answers "how do I…" questions with instructions tailored to this dashboard's own pages
- **About page** with system credit
- Dark/light mode toggle (now a clearly visible icon button in both themes); the admin sidebar collapses into a compact scrollable icon strip on mobile instead of pushing content off-screen; every input/select/search field across the whole app shares one modern rounded, focus-ringed style; toast notifications got a modern icon+color redesign
- SMS + **branded HTML Email** notifications (business logo, name, and theme colors in a proper header banner, not plain text): booking confirmation, status updates, appointment reminders, **post-service "thank you" with loyalty points earned**, sales receipts — via `MailApp` and a pluggable SMS gateway (Arkesel or Hubtel, both popular in Ghana), with a "simulate" mode for testing before you have SMS credentials
- User management (create staff logins, assign roles/branches, reset passwords, approve self-registrations)

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
| BlockedSlots | BlockedSlotID, BranchID, Date, TimeSlot |

`Staff.WorkDays` is a comma-separated list of weekday abbreviations (e.g. `Mon,Tue,Wed,Thu,Fri,Sat`) that drives each stylist's "Available/Not Available" status and the calendar in the public booking wizard. `Settings` also stores `BookingStartHour`, `BookingEndHour`, `SlotIntervalMinutes` (control the time slots offered — defaults: 9am–6pm, 30-minute slots), and `SocialFacebook`/`SocialInstagram`/`SocialTwitter`/`SocialTiktok`/`SocialYoutube`. `Users.FullName` is captured so an Owner can tell who a pending self-registered account actually belongs to before approving it. A row in `BlockedSlots` closes one time slot, branch-wide, on one date — managed from the **Manage Slots** admin page.

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
- **Every sheet column is forced to Plain Text format** (`setNumberFormat('@')`) at setup time. Without this, Google Sheets silently "smart-formats" values that look like numbers or times as you write them — a phone number like `0247123456` loses its leading zero, and a time slot like `09:00` gets converted into an actual time value — which then breaks exact-match lookups (phone number search, slot-availability checks) elsewhere in the app. This is set up front so it can't happen going forward; it can't recover a value already mangled by an older deployment, so if a customer's phone lookup ever comes up empty unexpectedly, check the raw value in the `Customers` sheet.
- The one-time schema self-heal check (`ensureSetup_`, described above) is cached for an hour via `CacheService` rather than running on every page load — the earlier version re-verified all 13+ sheet headers on every single request, which was the single biggest cause of the app feeling slow to open.
- Apps Script + Google Sheets is a real, live database, not an in-memory cache — every save and most page loads involve at least one live round trip to Sheets, so some latency (typically under a couple of seconds) is inherent to this platform and can't be fully eliminated. Buttons across the app now give immediate visual feedback (disabled + "Saving…" state, optimistic UI on Manage Slots, confirmation toasts) so actions register clearly even while that round trip is in flight.
