# CampusLost+Found

CampusLost+Found is a Next.js App Router experience for reporting, browsing, and reclaiming lost items around campus. It uses Firebase Authentication (client SDK only) and MongoDB-backed API routes, wrapped in a theme-aware UI with light/dark modes.

## Tech Stack
- **Framework:** Next.js 16 (App Router) with React 19
- **Styling:** Tailwind CSS, custom gradients, `next-themes`
- **Auth:** Firebase Authentication (email/password + Google via client SDK)
- **Data:** MongoDB via official driver (used only inside `app/api`)
- **Utilities:** TypeScript, ESLint, React Hot Toast

## Features
- Email/password signup and login with Firebase client SDK (no Firebase Admin)
- Cookie-based session handling in the frontend
- Items API at `/api/items` backed by MongoDB
- Landing page with hero, recent lost/found highlights, safety notice, and CTA
- Items list, item detail page, and protected report form
- Light/dark theme toggle with layered gradients and accessible contrast

## Getting Started
Install dependencies:
```bash
pnpm install
```

Run the dev server:
```bash
pnpm dev
```
Open http://localhost:3000.

## Environment Variables
Create `.env.local` with:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
MONGODB_URI=...
```

## Project Structure
- `app/` — App Router pages, layouts, and API routes (`app/api/items`)
- `components/` — UI components (Navbar, ItemCard, RecentLostItems, etc.)
- `lib/` — Client utilities (`firebase`, `apiClient`) and server-only Mongo connector for API routes
- `types/` — Shared TypeScript types

## Scripts
- `pnpm dev` — Start dev server
- `pnpm build` — Production build
- `pnpm start` — Run production server
- `pnpm lint` — Lint source

## Notes
- Firebase Admin is intentionally not used; all auth is client-side.
- MongoDB access is confined to `app/api/**` to keep React components free of server-only code.
- Remote item images are allowed via `next.config.ts`.
