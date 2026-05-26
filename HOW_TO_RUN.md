# AXCP — How to Run

## Prerequisites

- Node.js 18+ (use nvm: `nvm use`)
- npm 9+

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env
# Edit .env if needed (defaults work for local dev)

# 3. Generate Prisma client + push schema + seed
npm run db:push
npm run db:seed

# 4. Start development servers (client + API concurrently)
npm run dev
```

The app opens at **http://localhost:5173**

## Login Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | ADMIN |
| cashier1 | cashier123 | CASHIER |
| manager1 | manager123 | MANAGER |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both client (Vite) + server (Express) | `npm run dev:client` | Vite dev server only |
| `npm run dev:server` | Express API only (with hot reload via tsx) |
| `npm run build` | Build both client + server |
| `npm run build:client` | TypeScript check + Vite production build |
| `npm run build:server` | TypeScript compile server |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run lint` | Run ESLint |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_PROVIDER` | `sqlite` | `sqlite` or `postgresql` |
| `DATABASE_URL` | `file:./prisma/dev.db` | Connection string |
| `JWT_SECRET` | *(required)* | JWT signing secret |
| `JWT_EXPIRES_IN` | `15m` | Access token expiry |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token expiry |
| `PORT` | `3001` | API server port |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |

## Switching to PostgreSQL

1. Edit `prisma/schema.prisma` — change `provider = "sqlite"` to `provider = "postgresql"`
2. Update `.env`:
   ```
   DATABASE_PROVIDER=postgresql
   DATABASE_URL=postgresql://user:password@localhost:5432/axcp
   ```
3. Run `npm run db:push && npm run db:seed`

## Production Build

```bash
npm run build
# Client output: dist/
# Server output: server/dist/
```

## Tauri Desktop (future)

```bash
npm run tauri:dev    # Dev mode with hot reload
npm run tauri:build  # Production .dmg/.exe/.AppImage
```

## Troubleshooting

**UNC path error on Windows:**
```bash
# Source nvm first:
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

**Prisma client not found:**
```bash
npx prisma generate
```

**Port already in use:**
```bash
# Kill existing dev server
tmux kill-session -t axcp
```
