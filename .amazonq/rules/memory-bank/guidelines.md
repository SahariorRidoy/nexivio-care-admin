# Development Guidelines

## Code Quality Standards

### File Structure
- Every page/component starts with `"use client";` directive
- Interfaces defined at top of file before component
- Constants (lookup maps, defaults) defined at module level, not inside components
- Sub-components defined in the same file when tightly coupled to a page (e.g. `DetailModal`, `OwnerCard` in vehicle-registrations page)

### Naming Conventions
- Components: PascalCase (`TeamPage`, `BookingReceipt`, `ConfirmModal`)
- Interfaces: PascalCase (`TeamMember`, `FormData`, `ReceiptBooking`)
- State variables: camelCase, descriptive (`saving`, `deleting`, `modalOpen`, `editing`)
- API response destructuring: always typed generics — `api.get<{ data: T[] }>()`
- Lookup maps: SCREAMING_SNAKE_CASE (`VEHICLE_LABELS`, `STATUS_OPTS`)
- CSS class variables: short lowercase (`inp`, `inputCls`, `labelCls`)

### TypeScript Patterns
- Always define explicit interfaces for API response shapes
- Use `unknown` for catch blocks: `catch (err: unknown)`
- Use `as const` for string literal arrays: `["pending", "approved"] as const`
- Derive types from const arrays: `type StatusFilter = (typeof STATUS_OPTS)[number]`
- Optional fields typed with `| null` (not `| undefined`) to match API responses
- Nullish coalescing `??` preferred over `||` for default values on nullable fields

## State Management Patterns

### Page-Level State (all pages follow this)
```tsx
const [data, setData] = useState<T[]>([]);
const [loading, setLoading] = useState(true);
const [modalOpen, setModalOpen] = useState(false);
const [editing, setEditing] = useState<T | null>(null);
const [saving, setSaving] = useState(false);
const [error, setError] = useState("");
const [deleteId, setDeleteId] = useState<string | null>(null);
const [deleting, setDeleting] = useState(false);
```

### Data Fetching
- Always in `useEffect` on mount, never in event handlers
- Use `Promise.all` when fetching multiple endpoints simultaneously
- Always `.catch(() => {})` silently on non-critical fetches
- Always `.finally(() => setLoading(false))`

```tsx
useEffect(() => {
  api.get<{ data: T[] }>("/endpoint")
    .then((res) => setData(res.data))
    .catch(() => {})
    .finally(() => setLoading(false));
}, []);
```

### Optimistic Updates
- Update local state immediately after successful API call, don't refetch
- For edits: `setData((prev) => prev.map((item) => item.id === id ? updated : item))`
- For deletes: `setData((prev) => prev.filter((item) => item.id !== deleteId))`
- For adds: `setData((prev) => [...prev, newItem])`

### Form State
- Use local `useState` with a typed `FormData` interface (not react-hook-form)
- Define an `empty` constant for the reset state
- Use a single `set` helper: `const set = (k: keyof FormData, v: unknown) => setForm((f) => ({ ...f, [k]: v }))`
- Validate manually before submit, set `error` string on failure

## API Usage

### api client methods
```tsx
api.get<{ data: T[] }>("/endpoint")
api.get<{ data: T[] }>("/endpoint", { page: 1, search: "q" })  // with query params
api.post<{ data: T }>("/endpoint", body)
api.patch<{ data: T }>("/endpoint/id", body)
api.delete("/endpoint/id")
api.upload<{ data: T }>("/endpoint", formData)
```

### Response shape convention
All API responses wrap data: `{ data: T }` or `{ data: T[] }`

### Error handling
```tsx
try {
  const res = await api.patch<{ data: T }>(`/endpoint/${id}`, body);
  // update state
  toast.success("...");
} catch (err: unknown) {
  setError(err instanceof Error ? err.message : "সংরক্ষণ ব্যর্থ হয়েছে");
} finally {
  setSaving(false);
}
```

## UI Patterns

### Tailwind Class Conventions
- Rounded corners: `rounded-lg` (inputs/buttons), `rounded-xl` (cards/modals), `rounded-2xl` (large cards)
- Borders: `border border-slate-100` (cards), `border border-slate-200` (inputs)
- Text hierarchy: `text-slate-800` (headings), `text-slate-500` (subtitles), `text-slate-400` (hints)
- Primary color: `primary-600` / `primary-700` / `primary-800` for buttons and accents
- Sidebar background: `navy-950` / `navy-800`
- Status badges: `bg-green-100 text-green-700`, `bg-amber-100 text-amber-700`, `bg-red-100 text-red-700`

### Input class (reuse this pattern)
```tsx
const inp = "h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20";
```

### Label class (reuse this pattern)
```tsx
const labelCls = "text-[11px] text-slate-400 uppercase tracking-wide mb-0.5 block";
```

### Loading state
```tsx
<div className="flex items-center justify-center py-16">
  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
</div>
```

### Empty state
```tsx
<div className="text-center py-16 text-slate-400 text-sm">কোনো ডেটা নেই।</div>
```

### Modal pattern
- Use `<Modal>` component for add/edit forms
- Use `<ConfirmModal>` for delete confirmations
- Custom modals: `fixed inset-0 z-50 flex items-center justify-center p-4` with `bg-black/50 backdrop-blur-sm` overlay
- Close on backdrop click and Escape key

### Buttons
- Primary action: `bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors`
- Destructive: `border border-red-100 hover:bg-red-50 text-red-500`
- Disabled state: always add `disabled={saving}` and `disabled:opacity-50`

### Toast notifications (Bengali messages)
```tsx
toast.success("সফলভাবে সংরক্ষিত হয়েছে!");
toast.error("সংরক্ষণ ব্যর্থ হয়েছে");
```

## Component Patterns

### Field wrapper component (inline in pages)
```tsx
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
```

### Status badge
```tsx
<span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusClass[item.status] ?? "bg-slate-100 text-slate-600"}`}>
  {item.status}
</span>
```

### Image rendering (use `<img>` not `<Image>` with eslint-disable)
```tsx
{/* eslint-disable-next-line @next/next/no-img-element */}
<img src={assetUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
```

### Checkbox toggle
```tsx
<label className="flex items-center gap-2 cursor-pointer">
  <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="h-4 w-4 accent-primary-600" />
  <span className="text-sm text-slate-700">সক্রিয়</span>
</label>
```

## Utility Functions (from src/lib/utils.ts)
- `cn(...classes)` — merge Tailwind classes conditionally
- `formatDate(iso)` — Bengali date format (bn-BD, Asia/Dhaka)
- `formatTime(time)` — 12-hour AM/PM format
- `formatDateTime(iso)` — Bengali date + time
- `assetUrl(path)` — resolves relative paths against API base URL, passes through full URLs
- `downloadFile(url, filename)` — blob download with fallback to window.open

## Navigation Structure
Sidebar nav is grouped into sections defined in a `navGroups` array constant. Active state uses `pathname.startsWith(href)` (except dashboard root which uses exact match). Use `cn()` for conditional active classes.

## Auth Pattern
- Wrap app in `<AuthProvider>` at root layout
- Access auth via `useAuth()` hook: `const { user, login, logout, loading } = useAuth()`
- Tokens stored in localStorage, auto-refreshed on 401 by api client
- On logout: clear tokens + redirect to `/login`
