# Botticello shop admin

Independent React + TypeScript admin for appointments, estimate requests, internal quotes and notes, and vehicle listings with photo uploads. Uses the production Convex backend shared with the public website.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Preview: http://127.0.0.1:5173. Build: `npm run build`. Deploy only `dist/` to static hosting. Set `VITE_CONVEX_URL=https://sincere-turtle-299.convex.cloud` at build time.

The backend lives in the public website repository's root `convex/` directory. This admin repository builds independently and does not import parent-directory files. Public registration is disabled and every administrative query and mutation checks active admin membership on the server.

Status changes and quotes are saved internally; they do not send email or SMS. Staff should contact customers directly. Password recovery is handled by the deployment administrator until an email provider is configured. Never commit credentials or deploy keys.
