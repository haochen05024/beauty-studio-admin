

Admin v83 fix: restored Services renderer/editor and made D1 content loading resilient to a single endpoint failure. Service Worker cache bumped to v83.
# Beauty Studio Admin v74

Complete GitHub Pages admin package.

Includes:
- Overview dashboard
- Studio Content
- Services with English / Chinese / Myanmar fields
- Gallery with English / Chinese / Myanmar fields
- Media
- Bookings
- Messages / Need Help inbox
- Customer center and conversation history
- Booking Rules
- PWA assets
- Service Worker cache v74

Deployment:
1. Upload/replace the entire contents of this package in the `beauty-studio-admin` GitHub repository.
2. Do not upload the ZIP itself into the repository.
3. Wait for GitHub Pages to deploy, then hard refresh the site.
4. Keep `ADMIN_TOKEN` out of frontend files; it remains entered at runtime and is sent to the Worker.


## v78 fixed
- Fixed the startup bootstrap so the Admin connection dialog is actually opened.
- Bumped the service-worker cache to v78 to prevent the previous blank-screen build from remaining cached.


## v83 service/D1 fix
- Restored the missing Services renderer/editor that caused the Services view to fail and made loadRemote report D1 unavailable after that exception.
- Remote content requests are now independent so one endpoint failure cannot blank the other Admin sections.
- Bumped service-worker cache to v83.


## v83 service translation editor
- Service editor now lets you choose one original language and auto-generate the other two languages.
- Existing translations are preserved; only empty target fields are filled.
- Added a lightweight public translation endpoint for the editor; manual edits remain supported.
- Bumped the service-worker cache to v83.


## v84 — Admin interface language switcher
- Added English / 中文 / မြန်မာ selector in the Admin top bar.
- Language preference persists in localStorage.
- Translates the Admin interface labels without changing D1 content data.
- Customer site, Worker, D1 schema, and Admin token are unchanged.


## v85
Added D1-backed customer contact link fields for Map, Availability, Call, TikTok, WhatsApp and Telegram.
