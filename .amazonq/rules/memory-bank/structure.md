# Project Structure

## Root Layout
```
Nexivio Care Admin/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # Reusable UI & layout components
│   ├── context/          # React context providers
│   └── lib/              # Utilities, API client, types
├── public/               # Static assets (logo.jpeg)
├── .env.local            # Environment variables
└── .amazonq/rules/       # Amazon Q rules & memory bank
```

## src/app — Pages (App Router)
```
app/
├── layout.tsx            # Root layout (AuthProvider, Toaster)
├── page.tsx              # Root redirect → /dashboard
├── globals.css           # Global Tailwind styles
├── login/page.tsx        # Login page
└── dashboard/
    ├── layout.tsx        # Dashboard shell (Sidebar + TopBar)
    ├── page.tsx          # Dashboard home (stats overview)
    ├── applications/     # Job/service applications
    ├── banners/          # Homepage banners
    ├── bookings/         # Service bookings
    ├── contacts/         # Contact form submissions
    ├── enrollments/      # Training enrollments
    ├── gallery/          # Image/video gallery
    ├── notices/          # Notices/announcements
    ├── other-services/   # Additional services
    ├── reviews/          # User reviews
    ├── services/         # Core services
    ├── settings/         # Platform settings
    ├── sms/              # SMS management
    ├── staff/            # Staff management
    ├── team/             # Team member profiles
    ├── training/         # Training programs
    ├── transport-bookings/
    └── vehicle-registrations/
```

## src/components
```
components/
├── layout/
│   ├── Sidebar.tsx       # Navigation sidebar with links
│   └── TopBar.tsx        # Top navigation bar
└── ui/
    ├── AdminTable.tsx    # Reusable data table
    ├── BookingDetailModal.tsx
    ├── BookingReceipt.tsx  # PDF receipt generator
    ├── ConfirmModal.tsx  # Delete/action confirmation dialog
    ├── ImageUpload.tsx   # Cloudinary image upload
    ├── Modal.tsx         # Generic modal wrapper
    ├── NewBookingModal.tsx
    ├── StatCard.tsx      # Dashboard stat display card
    └── VideoUpload.tsx   # Video upload component
```

## src/lib
- `api.ts` — Typed fetch wrapper with JWT auth, auto token refresh, request queue
- `auth.ts` — Token storage/retrieval (localStorage)
- `utils.ts` — `cn()`, `formatDate()`, `formatTime()`, `formatDateTime()`, `assetUrl()`, `downloadFile()`
- `booking.types.ts` — Shared TypeScript types for bookings

## src/context
- `AuthContext.tsx` — Auth state, login/logout, user info, route protection

## Architectural Patterns
- **App Router** with `"use client"` pages (all dashboard pages are client components)
- **Per-page data fetching** — each page fetches its own data via `api.*` on mount
- **Local state management** — useState for list data, modal state, form state
- **No global state library** — only AuthContext via React Context
- **Inline form state** — forms managed with local useState, not react-hook-form (despite it being installed)
