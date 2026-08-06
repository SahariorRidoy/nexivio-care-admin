"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Search, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Eye, User, Phone, MapPin, Stethoscope, Package, Calendar, Clock,
  CreditCard, BadgeCheck, Hash, FileText, X,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import AdminTable, { type Column } from "@/components/ui/AdminTable";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface Booking {
  id: string;
  name: string;
  phone: string;
  address?: string;
  patientName?: string;
  patientGender?: string;
  relationship?: string;
  serviceType: string;
  packageName?: string;
  pricingPeriod?: "daily" | "weekly" | "monthly";
  date?: string;
  time?: string;
  paymentMethod?: string;
  amount?: number;
  paymentStatus?: string;
  transactionId?: string;
  notes?: string;
  status: string;
  createdAt: string;
}

const STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

const statusLabel: Record<string, string> = {
  pending: "বিচারাধীন",
  confirmed: "নিশ্চিত",
  completed: "সম্পন্ন",
  cancelled: "বাতিল",
};
const statusClass: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
};
const paymentStatusClass: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  unpaid: "bg-amber-100 text-amber-700",
  pending: "bg-slate-100 text-slate-600",
  failed: "bg-red-100 text-red-700",
};

const pricingPeriodLabel: Record<string, { label: string; color: string }> = {
  daily:   { label: "Daily",   color: "bg-sky-100 text-sky-700" },
  weekly:  { label: "Weekly",  color: "bg-violet-100 text-violet-700" },
  monthly: { label: "Monthly", color: "bg-emerald-100 text-emerald-700" },
};

const PAGE_SIZE = 10;

function InfoCard({ icon, label, value, mono }: {
  icon: React.ReactNode; label: string; value?: React.ReactNode; mono?: boolean;
}) {
  if (!value && value !== 0) return null;
  return (
    <div className="bg-slate-50 rounded-xl p-3.5 flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0 text-primary-500">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
        <div className={`text-sm font-semibold text-slate-800 break-words ${mono ? "font-mono" : ""}`}>{value}</div>
      </div>
    </div>
  );
}

function SectionBlock({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <div className={`flex items-center gap-2 mb-3`}>
        <span className={`w-1 h-4 rounded-full ${color}`} />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{title}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">{children}</div>
    </div>
  );
}

function BookingDetailsModal({ booking, onClose, onStatusChange, updatingId }: {
  booking: Booking;
  onClose: () => void;
  onStatusChange: (id: string, status: Status) => void;
  updatingId: string | null;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const initials = booking.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">

        {/* Gradient banner header */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-400 px-6 pt-5 pb-10 shrink-0 relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors">
            <X size={16} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-white text-xl font-bold shrink-0">
              {initials}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">{booking.name}</h3>
              <p className="text-primary-100 text-sm mt-0.5">{booking.phone}</p>
              {booking.address && <p className="text-primary-200 text-xs mt-0.5 flex items-center gap-1"><MapPin size={11} />{booking.address}</p>}
            </div>
          </div>
        </div>

        {/* Status bar — overlaps banner */}
        <div className="mx-6 -mt-5 mb-1 shrink-0 z-10 relative">
          <div className="bg-white rounded-xl shadow-md border border-slate-100 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Booking ID</span>
              <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">{booking.id.slice(0, 12)}…</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">অবস্থা</span>
              <select
                value={booking.status}
                disabled={updatingId === booking.id}
                onChange={(e) => onStatusChange(booking.id, e.target.value as Status)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-primary-300 ${statusClass[booking.status] ?? "bg-slate-100 text-slate-600"}`}
              >
                {STATUSES.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 py-4 flex-1 space-y-5">

          {/* Patient */}
          {(booking.patientName || booking.patientGender || booking.relationship) && (
            <SectionBlock title="রোগীর তথ্য" color="bg-violet-400">
              <InfoCard icon={<User size={14} />} label="রোগীর নাম" value={booking.patientName} />
              <InfoCard icon={<User size={14} />} label="লিঙ্গ" value={booking.patientGender} />
              <InfoCard icon={<User size={14} />} label="সম্পর্ক" value={booking.relationship} />
            </SectionBlock>
          )}

          {/* Service */}
          <SectionBlock title="সেবার তথ্য" color="bg-blue-400">
            <InfoCard icon={<Stethoscope size={14} />} label="সেবার ধরন" value={booking.serviceType} />
            <InfoCard icon={<Package size={14} />} label="প্যাকেজ" value={
              booking.packageName ? (
                <span className="flex items-center gap-2 flex-wrap">
                  {booking.packageName}
                  {booking.pricingPeriod && (() => {
                    const p = pricingPeriodLabel[booking.pricingPeriod];
                    return p ? (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.color}`}>{p.label}</span>
                    ) : null;
                  })()}
                </span>
              ) : undefined
            } />
            <InfoCard icon={<Calendar size={14} />} label="তারিখ" value={booking.date ? formatDate(booking.date) : undefined} />
            <InfoCard icon={<Clock size={14} />} label="সময়" value={booking.time} />
          </SectionBlock>

          {/* Payment */}
          {(booking.amount || booking.paymentMethod || booking.paymentStatus || booking.transactionId) && (
            <SectionBlock title="পেমেন্টের তথ্য" color="bg-emerald-400">
              <InfoCard
                icon={<CreditCard size={14} />}
                label="পরিমাণ"
                value={booking.amount ? (
                  <span className="text-emerald-600">৳{booking.amount.toLocaleString()}</span>
                ) : undefined}
              />
              <InfoCard icon={<CreditCard size={14} />} label="পেমেন্ট পদ্ধতি" value={booking.paymentMethod} />
              <InfoCard
                icon={<BadgeCheck size={14} />}
                label="পেমেন্ট অবস্থা"
                value={
                  booking.paymentStatus ? (
                    <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full ${paymentStatusClass[booking.paymentStatus] ?? "bg-slate-100 text-slate-600"}`}>
                      {booking.paymentStatus}
                    </span>
                  ) : undefined
                }
              />
              <InfoCard icon={<Hash size={14} />} label="ট্রানজেকশন আইডি" value={booking.transactionId} mono />
            </SectionBlock>
          )}

          {/* Notes */}
          {booking.notes && (
            <SectionBlock title="নোট" color="bg-amber-400">
              <div className="sm:col-span-2 bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                <FileText size={15} className="mt-0.5 text-amber-500 shrink-0" />
                <p className="text-sm text-slate-700 leading-relaxed">{booking.notes}</p>
              </div>
            </SectionBlock>
          )}
        </div>

        {/* Sticky footer */}
        <div className="px-6 py-3 border-t border-slate-100 shrink-0 flex items-center justify-between bg-slate-50">
          <p className="text-xs text-slate-400">জমার তারিখ: <span className="font-medium text-slate-500">{formatDate(booking.createdAt)}</span></p>
          <button onClick={onClose} className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-4 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, total, pageSize, onChange }: {
  page: number; totalPages: number; total: number; pageSize: number;
  onChange: (p: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const pages = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const result: (number | "...")[] = [1];
    if (page > 3) result.push("...");
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) result.push(p);
    if (page < totalPages - 2) result.push("...");
    result.push(totalPages);
    return result;
  }, [page, totalPages]);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-1">
      <p className="text-sm text-slate-500">
        {total === 0 ? "কোনো ফলাফল নেই" : `${from}–${to} দেখানো হচ্ছে, মোট ${total}টি`}
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(1)} disabled={page === 1}
          className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors">
          <ChevronsLeft size={15} />
        </button>
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors">
          <ChevronLeft size={15} />
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e-${i}`} className="px-2 text-slate-400 text-sm select-none">…</span>
          ) : (
            <button key={p} onClick={() => onChange(p as number)}
              className={`min-w-[34px] h-[34px] rounded-lg border text-sm font-medium transition-colors ${p === page ? "bg-primary-600 text-white border-primary-600 shadow-sm" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
          className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors">
          <ChevronRight size={15} />
        </button>
        <button onClick={() => onChange(totalPages)} disabled={page === totalPages}
          className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors">
          <ChevronsRight size={15} />
        </button>
      </div>
    </div>
  );
}

export default function BookingsPage() {
  const [data, setData] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);

  useEffect(() => {
    api.get<{ data: Booking[] }>("/bookings")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((b) => {
      const matchStatus = filterStatus === "all" || b.status === filterStatus;
      const matchSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.phone.includes(q) ||
        (b.address ?? "").toLowerCase().includes(q) ||
        b.serviceType.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [data, search, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => setPage(1), [search, filterStatus]);

  const handleStatusChange = async (id: string, status: Status) => {
    setUpdatingId(id);
    try {
      await api.patch(`/bookings/${id}`, { status });
      setData((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
      if (viewBooking?.id === id) setViewBooking((prev) => prev ? { ...prev, status } : prev);
      toast.success(`বুকিং অবস্থা "${statusLabel[status]}"-তে আপডেট হয়েছে!`);
    } catch {
      toast.error("স্ট্যাটাস আপডেট ব্যর্থ হয়েছে");
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await api.delete(`/bookings/${deleteId}`).catch(() => {});
    setData((prev) => prev.filter((b) => b.id !== deleteId));
    if (viewBooking?.id === deleteId) setViewBooking(null);
    setDeleteId(null);
    toast.success("বুকিং সফলভাবে মুছে ফেলা হয়েছে!");
  };

  const columns: Column<Booking>[] = [
    {
      key: "name", label: "নাম",
      render: (r) => (
        <div>
          <div className="font-medium text-slate-800">{r.name}</div>
          <div className="text-xs text-slate-400">{r.phone}</div>
        </div>
      ),
    },
    {
      key: "serviceType", label: "সেবা",
      render: (r) => (
        <div>
          <div className="text-slate-700">{r.serviceType}</div>
          {r.packageName && <div className="text-xs text-slate-400">{r.packageName}</div>}
        </div>
      ),
    },
    {
      key: "date", label: "তারিখ / সময়",
      render: (r) => (
        <span className="text-slate-600">
          {r.date ? formatDate(r.date) : "—"}
          {r.time ? <span className="text-slate-400"> · {r.time}</span> : null}
        </span>
      ),
    },
    {
      key: "status", label: "অবস্থা",
      render: (r) => (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusClass[r.status] ?? "bg-slate-100 text-slate-600"}`}>
          {statusLabel[r.status] ?? r.status}
        </span>
      ),
    },
    {
      key: "createdAt", label: "জমার তারিখ",
      render: (r) => <span className="text-slate-500 text-xs">{formatDate(r.createdAt)}</span>,
    },
    {
      key: "_view", label: "",
      render: (r) => (
        <button
          onClick={() => setViewBooking(r)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors whitespace-nowrap"
        >
          <Eye size={13} />
          View Details
        </button>
      ),
    },
  ];

  return (
    <div>
      <ConfirmModal
        open={!!deleteId}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        message="এই বুকিংটি স্থায়ীভাবে মুছে যাবে। আপনি কি নিশ্চিত?"
      />

      {viewBooking && (
        <BookingDetailsModal
          booking={viewBooking}
          onClose={() => setViewBooking(null)}
          onStatusChange={handleStatusChange}
          updatingId={updatingId}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">বুকিংসমূহ</h2>
          <p className="text-sm text-slate-500">
            {filtered.length}টি বুকিং পাওয়া গেছে (মোট {data.length}টি)
          </p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="নাম, ফোন, ঠিকানা বা সেবার ধরন দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as Status | "all")}
            className="pl-8 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
          >
            <option value="all">সব অবস্থা</option>
            {STATUSES.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
          </select>
        </div>
      </div>

      {/* Table — view button wired via onEdit */}
      <AdminTable
        columns={columns}
        data={paginated}
        loading={loading}
        onDelete={(id) => setDeleteId(id)}
        emptyMessage="কোনো বুকিং পাওয়া যায়নি।"
      />

      <Pagination page={safePage} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
    </div>
  );
}
