export interface Booking {
  id: string;
  receiptNumber?: string | null;
  name: string;
  phone: string;
  address?: string | null;
  patientName?: string | null;
  patientGender?: string | null;
  relationship?: string | null;
  serviceType: string;
  packageName?: string | null;
  pricingPeriod?: "daily" | "weekly" | "monthly" | null;
  date?: string | null;
  time?: string | null;
  paymentMethod?: string | null;
  amount?: number | null;
  paymentStatus?: string | null;
  transactionId?: string | null;
  notes?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  history?: BookingHistoryEntry[];
}

export interface BookingHistoryEntry {
  id: string;
  bookingId: string;
  field: string;
  oldValue?: string | null;
  newValue?: string | null;
  changedBy?: string | null;
  note?: string | null;
  createdAt: string;
}

export const BOOKING_STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;
export type Status = (typeof BOOKING_STATUSES)[number];

export const statusLabel: Record<string, string> = {
  pending: "বিচারাধীন",
  confirmed: "নিশ্চিত",
  completed: "সম্পন্ন",
  cancelled: "বাতিল",
};

export const statusClass: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
};

export const paymentStatusClass: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  unpaid: "bg-amber-100 text-amber-700",
  pending: "bg-slate-100 text-slate-600",
  failed: "bg-red-100 text-red-700",
};
