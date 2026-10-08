# Client and admin panels

Client and admin UI extracted from the supplied archive and rebranded to PunjabShip. Landing page and franchise portal are excluded. Franchise routes are removed from admin navigation. Existing project files in the parent folder remain intact.

Double-click `start-panels.cmd` to start the local apps. Node.js is required. The first admin compilation may take a few minutes.

| Panel | URL | Email | Password |
| --- | --- | --- | --- |
| Client | http://127.0.0.1:5174 | client@punjabshiplogistics.com | Demo@123 |
| Admin | http://127.0.0.1:3001 | admin@punjabshiplogistics.com | Demo@123 |

Client: select **Email + password**, enter the credentials, and check the form checkbox. Email OTP is also available locally with code `123456`; no email is sent.

This is a lightweight JSON-backed deployment, not a database-backed production API. Profile settings, wallets, manual couriers, postal-code coverage, zones, B2C/B2B rate cards, manual shipment bookings and tracking updates are saved to `local-data.json`. A default **PunjabShip Manual** courier, India domestic zones, and country-wide Canada, United States and Europe zones with starter B2C/B2B rates are seeded automatically, so they remain available after a fresh deployment. ShipGlobal Vendor API booking, tracking and cancel/refund routes are available when `SHIPGLOBAL_USERNAME` and `SHIPGLOBAL_PASSWORD` are configured on the backend; credentials are never exposed to either frontend. Realtime connections are disabled, and a production database plus ShipGlobal webhook/polling policy are still recommended before processing customer shipments at scale.

Serviceability includes 417,425 individual Canada, United States and Europe postal-code records generated from the GeoNames postal-code export, in addition to the India Post records. The API filters and paginates this data server-side; regeneration instructions and attribution are in `data/README.md`.

Brand details match the PunjabShip landing page: info@punjabshiplogistics.com, +91 84878 81121, SODHI ONLINE SERVICES, Near Verka Plant, Barnala Raikot Road, Mahal Kalan, Barnala, Punjab 148104. Login email addresses above are local demo identifiers; no live mailbox is created.

Source folders: `punjabship-panels/courier-cart-client` and `punjabship-panels/admin-dashboard`. The demo API is `local-api.mjs`, bound to loopback port 5004.

To reinstall dependencies, run `npm.cmd install --legacy-peer-deps` in each source folder. Local configuration is in each app's `.env.local`. Client build: `npm.cmd run build`. Admin build: `npm.cmd run build`.
