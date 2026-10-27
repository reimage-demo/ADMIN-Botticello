# Botticello shop admin

Independent React + TypeScript admin for appointments, estimate requests, internal quotes, notes, and customer photos. Uses the production Convex backend shared with the public website.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Preview: http://127.0.0.1:5173. Build: `npm run build`. Deploy only `dist/` to static hosting. Set `VITE_CONVEX_URL=https://sincere-turtle-299.convex.cloud` at build time.

The backend lives in the public website repository's root `convex/` directory. This admin repository builds independently and does not import parent-directory files. Public registration is disabled and every administrative query and mutation checks active admin membership on the server.

Status changes and quotes are saved internally; they do not send email or SMS. Staff should contact customers directly. Password recovery is handled by the deployment administrator until an email provider is configured. Never commit credentials or deploy keys.

Sessions end 30 minutes after authentication and customer views clear at expiry. Every backend data access checks current session validity and admin membership. Five consecutive failed attempts lock the account for 30 minutes. Tokens are kept in sessionStorage, and the portal refuses non-HTTPS public origins. Localhost development pages are allowed; their Convex connections still use HTTPS.

Customer photos are fetched on demand through the authenticated `/admin-photo` endpoint with no-store responses, then displayed as browser blob URLs revoked when the component unmounts. New production hosting origins must be added to the backend ALLOWED_WEB_ORIGINS setting. No customer-data encryption key or password pepper belongs in this repository or in VITE-prefixed settings.
