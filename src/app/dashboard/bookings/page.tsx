"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
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
  paid:    "bg-green-100 text-green-700",
  unpaid:  "bg-amber-100 text-amber-700",
  pending: "bg-slate-100 text-slate-600",
  failed:  "bg-red-100 text-red-700",
};

const PAGE_SIZE = 10;

function Pagination({
  page, totalPages, total, pageSize, onChange,
}: {
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
          className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors" title="প্রথম পৃষ্ঠা">
          <ChevronsLeft size={15} />
        </button>
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors" title="আগের পৃষ্ঠা">
          <ChevronLeft size={15} />
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-2 text-slate-400 text-sm select-none">…</span>
          ) : (
            <button key={p} onClick={() => onChange(p as number)}
              className={`min-w-[34px] h-[34px] rounded-lg border text-sm font-medium transition-colors ${
                p === page ? "bg-primary-600 text-white border-primary-600 shadow-sm" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
          className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors" title="পরের পৃষ্ঠা">
          <ChevronRight size={15} />
        </button>
        <button onClick={() => onChange(totalPages)} disabled={page === totalPages}
          className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors" title="শেষ পৃষ্ঠা">
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

  useEffect(() => {
    api
      .get<{ data: Booking[] }>("/bookings")
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

  // Reset to page 1 when filter/search changes
  useEffect(() => setPage(1), [search, filterStatus]);

  const handleStatusChange = async (id: string, status: Status) => {
    setUpdatingId(id);
    try {
      await api.patch(`/bookings/${id}`, { status });
      setData((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
      toast.success(`বুকিং অবস্থা “${statusLabel[status]}”-তে আপডেট হয়েছে!`);
    } catch {
      toast.error("স্ট্যাটাস আপডেট ব্যর্থ হয়েছে");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = (id: string) => setDeleteId(id);

  const confirmDelete = async () => {
    if (!deleteId) return;
    await api.delete(`/bookings/${deleteId}`).catch(() => {});
    setData((prev) => prev.filter((b) => b.id !== deleteId));
    setDeleteId(null);
    toast.success("বুকিং সফলভাবে মুছে ফেলা হয়েছে!");
  };

  const columns: Column<Booking>[] = [
    { key: "name", label: "নাম",
      render: (r) => (
        <div>
          <div className="font-medium">{r.name}</div>
          <div className="text-xs text-slate-400">{r.phone}</div>
        </div>
      ),
    },
    {
      key: "patientName",
      label: "রোগীর তথ্য",
      render: (r) => r.patientName ? (
        <div>
          <div className="font-medium">{r.patientName}</div>
          <div className="text-xs text-slate-400 capitalize">
            {r.patientGender || "—"}{r.relationship ? ` · ${r.relationship}` : ""}
          </div>
        </div>
      ) : <span className="text-slate-300">—</span>,
    },
    {
      key: "address",
      label: "ঠিকানা",
      render: (r) => <span className="text-slate-500">{r.address || "—"}</span>,
    },
    { key: "serviceType", label: "সেবার ধরন",
      render: (r) => (
        <div>
          <div>{r.serviceType}</div>
          {r.packageName && <div className="text-xs text-slate-400">{r.packageName}</div>}
        </div>
      ),
    },
    {
      key: "amount",
      label: "পরিমাণ",
      render: (r) => (
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-slate-800">{r.amount ? `৳${r.amount.toLocaleString()}` : "—"}</span>
          {r.paymentMethod && <span className="text-xs text-slate-400 capitalize">{r.paymentMethod}</span>}
          {r.paymentStatus && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${paymentStatusClass[r.paymentStatus] ?? "bg-slate-100 text-slate-600"}`}>
              {r.paymentStatus}
            </span>
          )}
          {r.transactionId && <span className="text-xs font-mono text-slate-400">{r.transactionId}</span>}
        </div>
      ),
    },
    {
      key: "date",
      label: "তারিখ / সময়",
      render: (r) => (
        <span>
          {r.date ? formatDate(r.date) : "—"}
          {r.time ? <span className="text-slate-400"> {r.time}</span> : null}
        </span>
      ),
    },
    {
      key: "status",
      label: "অবস্থা",
      render: (r) => (
        <select
          value={r.status}
          disabled={updatingId === r.id}
          onChange={(e) => handleStatusChange(r.id, e.target.value as Status)}
          className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-primary-300 ${statusClass[r.status] ?? "bg-slate-100 text-slate-600"}`}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel[s]}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: "createdAt",
      label: "জমার তারিখ",
      render: (r) => formatDate(r.createdAt),
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

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">বুকিংসমূহ</h2>
          <p className="text-sm text-slate-500">
            {filtered.length}টি বুকিং পাওয়া গেছে (মোট {data.length}টি)
          </p>
        </div>
      </div>

      {/* Search + Filter bar */}
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
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <AdminTable
        columns={columns}
        data={paginated}
        loading={loading}
        onDelete={handleDelete}
        emptyMessage="কোনো বুকিং পাওয়া যায়নি।"
      />

      <Pagination page={safePage} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
    </div>
  );
}
