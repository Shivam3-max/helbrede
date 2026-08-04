# Helbrede Healthcare — QA Test Plan

> **For an AI/automated tester driving a real browser against the deployed app.**
> Goal: verify **all functionality** and **responsiveness** on the live deployment.

---

## 1. Scope & context

Helbrede Healthcare is a **B2B pharma ordering platform** (India). Buyers register by
picking an annual turnover band (which maps to Distributor / Stockist / Chemist / Doctor /
Retailer / PCD / Hospital), are logged in **instantly** — no verification wait — and see
**fixed role-based trade prices** on ~359 SKUs, add to a bulk cart, and place orders. There is an **admin panel**
for managing products, users, and orders. Public marketing pages, trade calculators, a
business-starter planner, and a franchise section round it out.

**Tech:** Next.js (App Router) on Vercel, MySQL database, role-based pricing, cookie sessions.

---

## 2. Test environment

| Item | Value |
|------|-------|
| Production URL | `https://helbrede.vercel.app` (replace with the real deployed URL) |
| Browsers | Chrome (primary), plus one WebKit/Safari and one Firefox pass if possible |
| Network | Normal + one throttled "Slow 4G" pass on the homepage |

### 2.1 Test accounts (seeded demo data)
| Role | Email | Password | Expected |
|------|-------|----------|----------|
| Admin | `admin@helbrede.com` | `admin123` | Full admin panel access |
| Distributor | `distributor@demo.in` | `demo123` | Net distributor prices |
| Stockist | `stockist@demo.in` | `demo123` | Distributor **+20%** |
| Chemist | `chemist@demo.in` | `demo123` | Distributor **+44%** |
| Doctor | `doctor@demo.in` | `demo123` | Clinic/doctor rate (= chemist rate) |
| Pending (legacy/manually-suspended) | `pending@demo.in` | `demo123` | **Verification gate** — no prices, "pending approval" (self-registration no longer creates this state; admins can still set it) |

> ⚠️ These are demo credentials in a live DB. Do **not** delete/modify real data; if a test
> creates data (orders, registrations, products), note it so it can be cleaned up.

### 2.2 Viewports for responsive testing
| Label | Size | Notes |
|-------|------|-------|
| Mobile | **375 × 812** | Primary mobile check; also spot-check **320 × 640** (smallest) |
| Tablet | **768 × 1024** | Mid breakpoint |
| Desktop | **1280 × 800** | Standard desktop |
| Wide | **1440 × 900** | Large desktop |

Breakpoints in use: `sm` 640px, `md` 768px, `lg` 1024px. The header switches to a **hamburger
menu below 1024px** (lg).

---

## 3. Test methodology (per page)

For **every** page/route, at **each** viewport:

1. **Loads** — HTTP 200, no error boundary / "Something went wrong" / 500 page.
2. **Console** — no errors (red) in the browser console. Warnings are noted, not failed.
3. **No horizontal overflow** — the page must not scroll sideways. Run this in the console and it must return `overflowX: false`:
   ```js
   ({ overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
      scrollW: document.documentElement.scrollWidth, vw: window.innerWidth })
   ```
   If it returns `true`, find the culprit element(s):
   ```js
   [...document.querySelectorAll('body *')]
     .filter(el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
       return r.right > document.body.clientWidth + 1 && r.width > 0
         && cs.position !== 'fixed' && cs.position !== 'absolute'; })
     .map(el => ({ tag: el.tagName, cls: el.className.toString().slice(0,60),
       right: Math.round(el.getBoundingClientRect().right) }))
     .sort((a,b) => b.right - a.right).slice(0,5)
   ```
   > Note: intentionally wide **tables** are allowed *if* they scroll inside their own
   > container (parent has `overflow-x-auto`) and the **page** itself does not scroll sideways.
4. **Images** — no broken images (placeholders showing a dashed "PRODUCT IMAGE" box are
   **intended**, not a bug). Check `img.naturalWidth > 0` for real images (logo, uploaded images).
5. **Screenshot** each viewport for the report.

**PASS** = loads + no console errors + no page-level horizontal overflow + layout intact + intended behavior works.

---

## 4. Functional test suites

Legend for steps: *→* = navigate/click, **bold** = expected result.

### 4.1 Global — Header & Footer (NAV)
| ID | Steps | Expected |
|----|-------|----------|
| NAV-01 | Load any page, inspect header | **Real Helbrede logo image** (petal mark + "Helbrede HEALTH CARE") top-left; nav links: Products, Trade Tools, Start a Business, Franchise, Why Helbrede; Cart, Login, Register (logged out) |
| NAV-02 | Click each nav link | Routes to the correct page; active link is highlighted |
| NAV-03 | Scroll down | Header stays fixed at top, gains a subtle shadow/blur on scroll |
| NAV-04 | **Mobile/tablet (<1024px):** click hamburger (☰) | Menu opens with all nav links + Login/Register; icon toggles to ✕; tapping a link closes it and navigates |
| NAV-05 | Footer | Full logo **with "…power for healing" tagline**; Platform / Grow With Us / Contact columns; links work; contact info + copyright present |
| NAV-06 | Browser tab | **Favicon** shows the petal mark (no `/favicon.ico` 404 in network tab) |
| NAV-07 | Every page title | Sensible `<title>` (e.g. "Product Catalog — …", "Trade Calculators — …") |

### 4.2 Homepage (HOME)
| ID | Steps | Expected |
|----|-------|----------|
| HOME-01 | Load `/` | Hero: **"Helbrede Healthcare, now booking in Bulk Online"** — "Helbrede" in deep blue, "Healthcare" in bright/sky blue (matching the logo), "Bulk Online" underlined |
| HOME-02 | Hero right side | **"Live demand across India"** map card renders (India map + blue city dots); a live ticker updates every few seconds with order/pool/join events |
| HOME-03 | CTA buttons | "Browse 360+ Products" → `/products`; "Register Your Business" → `/register`; "Trade Calculators" → `/tools` |
| HOME-04 | Stats / Roles / How-it-works / Categories / Business-tools / CTA sections | All render; category cards link to `/products?group=…`; numbers/labels present |
| HOME-05 | Scroll-reveal animations | Sections fade/slide in on scroll (no layout jump) |

### 4.3 Product Catalog (CAT)
| ID | Steps | Expected |
|----|-------|----------|
| CAT-01 | Load `/products` | Grid of product cards; "**359 of 359 products**" count; search box + category dropdown + sort dropdown |
| CAT-02 | Type "ofloxacin" (or any salt) in search | List filters to matching SKUs **by name or composition**; count updates |
| CAT-03 | Clear search, pick a category | List filters to that category; count updates; URL may carry `?group=` |
| CAT-04 | Change sort (A–Z / Z–A / price) | Order changes accordingly |
| CAT-05 | Product card (guest) | Shows MRP + "Login for your trade price"; Rx / Fast-mover badges where applicable |
| CAT-06 | Click a card | → Product detail page |
| CAT-07 | Deep-link `/products?group=Tablets%20%26%20Capsules` | Loads pre-filtered |

### 4.4 Product Detail (PDP)
| ID | Steps | Expected |
|----|-------|----------|
| PDP-01 | Open any product | Breadcrumb (Catalog / Group / Name), image (placeholder ok), name, packing, composition, category/type/movement, Rx flag |
| PDP-02 | **Guest** view | "Trade prices are hidden for guests" card + "Login to see your price" / "Register free" |
| PDP-03 | **Logged-in** view | Shows the role's **trade price**, MRP strike-through, qty stepper, **"Add to Bulk Cart"** |
| PDP-04 | Related products | Shows a few related SKUs that navigate correctly |

### 4.5 Authentication (AUTH)
| ID | Steps | Expected |
|----|-------|----------|
| AUTH-01 | `/login` → enter admin creds → submit | Redirects to `/admin`; header shows admin chip + Logout |
| AUTH-02 | `/login` → **one-click demo chips** (Distributor/Stockist/Chemist/Doctor/Admin) | Each logs in and redirects (`/dashboard` or `/admin`) |
| AUTH-03 | Wrong password | Inline error message; not logged in |
| AUTH-04 | `/register` → pick a **turnover band** (Up to ₹25L / ₹25–75L / Above ₹75L) — the ≤25L band also asks a business-type dropdown (Doctor/Chemist/Retailer/PCD/Hospital) — fill contact/email/password (everything else is optional), submit | Account is created **active** and the applicant is **logged in immediately** — no pending-verification wait. Shows a "You're in!" screen with the email/password just set, then auto-redirects to `/dashboard` |
| AUTH-05 | Register with an existing email | Clear error (duplicate) |
| AUTH-06 | Register form validation | Only contact person, email, and password are required; GST/drug license/medical reg. no./degree upload/city/state/phone/firm name are all optional and never block submission |
| AUTH-06b | ≤25L band → Doctor business type | Shows an optional degree-certificate file upload; uploads in the background after login (never blocks registration/login if it fails) |
| AUTH-07 | Login as **`pending@demo.in`** (a manually-suspended/legacy account — self-registration no longer produces pending accounts) | Logs in but sees **verification gate** (no trade prices, "awaiting approval") |
| AUTH-08 | Logout | Returns to guest state; protected pages redirect/deny |
| AUTH-09 | Session persistence | Refresh page while logged in → still logged in |

### 4.6 Role-based pricing (PRICE)
| ID | Steps | Expected |
|----|-------|----------|
| PRICE-01 | Note a product's price as **Distributor** | Base "net" price `P` |
| PRICE-02 | Same product as **Stockist** | ≈ `P × 1.20` (+20%) |
| PRICE-03 | Same product as **Chemist** | ≈ `P × 1.44` (+44%) |
| PRICE-04 | Same product as **Doctor** | ≈ chemist rate |
| PRICE-05 | As **guest** | No trade price — MRP + login prompt only |
| PRICE-06 | Cross-check catalog vs PDP vs cart | Same price for the same role everywhere |

### 4.7 Cart & Checkout (CART)
| ID | Steps | Expected |
|----|-------|----------|
| CART-01 | Guest opens `/cart` | "Login to build your bulk cart" + Login/Register |
| CART-02 | Logged-in: add product from PDP → open `/cart` | Item appears with role price, qty, line total |
| CART-03 | Change qty (± and typing) | Line total + order summary recalc live |
| CART-04 | Order summary | Subtotal (trade), **GST 12%**, MRP value (strike), **"You save vs MRP"**, **Total** — math is correct |
| CART-05 | Remove item | Item removed; totals update; empty state if last item |
| CART-06 | Cart badge in header | Reflects item count |
| CART-07 | "Place Bulk Order" | Order placed → confirmation with order ID → appears in `/dashboard` *(creates data — note the order ID)* |
| CART-08 | Cart persistence | Refresh keeps cart contents |

### 4.8 Dashboard (DASH)
| ID | Steps | Expected |
|----|-------|----------|
| DASH-01 | Logged-in user → `/dashboard` | Greeting, stat tiles, order history list |
| DASH-02 | Open an order | Line items, quantities, totals, status |
| DASH-03 | Invoice / reorder (if present) | Downloads invoice / re-adds to cart without error |
| DASH-04 | Guest → `/dashboard` | Redirects to login / access prompt |

### 4.9 Trade Calculators (CALC) — `/tools`
| ID | Steps | Expected |
|----|-------|----------|
| CALC-01 | Load `/tools` | 6 tabs: **PTR/PTS, Product Margin, Scheme Convertor, GST Split, Breakeven, ROI Projector** |
| CALC-02 | PTR/PTS: enter MRP, GST%, margins | Base price / PTR / PTS compute correctly and update live |
| CALC-03 | Each of the other 5 calculators | Inputs accept values; outputs recompute live; no NaN/crash on empty or extreme inputs |
| CALC-04 | Edge inputs (0, blank, very large) | Graceful handling, no `NaN`/`Infinity` shown |

### 4.10 Business Starter (BIZ) — `/business-starter`
| ID | Steps | Expected |
|----|-------|----------|
| BIZ-01 | Enter a budget | Generates a recommended **starter basket** (table: Product / Why / Qty / Your rate / Cost / Margin) |
| BIZ-02 | Basket table on mobile | Scrolls **horizontally inside its container**; the page itself does not scroll sideways |
| BIZ-03 | Charts / projections | Render without overflow |
| BIZ-04 | Save / convert-to-cart / lead form (if present) | Submits without error *(may create a lead — note it)* |
| BIZ-05 | License/GST checklist section | Renders |

### 4.11 Franchise (FRAN) — `/franchise`
| ID | Steps | Expected |
|----|-------|----------|
| FRAN-01 | Load `/franchise` | Territory/reach map renders; open vs claimed territories |
| FRAN-02 | Check a district/territory | Shows availability |
| FRAN-03 | "Apply for monopoly rights" form | Validates + submits without error *(creates a lead — note it)* |

### 4.12 Admin — Overview (ADM) — login as admin first
| ID | Steps | Expected |
|----|-------|----------|
| ADM-01 | `/admin` | Sidebar (Overview/Products/Users/Orders) + stat tiles (SKUs, users, orders, etc.) |
| ADM-02 | Non-admin or guest → `/admin/*` | **Access denied** gate ("Admin access only") |
| ADM-03 | Sidebar on mobile | Collapses to a **horizontal-scroll nav** at the top; content below |

### 4.13 Admin — Products
| ID | Steps | Expected |
|----|-------|----------|
| ADMP-01 | `/admin/products` | Searchable product list; "+ Add Product" |
| ADMP-02 | Add a product (name, packing, MRP, prices) | Created; appears in list *(note it for cleanup)* |
| ADMP-03 | Edit a product | Changes persist after refresh |
| ADMP-04 | Upload a product image | Uploads (needs Vercel Blob configured); image shows; **if Blob token missing, expect a clear error, not a crash** |
| ADMP-05 | Delete a test product | Removed after confirm |
| ADMP-06 | Validation | Rejects missing name/packing/invalid MRP with a clear message |

### 4.14 Admin — Users
| ID | Steps | Expected |
|----|-------|----------|
| ADMU-01 | `/admin/users` | User list with role, firm, status (active/pending) |
| ADMU-02 | Approve the pending user | Status → active |
| ADMU-03 | Filter by status/role (if present) | Filters correctly |
| ADMU-04 | Reject / delete a **test** user only | Removed *(never delete the seeded demo accounts)* |

### 4.15 Admin — Orders
| ID | Steps | Expected |
|----|-------|----------|
| ADMO-01 | `/admin/orders` | All orders list; filter by status |
| ADMO-02 | Open an order | Full details (buyer, lines, totals) |
| ADMO-03 | Update order status (Placed → Confirmed → …) | Persists; reflects on the buyer's dashboard |

### 4.16 Why Helbrede (WHY) — `/why-helbrede`
| ID | Steps | Expected |
|----|-------|----------|
| WHY-01 | Load page | Comparison (old way vs new way) + value props render; CTAs work |

---

## 5. Responsiveness matrix

Run the **Section 3** checks (overflow + layout + console) for each cell. Mark ✅/❌.

| Page | 375 (mobile) | 768 (tablet) | 1280 (desktop) |
|------|:---:|:---:|:---:|
| Home `/` | | | |
| Products `/products` | | | |
| Product detail `/products/[id]` | | | |
| Cart `/cart` (empty + with items) | | | |
| Tools `/tools` | | | |
| Business starter `/business-starter` | | | |
| Franchise `/franchise` | | | |
| Why Helbrede `/why-helbrede` | | | |
| Login `/login` | | | |
| Register `/register` | | | |
| Dashboard `/dashboard` | | | |
| Admin overview `/admin` | | | |
| Admin products `/admin/products` | | | |
| Admin users `/admin/users` | | | |
| Admin orders `/admin/orders` | | | |

**Responsive-specific checks:**
- Header collapses to hamburger **below 1024px**; expands above.
- Multi-column grids (roles, categories, stats, forms) reflow to fewer columns on smaller screens.
- Buttons/chips wrap rather than overflow.
- Wide tables scroll inside their container (page does not scroll sideways).
- Tap targets are usable (not overlapping) on mobile.
- Text is readable (no clipped/cut headings).

---

## 6. Cross-cutting / non-functional (NFR)

| ID | Check |
|----|-------|
| NFR-01 | **No console errors** on any page (including hydration mismatches). |
| NFR-02 | **No 404s** in the network tab for app assets (favicon, logo images, JS/CSS). |
| NFR-03 | **Branding consistency:** blue palette (deep `#005ca9` + sky `#009fe3`), **Nunito Sans** font everywhere, real logo in header/footer, two-tone hero wordmark. No leftover gold/green theme. |
| NFR-04 | **Security / gating:** guests cannot see trade prices; non-admins cannot reach `/admin/*`; pending users are gated. |
| NFR-05 | **Performance:** homepage interactive within a few seconds; run one throttled ("Slow 4G") load. |
| NFR-06 | **Data integrity:** placing an order / registering / applying persists after refresh and appears in admin. |
| NFR-07 | **Deep links & refresh:** refreshing any route (incl. `/products/[id]`, `/admin/products`) loads correctly (no blank/500). |
| NFR-08 | **Back/forward** browser navigation works without stale state. |
| NFR-09 | **404 handling:** an unknown route (e.g. `/does-not-exist`) shows a proper not-found page, not a crash. |
| NFR-10 | **Accessibility basics:** images have alt text; buttons/links are keyboard-focusable; color contrast is reasonable. |

---

## 7. Bug report format

For each issue found, report:

```
[ID or area] — <short title>
Severity: Critical | High | Medium | Low
Page/URL: <route>
Viewport: mobile 375 | tablet 768 | desktop 1280 | all
Steps to reproduce:
  1. …
Expected: …
Actual: …
Evidence: <screenshot / console text / overflow-culprit output>
```

**Severity guide:** Critical = broken core flow (login, cart, checkout, page 500).
High = major feature broken or page overflow/clipping. Medium = visual/UX defect.
Low = cosmetic/polish.

---

## 8. Smoke test (fast pass — run first)

If time is limited, run this happy-path first; any failure here is Critical:

1. Home loads (desktop + mobile), no console errors, no horizontal overflow.
2. Catalog loads, search returns results.
3. Login as **Distributor** (demo chip) succeeds.
4. Open a product → price shows → **Add to Bulk Cart**.
5. Cart shows the item with correct totals → **Place Bulk Order** → confirmation.
6. Order appears in **/dashboard**.
7. Login as **Admin** → `/admin` loads → order is visible in `/admin/orders`.
8. Logout returns to guest state.

---

*Prepared for automated/AI-driven testing of the deployed Helbrede Healthcare application.*
