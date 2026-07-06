# RWF Miner — Backend API

NestJS REST API for the RWF Miner cloud mining and digital asset management platform.

**Live API:** https://rwf-miner.onrender.com/api  
**API Docs (Swagger):** https://rwf-miner.onrender.com/docs  
**Frontend:** https://www.rwfminerpro.com

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 10 (Node.js) |
| Language | TypeScript |
| Database | PostgreSQL via Neon (serverless) |
| ORM | Prisma 5 |
| Auth | JWT (access + refresh tokens) |
| Email | Brevo API |
| Error Tracking | Sentry |
| Hosting | Render (free tier) |

---

## Features

- **Authentication** — register, email OTP verification, login lockout (5 attempts → 15 min), refresh tokens, password reset, PIN setup/reset
- **Mining** — daily earnings calculation, rates configurable by admin
- **Deposits** — user submits TRC-20 txHash, admin confirms/rejects, referral commissions on first deposit only
- **Withdrawals** — atomic balance check via Prisma `$transaction` (prevents race conditions), PIN required
- **Referral System** — L1 (10%) and L2 (3%) commissions on first confirmed deposit only
- **Admin Panel** — full user management (create, edit, suspend, delete, set password, credit balance), deposit/withdrawal approval, platform config
- **Maintenance Mode** — admin toggle that blocks all users; admins bypass via JWT role claim
- **Audit Logs** — tracks login attempts, password changes, PIN changes, withdrawals with IP address
- **Rate Limiting** — global throttle, tighter limits on auth endpoints
- **Security** — helmet, CORS whitelist, login lockout, PIN lockout, bcryptjs hashing

---

## Project Structure

```
src/
├── admin/          # Admin-only endpoints (users, deposits, withdrawals, config, logs)
├── audit/          # AuditService — activity logging
├── auth/           # Registration, login, JWT, PIN management
├── common/         # Guards, filters, interceptors, middleware
├── dashboard/      # User dashboard stats
├── deposits/       # User deposit submissions
├── health/         # Health check endpoint
├── mail/           # Brevo email service
├── mining/         # Mining earnings and rates
├── notifications/  # In-app notifications
├── prisma/         # PrismaService
├── support/        # Public support links endpoint
├── transactions/   # Transaction history
├── users/          # User profile
└── withdrawals/    # Withdrawal requests
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Neon PostgreSQL database
- Brevo account (for emails)

### Install & Run

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### Environment Variables

Create a `.env` file (never commit this):

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-strong-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
BREVO_API_KEY=your-brevo-key
FRONTEND_URL=http://localhost:5173,https://www.rwfminerpro.com
SENTRY_DSN=https://...@sentry.io/...
CRON_SECRET=your-cron-secret
```

---

## Deployment (Render)

**Build Command:**
```
npm install && npx prisma generate && npx prisma db push && npm run build
```

**Start Command:**
```
npm run start:render
```

`start:render` runs `npx prisma db push && node dist/src/main` — syncs schema on every deploy then starts the server.

> Render free tier sleeps after 15 min of inactivity. Use cron-job.org to ping `/api/health` every 10 minutes to keep it awake.

---

## API Overview

| Module | Base Path | Auth |
|---|---|---|
| Auth | `/api/auth` | Public |
| Health | `/api/health` | Public |
| Support | `/api/support` | Public |
| Dashboard | `/api/dashboard` | User |
| Deposits | `/api/deposits` | User |
| Withdrawals | `/api/withdrawals` | User |
| Mining | `/api/mining` | User |
| Transactions | `/api/transactions` | User |
| Notifications | `/api/notifications` | User |
| Admin | `/api/admin/*` | Admin only |

Full interactive documentation at `/docs` (Swagger UI).

---

## Security Notes

- Passwords hashed with `bcryptjs` (rounds: 12)
- JWTs include `role` claim — middleware identifies admins without a DB query
- Withdrawal balance check inside a Prisma `$transaction` to prevent double-spending
- Login locked 15 min after 5 failed attempts (in-memory)
- PIN locked 30 min after 3 failed attempts (in-memory)
- All admin routes protected by `JwtAuthGuard` + `RolesGuard`
- Suspended users have all refresh tokens revoked immediately
