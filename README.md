# Laba: daily sales app for an egg business (Spring Boot + PostgreSQL + offline-ready UI)

## Run
1. Create the database:  `createdb salesdb`  (edit user/password in src/main/resources/application.yml)
2. `mvn spring-boot:run`   (Flyway creates the tables)
3. Open http://localhost:8080  (on a phone: open it, then "Add to Home screen")

## Offline
- Press the Online/Offline button in the top bar, or just lose connection.
- Sales, payments and expenses are saved on the device and sent when you press Sync (it also runs automatically when the connection returns).
- Every entry has a client id, so sending twice never duplicates it.
- Adding products/customers needs a connection (add them before going offline).
- Note: the service worker needs HTTPS or localhost to work on a phone.

## Egg shop features
- Tray of 30 eggs (changeable per egg type); sell by tray or single egg, price editable per customer (wholesale vs retail).
- Buy from farm/supplier by tray: stock goes up and cost per egg is recalculated (weighted average), so profit follows price changes.
- Broken, spoiled or given-away eggs reduce stock and are counted as an expense at cost.
- Payments by Cash, Telebirr, CBE Birr or Bank. Customers: kiosk, restaurant/hotel, bakery, household; days owing shown.
- Amharic switch and Ethiopian date in the top bar.

## Code structure (com.shop.sales)
- `model`: JPA entities and enums (Product, Customer, Sale, SaleItem, Payment, Expense, Purchase)
- `dto`: request and response records, with validation
- `repository`: Spring Data repositories, plus ReportRepository for report SQL
- `service`: business rules (SaleService, PaymentService, PurchaseService, StockService, ReportService ...)
- `controller`: thin REST controllers under /api
- `exception`: ApiException and one global error handler (returns {"message": "..."})

## New UI (frontend/ folder, React + Vite)
- Run the backend first (`mvn spring-boot:run`), then:
- **Development:** `cd frontend && npm install && npm run dev`  -> http://localhost:5173 (calls the API on 8080)
- **Production:** `cd frontend && npm run build` writes the UI into `src/main/resources/static`; Spring Boot serves it at http://localhost:8080
- A built copy is already in `src/main/resources/static`.

## UI polish (v4)
- Light/dark theme button, glass top bar, mobile bottom navigation with a slide-up cart sheet.
- Sell: stock bars, filters, "+1 egg" quick add, thank-you receipt with Share and SMS.
- Customers: call and SMS reminder buttons. Today: greeting and quick actions.
