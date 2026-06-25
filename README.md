# Water Meter Billing System

A production-ready water meter billing application for apartment buildings. The system manages apartments, reading cycles, offline field readings, billing calculations, rounding balances, and printable PDF reports.

The interface is Arabic-first and RTL, while the codebase, setup instructions, and deployment documentation are written for maintainability.

## Features

- Apartment management with add, edit, activate, and deactivate flows.
- Reading cycles created by reading date only.
- Offline-capable field reader designed for mobile PWA usage.
- Automatic sync of field readings when the device is online.
- Cycle approval from the mobile field reader.
- Billing calculation for all apartments after approval.
- Full generator cost coverage, including rounding distribution.
- Per-apartment carried rounding balance.
- Editable readings and cycle cost even after a cycle is finalized.
- Arabic RTL PDF reports with cycle number, date, billing summary, and full table.
- Turso/libSQL database support for cloud-hosted usage.
- Vercel-ready Next.js deployment.

## Tech Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Turso / libSQL
- Dexie for offline browser storage
- Puppeteer Core for PDF generation
- PWA service worker
- Docker support

## Getting Started

Install dependencies:

```bash
npm install
```

Create the local environment file:

```bash
cp .env.example .env.local
```

Update `.env.local` with your Turso credentials:

```env
TURSO_DATABASE_URL="libsql://your-database.turso.io"
TURSO_AUTH_TOKEN="your_turso_auth_token"
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Database Migration

If you have an existing local SQLite database, migrate it to Turso:

```bash
npm run db:migrate:turso
```

The migration script creates the schema, clears the target database, and imports apartments, cycles, readings, and payments from `database.sqlite`.

## Workflow

1. Create a new billing cycle with the reading date.
2. Open the field reader on mobile.
3. Enter readings offline or online.
4. Sync readings when online.
5. Approve the cycle from the field reader.
6. The system recalculates billing for every apartment.
7. Download the PDF report.
8. Edit cycle data or readings later if a correction is needed.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm test
npm run db:migrate:turso
```

## Deployment

The app is ready for Vercel deployment. Add the following environment variables in the Vercel project settings:

```env
TURSO_DATABASE_URL
TURSO_AUTH_TOKEN
```

PDF generation uses a serverless-compatible Chromium fallback through `@sparticuz/chromium`.

## PWA Notes

The field reader can be installed on a mobile device as a PWA. The service worker uses a network-first strategy for pages to avoid stale builds, while still preserving offline fallback behavior for field usage.

## Security

Do not commit `.env.local`, database files, logs, backups, or temporary artifacts. The repository `.gitignore` is configured to exclude these files.

## License

Private operational project. Add a license before distributing for public reuse.
