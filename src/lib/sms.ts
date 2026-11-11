// Shared SMS helpers & types for the admin SMS module.

export interface SmsLog {
  id: string;
  to: string;
  recipientName: string | null;
  message: string;
  status: "sent" | "failed" | string;
  response: string | null;
  segments: number;
  type: "single" | "bulk" | "campaign" | string;
  campaignId: string | null;
  campaign?: { id: string; name: string } | null;
  sentBy: string | null;
  createdAt: string;
}

export interface SmsCampaign {
  id: string;
  name: string;
  message: string;
  audience: { filters?: AudienceFilter[]; from?: string; to?: string; manual?: number };
  total: number;
  sent: number;
  failed: number;
  segments: number;
  status: "processing" | "completed" | "partial" | "failed" | string;
  createdBy: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface SmsTemplate {
  id: string;
  name: string;
  category: string;
  body: string;
}

export interface Meta { total: number; page: number; limit: number; totalPages: number }

export type AudienceSource =
  | "bookings" | "transport" | "training" | "applicants" | "vehicleOwners" | "contacts" | "invoices" | "receipts";

export interface AudienceFilter {
  source: AudienceSource;
  status?: string[];
  paymentStatus?: string[];
  serviceType?: string;
  trainingId?: string;
}

export interface SourceDef {
  key: AudienceSource;
  label: string;
  hint: string;
  status?: { value: string; label: string }[];
  payment?: boolean;
  serviceType?: boolean;
  training?: boolean;
}

const BOOKING_STATUS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in-progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];
const REVIEW_STATUS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export const SOURCES: SourceDef[] = [
  { key: "bookings", label: "সেবা গ্রহীতা (Booking)", hint: "কেয়ারগিভার/নার্সিং বুকিং গ্রাহক", status: BOOKING_STATUS, payment: true, serviceType: true },
  { key: "transport", label: "ট্রান্সপোর্ট যাত্রী", hint: "অ্যাম্বুলেন্স ও গাড়ি বুকিং", status: BOOKING_STATUS, payment: true },
  { key: "invoices", label: "ইনভয়েস ক্লায়েন্ট", hint: "বকেয়া রিমাইন্ডারের জন্য উপযোগী", payment: true },
  { key: "receipts", label: "রিসিপ্ট ক্লায়েন্ট", hint: "মানি রিসিপ্ট গ্রাহক", payment: true },
  { key: "training", label: "ট্রেনিং শিক্ষার্থী", hint: "কোর্সে ভর্তি আবেদনকারী", status: [{ value: "pending", label: "Pending" }, { value: "confirmed", label: "Confirmed" }, { value: "cancelled", label: "Cancelled" }], training: true },
  { key: "applicants", label: "চাকরি প্রার্থী", hint: "কেয়ারগিভার নিয়োগ আবেদন", status: [{ value: "pending", label: "Pending" }, { value: "reviewed", label: "Reviewed" }, { value: "shortlisted", label: "Shortlisted" }, { value: "hired", label: "Hired" }, { value: "rejected", label: "Rejected" }] },
  { key: "vehicleOwners", label: "গাড়ির মালিক", hint: "নিবন্ধিত ভেহিকেল পার্টনার", status: REVIEW_STATUS },
  { key: "contacts", label: "যোগাযোগকারী", hint: "ওয়েবসাইট কন্টাক্ট ফর্ম" },
];

export const PAYMENT_STATUS = [
  { value: "unpaid", label: "Unpaid" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid" },
];

export const sourceLabel = (k: string) => SOURCES.find((s) => s.key === k)?.label ?? k;

export const TEMPLATE_CATEGORIES = [
  { value: "general", label: "সাধারণ" },
  { value: "booking", label: "বুকিং" },
  { value: "payment", label: "পেমেন্ট" },
  { value: "promo", label: "অফার / প্রমো" },
  { value: "training", label: "ট্রেনিং" },
  { value: "transport", label: "ট্রান্সপোর্ট" },
  { value: "recruitment", label: "নিয়োগ" },
];

/** Built-in starter templates (can be saved into the library). */
export const STARTER_TEMPLATES: Omit<SmsTemplate, "id">[] = [
  { name: "বুকিং কনফার্মেশন", category: "booking", body: "প্রিয় {name}, আপনার বুকিং নিশ্চিত হয়েছে। শীঘ্রই আমাদের প্রতিনিধি যোগাযোগ করবেন। ধন্যবাদ - Nexivio Care" },
  { name: "পেমেন্ট রিমাইন্ডার", category: "payment", body: "প্রিয় {name}, আপনার বকেয়া পেমেন্ট পরিশোধের অনুরোধ রইল। বিস্তারিত জানতে কল করুন। - Nexivio Care" },
  { name: "পেমেন্ট প্রাপ্তি", category: "payment", body: "প্রিয় {name}, আপনার পেমেন্ট সফলভাবে গৃহীত হয়েছে। Nexivio Care-এর সাথে থাকার জন্য ধন্যবাদ।" },
  { name: "ঈদ শুভেচ্ছা", category: "promo", body: "প্রিয় {name}, Nexivio Care পরিবারের পক্ষ থেকে আপনাকে ঈদের আন্তরিক শুভেচ্ছা। ঈদ মোবারক!" },
  { name: "ট্রেনিং ক্লাস শুরু", category: "training", body: "প্রিয় {name}, আপনার ট্রেনিং কোর্সের ক্লাস শীঘ্রই শুরু হচ্ছে। সময়সূচির জন্য যোগাযোগ করুন। - Nexivio Care" },
  { name: "ইন্টারভিউ আমন্ত্রণ", category: "recruitment", body: "প্রিয় {name}, আপনার আবেদনটি বাছাই করা হয়েছে। ইন্টারভিউয়ের জন্য আমাদের অফিসে যোগাযোগ করুন। - Nexivio Care" },
  { name: "Booking confirmed (EN)", category: "booking", body: "Dear {name}, your booking with Nexivio Care is confirmed. Our team will contact you shortly. Thank you!" },
];

export const PLACEHOLDERS = [
  { token: "{name}", label: "নাম" },
  { token: "{phone}", label: "ফোন" },
];

// ─── Encoding & segments (mirrors backend) ─────────────────────────────────

export const isUnicode = (t: string) => /[^\x00-\x7F]/.test(t);

export function segmentInfo(text: string) {
  const len = [...text].length;
  const unicode = isUnicode(text);
  const single = unicode ? 70 : 160;
  const multi = unicode ? 67 : 153;
  const segments = len === 0 ? 0 : len <= single ? 1 : Math.ceil(len / multi);
  const capacity = segments <= 1 ? single : segments * multi;
  return { len, unicode, segments, remaining: Math.max(0, capacity - len), perSegment: segments <= 1 ? single : multi };
}

// ─── Numbers ───────────────────────────────────────────────────────────────

export function normalizePhone(raw: string): string | null {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.startsWith("00880")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("01")) d = "88" + d;
  else if (d.length === 10 && d.startsWith("1")) d = "880" + d;
  return /^8801[3-9]\d{8}$/.test(d) ? d : null;
}

export const localPhone = (p: string) => (p.startsWith("88") ? p.slice(2) : p);

export function parseNumbers(input: string) {
  const raw = input.split(/[\s,;]+/).filter(Boolean);
  const valid = new Set<string>();
  const invalid: string[] = [];
  let duplicates = 0;
  for (const r of raw) {
    const n = normalizePhone(r);
    if (!n) invalid.push(r);
    else if (valid.has(n)) duplicates++;
    else valid.add(n);
  }
  return { valid: [...valid], invalid, duplicates };
}

/** Parse CSV text: finds a phone column (and optional name column). */
export function parseCsv(text: string): { phone: string; name?: string }[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const split = (l: string) => l.split(/,|;|\t/).map((c) => c.replace(/^"|"$/g, "").trim());
  const header = split(lines[0]).map((h) => h.toLowerCase());
  let phoneIdx = header.findIndex((h) => /phone|mobile|number|নম্বর|মোবাইল/.test(h));
  let nameIdx = header.findIndex((h) => /name|নাম/.test(h));
  let rows = lines.slice(1);
  if (phoneIdx === -1) {
    // No header — detect phone column from first row
    rows = lines;
    const first = split(lines[0]);
    phoneIdx = first.findIndex((c) => normalizePhone(c));
    nameIdx = first.findIndex((c, i) => i !== phoneIdx && /[a-zA-Zঀ-৿]/.test(c));
    if (phoneIdx === -1) return [];
  }
  const out: { phone: string; name?: string }[] = [];
  for (const l of rows) {
    const c = split(l);
    const p = normalizePhone(c[phoneIdx] ?? "");
    if (p) out.push({ phone: p, name: nameIdx >= 0 ? c[nameIdx] || undefined : undefined });
  }
  return out;
}

export const fmtDate = (d: string) =>
  new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export const inp =
  "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400";
