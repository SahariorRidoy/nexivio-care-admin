# Technology Stack

## Core
- **Next.js** 15.x (App Router)
- **React** 19.x
- **TypeScript** 5.8.x

## Styling
- **Tailwind CSS** 4.x — utility-first, configured via `postcss.config.mjs`
- **clsx** + **tailwind-merge** — conditional class merging via `cn()` utility
- Custom color: `primary-*` (e.g. `primary-600`, `primary-700`, `primary-800`)

## UI & Icons
- **lucide-react** — icon library (Pencil, Trash2, Plus, etc.)
- **react-hot-toast** — toast notifications

## Forms & Validation
- **react-hook-form** + **zod** + **@hookform/resolvers** — installed but pages mostly use local useState for forms

## HTTP / API
- Custom `api` client in `src/lib/api.ts` — wraps native `fetch`
- JWT Bearer token auth with automatic refresh on 401
- Refresh queue to prevent concurrent refresh races
- Methods: `api.get`, `api.post`, `api.patch`, `api.delete`, `api.upload`

## Media
- **Cloudinary** — image hosting (`res.cloudinary.com` whitelisted in next.config.ts)
- **html2canvas** + **jspdf** — PDF receipt generation

## Auth
- Tokens stored in localStorage via `src/lib/auth.ts`
- AuthContext provides `user`, `login()`, `logout()`, `loading`
- Protected routes redirect to `/login` on 401 or missing token

## Environment Variables
- `NEXT_PUBLIC_API_URL` — backend API base URL (default: `http://localhost:5000/api/v1`)

## Dev Commands
```bash
npm run dev        # Start dev server on port 3001
npm run build      # Production build
npm run start      # Start production server on port 3001
npm run lint       # ESLint
npm run type-check # tsc --noEmit
```

## Deployment
- **Vercel** (`.vercel/project.json` present)
