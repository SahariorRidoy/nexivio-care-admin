"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Search, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Eye, Plus, Receipt,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { formatDate, formatDateTime, formatTime } from "@/lib/utils";
import AdminTable, { type Column } from "@/components/ui/AdminTable";
import ConfirmModal from "@/components/ui/ConfirmModal";
import BookingReceipt, { type ReceiptBooking } from "@/components/ui/BookingReceipt";
import BookingDetailModal from "@/components/ui/BookingDetailModal";
import NewBookingModal from "@/components/ui/NewBookingModal";
import {
  type Booking, type Status,
  BOOKING_STATUSES, statusLabel, statusClass, paymentStatusClass,
} from "@/lib/booking.types";

const PAGE_SIZE = 10;

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
        <button onClick={() => onChange(1)} disabled={page === 1} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors"><ChevronsLeft size={15} /></button>
        <button onClick={() => onChange(page - 1)} disabled={page === 1} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors"><ChevronLeft size={15} /></button>
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
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors"><ChevronRight size={15} /></button>
        <button onClick={() => onChange(totalPages)} disabled={page === totalPages} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors"><ChevronsRight size={15} /></button>
      </div>
    </div>
  );
}

export default function BookingsPage() {
  const [data, setData] = useState<Booking[]>([]);
  const [services, setServices] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [receiptBooking, setReceiptBooking] = useState<Booking | null>(null);
  const [showNewBooking, setShowNewBooking] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<{ data: Booking[] }>("/bookings"),
      api.get<{ data: { id: string; nameEn: string; nameBn: string }[] }>("/services"),
    ])
      .then(([b, s]) => {
        setData(b.data);
        setServices(Object.fromEntries(
          s.data.flatMap((x) => [
            [x.id, x.nameBn],
            [x.nameEn.toLowerCase().replace(/\s+/g, "-"), x.nameBn],
            [x.nameEn, x.nameBn],
          ])
        ));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((b) => {
      const matchStatus = filterStatus === "all" || b.status === filterStatus;
      const matchPayment = filterPayment === "all" || (b.paymentStatus ?? "unpaid") === filterPayment;
      const bDate = (b.date ?? "").slice(0, 10);
      const matchDateFrom = !dateFrom || bDate >= dateFrom;
      const matchDateTo = !dateTo || bDate <= dateTo;
      const matchSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.phone.includes(q) ||
        (b.address ?? "").toLowerCase().includes(q) ||
        b.serviceType.toLowerCase().includes(q) ||
        (b.receiptNumber ?? "").toLowerCase().includes(q);
      return matchStatus && matchPayment && matchDateFrom && matchDateTo && matchSearch;
    });
  }, [data, search, filterStatus, filterPayment, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => setPage(1), [search, filterStatus, filterPayment, dateFrom, dateTo]);

  const handleBookingUpdate = (updated: Booking) => {
    setData((prev) => prev.map((b) => b.id === updated.id ? updated : b));
    if (viewBooking?.id === updated.id) setViewBooking(updated);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await api.delete(`/bookings/${deleteId}`).catch(() => {});
    setData((prev) => prev.filter((b) => b.id !== deleteId));
    if (viewBooking?.id === deleteId) setViewBooking(null);
    setDeleteId(null);
    toast.success("বুকিং সফলভাবে মুছে ফেলা হয়েছে!");
  };

  const handleNewBooking = (booking: Booking) => {
    setData((prev) => [booking, ...prev]);
    setShowNewBooking(false);
    toast.success("নতুন বুকিং তৈরি হয়েছে!");
  };

  const columns: Column<Booking>[] = [
    {
      key: "receiptNumber", label: "রিসিট নং",
      render: (r) => (
        <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
          {r.receiptNumber ?? "—"}
        </span>
      ),
    },
    {
      key: "name", label: "নাম / ফোন",
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
          <div className="text-slate-700 text-sm">{services[r.serviceType] ?? r.serviceType}</div>
          {r.packageName && <div className="text-xs text-slate-400">{r.packageName}</div>}
        </div>
      ),
    },
    {
      key: "date", label: "তারিখ",
      render: (r) => (
        <span className="text-slate-600 text-xs">
          {r.date ? formatDate(r.date) : "—"}
          {r.time ? <span className="text-slate-400"> · {formatTime(r.time)}</span> : null}
        </span>
      ),
    },
    {
      key: "amount", label: "পরিমাণ",
      render: (r) => (
        <span className="font-semibold text-emerald-600 text-sm">
          {r.amount ? `৳${r.amount.toLocaleString()}` : "—"}
        </span>
      ),
    },
    {
      key: "paymentStatus", label: "পেমেন্ট",
      render: (r) => {
        const ps = r.paymentStatus ?? "unpaid";
        return (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${paymentStatusClass[ps] ?? "bg-slate-100 text-slate-600"}`}>
            {ps}
          </span>
        );
      },
    },
    {
      key: "status", label: "অবস্থা",
      render: (r) => (
        <select
          value={r.status}
          onChange={async (e) => {
            const newStatus = e.target.value;
            try {
              await api.patch(`/bookings/${r.id}`, { status: newStatus });
              setData((prev) => prev.map((b) => b.id === r.id ? { ...b, status: newStatus } : b));
              if (viewBooking?.id === r.id) setViewBooking((v) => v ? { ...v, status: newStatus } : v);
              toast.success("অবস্থা আপডেট হয়েছে!");
            } catch {
              toast.error("আপডেট ব্যর্থ হয়েছে");
            }
          }}
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-primary-300 ${statusClass[r.status] ?? "bg-slate-100 text-slate-600"}`}
        >
          {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
        </select>
      ),
    },
    {
      key: "createdAt", label: "জমার তারিখ",
      render: (r) => <span className="text-slate-500 text-xs">{formatDateTime(r.createdAt)}</span>,
    },
    {
      key: "_actions", label: "",
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setReceiptBooking(r)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors whitespace-nowrap"
            title="রিসিট দেখুন"
          >
            <Receipt size={12} /> Receipt
          </button>
          <button
            onClick={() => setViewBooking(r)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors whitespace-nowrap"
          >
            <Eye size={12} /> Details
          </button>
        </div>
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

      {receiptBooking && (
        <BookingReceipt
          booking={receiptBooking as ReceiptBooking}
          serviceName={services[receiptBooking.serviceType] ?? receiptBooking.serviceType}
          onClose={() => setReceiptBooking(null)}
        />
      )}

      {viewBooking && (
        <BookingDetailModal
          booking={viewBooking}
          services={services}
          onClose={() => setViewBooking(null)}
          onUpdate={handleBookingUpdate}
          onDelete={(id) => { setViewBooking(null); setDeleteId(id); }}
          onOpenReceipt={(b) => { setViewBooking(null); setReceiptBooking(b); }}
        />
      )}

      {showNewBooking && (
        <NewBookingModal
          services={services}
          onClose={() => setShowNewBooking(false)}
          onCreate={handleNewBooking}
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
        <button
          onClick={() => setShowNewBooking(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus size={16} /> নতুন বুকিং
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="নাম, ফোন, রিসিট নং বা সেবার ধরন দিয়ে খুঁজুন..."
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
            {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
          </select>
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="pl-8 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
          >
            <option value="all">সব পেমেন্ট</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white text-slate-600"
          title="তারিখ থেকে"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white text-slate-600"
          title="তারিখ পর্যন্ত"
        />
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(""); setDateTo(""); }}
            className="px-3 py-2 text-xs font-medium text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            ✕ তারিখ মুছুন
          </button>
        )}
      </div>

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
