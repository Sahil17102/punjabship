# Client and admin panels

Client and admin UI extracted from the supplied archive and rebranded to PunjabShip. Landing page and franchise portal are excluded. Franchise routes are removed from admin navigation. Existing project files in the parent folder remain intact.

Double-click `start-panels.cmd` to start the local apps. Node.js is required. The first admin compilation may take a few minutes.

| Panel | URL | Email | Password |
| --- | --- | --- | --- |
| Client | http://127.0.0.1:5174 | client@punjabshiplogistics.com | Demo@123 |
| Admin | http://127.0.0.1:3001 | admin@punjabshiplogistics.com | Demo@123 |

Client: select **Email + password**, enter the credentials, and check the form checkbox. Email OTP is also available locally with code `123456`; no email is sent.

This is a local UI clone with sample dashboard/orders data, not a production backend. Profile, dashboard preferences, invoice issuer details and About Us content can be saved to `local-data.json`. Live shipping, payment, courier integrations, real authentication, and other server mutations require a real backend; unsupported mutations return a clear preview-mode error. Realtime connections are disabled. No original live API is used by the local API clients.

Brand details match the PunjabShip landing page: info@punjabshiplogistics.com, +91 84878 81121, SODHI ONLINE SERVICES, Near Verka Plant, Barnala Raikot Road, Mahal Kalan, Barnala, Punjab 148104. Login email addresses above are local demo identifiers; no live mailbox is created.

Source folders: `punjabship-panels/courier-cart-client` and `punjabship-panels/admin-dashboard`. The demo API is `local-api.mjs`, bound to loopback port 5004.

To reinstall dependencies, run `npm.cmd install --legacy-peer-deps` in each source folder. Local configuration is in each app's `.env.local`. Client build: `npm.cmd run build`. Admin build: `npm.cmd run build`.
