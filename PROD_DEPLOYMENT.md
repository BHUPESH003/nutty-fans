## Production deployment guide (Next.js + WebSocket + workers)

This repo runs **two processes** in production:

- **Next.js app** (HTTP): renders UI + API routes
- **Realtime server + background workers** (Socket.IO + BullMQ): `src/server/index.ts` (WebSocket on `WS_PORT`, queues on Redis, DB access via Prisma)

It also requires:

- **PostgreSQL** (Neon or any Postgres)
- **Redis** (for BullMQ + Socket.IO adapter + presence/unread caches)
- **S3 + CloudFront** (media uploads/playback)

---

## Required environment variables

### Core

- **`DATABASE_URL`**: pooled Postgres URL used at runtime
- **`REDIS_URL`**: Redis connection string
- **`NEXTAUTH_SECRET`**: NextAuth signing secret
- **`NEXTAUTH_URL`**: canonical app URL (e.g. `https://app.example.com`)
- **`NEXT_PUBLIC_APP_URL`**: public app URL (same as `NEXTAUTH_URL` in most deployments)
- **`NEXT_PUBLIC_WS_URL`**: public WebSocket URL (e.g. `https://ws.example.com` or `http://<host>:3001`)
- **`WS_PORT`**: port for Socket.IO server (default is `3001` if unset in code)

### Media

- **`AWS_ACCESS_KEY_ID`**
- **`AWS_SECRET_ACCESS_KEY`**
- **`AWS_REGION`**
- **`AWS_S3_BUCKET`**
- **`CLOUDFRONT_URL`**

### Optional (only if you use these integrations)

- Google / Apple OAuth vars
- Push / VAPID vars
- Any payment provider vars you’ve enabled

---

## Database migrations (production)

Run these once per deploy (or as part of CI/CD):

```bash
pnpm install
pnpm db:generate
pnpm db:migrate:deploy
```

Notes:

- `db:migrate:deploy` is safe for production pipelines.
- If you use Neon, prefer pooled `DATABASE_URL` for runtime.

---

## Option A (recommended): single VM/container running both processes

Use this when you want a straightforward deployment and don’t need serverless hosting.

### Build

```bash
pnpm install --frozen-lockfile
pnpm db:generate
pnpm db:migrate:deploy
pnpm build
```

### Run

In two separate long-running processes (systemd/pm2/supervisor/docker compose):

```bash
# 1) Next.js HTTP server
pnpm start
```

```bash
# 2) WebSocket server + workers
pnpm ws:server
```

Health checks:

- App should respond on `NEXTAUTH_URL`
- WS should accept connections on `NEXT_PUBLIC_WS_URL` and `WS_PORT`

Reverse proxy (nginx/traefik) tips:

- Proxy WebSocket upgrades to the WS process (`Upgrade`/`Connection` headers)
- Ensure the WS origin is allowed (see `src/server/websocket.ts` CORS origin function)

---

## Option B: split hosting (Next.js on Vercel, WS/workers on a VM)

Use this if you need Vercel for the web app but still require long-lived sockets/workers.

### Next.js app (Vercel)

- Deploy the Next.js app normally.
- Set:
  - `NEXTAUTH_URL=https://app.example.com`
  - `NEXT_PUBLIC_APP_URL=https://app.example.com`
  - `NEXT_PUBLIC_WS_URL=https://ws.example.com`

### WS/workers (VM/container)

- Deploy the same repo (or a thin service copy) and run:
  - `pnpm ws:server`
- Set:
  - `WS_PORT=3001` (or your chosen port)
  - `NEXTAUTH_SECRET` **must match** the Vercel app’s secret (so JWT cookies validate)
  - `NEXTAUTH_URL=https://app.example.com` (used for CORS allowlist)

Reverse proxy:

- Put `ws.example.com` in front of the WS process and terminate TLS there.
- Forward WebSocket upgrade headers.

---

## Common production pitfalls

- **Unauthorized WS connections**:
  - `NEXTAUTH_SECRET` must match between the app and WS service
  - `NEXT_PUBLIC_WS_URL` must be on the same “site” you expect cookies to be sent from
  - If you run cross-subdomain, ensure cookie/domain settings match your auth strategy

- **Redis eviction warning**:
  - The WS/workers expect Redis `maxmemory-policy` to be `noeviction` for reliability.

- **Multiple lockfiles warning (Next.js)**:
  - Ensure your build system uses the repo root as the workspace root.
  - Prefer keeping only one lockfile for the deploy context.
