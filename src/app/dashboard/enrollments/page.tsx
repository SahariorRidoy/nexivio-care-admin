"use client";

import { useEffect, useState, useMemo } from "react";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import AdminTable, { type Column } from "@/components/ui/AdminTable";

interface Enrollment {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  education: string | null;
  message: string | null;
  status: string;
  createdAt: string;
  training: { titleEn: string; titleBn: string };
}

const STATUSES = ["pending", "confirmed", "cancelled"] as const;
const STATUS_LABELS: Record<string, string> = { pending: "বিচারাধীন", confirmed: "নিশ্চিত", cancelled: "বাতিল" };
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

const PAGE_SIZE = 15;

export default function EnrollmentsPage() {
  const [data, setData] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get<{ data: Enrollment[] }>("/training-enrollments")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? data : data.filter(
      (e) => e.name.toLowerCase().includes(q) || e.phone.includes(q) ||
        e.training.titleBn.toLowerCase().includes(q) || e.training.titleEn.toLowerCase().includes(q)
    );
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleStatusChange = async (id: string, status: string) => {
    await api.patch(`/training-enrollments/${id}`, { status }).catch(() => {});
    setData((prev) => prev.map((e) => e.id === id ? { ...e, status } : e));
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/training-enrollments/${id}`).catch(() => {});
    setData((prev) => prev.filter((e) => e.id !== id));
  };

  const columns: Column<Enrollment>[] = [
    { key: "name", label: "নাম" },
    { key: "phone", label: "ফোন" },
    { key: "training", label: "কোর্স", render: (r) => <span className="text-slate-600">{r.training.titleBn}</span> },
    { key: "education", label: "শিক্ষা", render: (r) => <span className="text-slate-500">{r.education || "—"}</span> },
    {
      key: "status", label: "অবস্থা", render: (r) => (
        <select
          value={r.status}
          onChange={(e) => handleStatusChange(r.id, e.target.value)}
          className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[r.status] ?? "bg-slate-100 text-slate-600"}`}
        >
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      )
    },
    { key: "createdAt", label: "তারিখ", render: (r) => formatDate(r.createdAt) },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">প্রশিক্ষণ ভর্তি আবেদন</h2>
          <p className="text-sm text-slate-500">{filtered.length}টি আবেদন (মোট {data.length}টি)</p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text" placeholder="নাম, ফোন বা কোর্স দিয়ে খুঁজুন..."
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
      </div>

      <AdminTable columns={columns} data={paginated} loading={loading} onDelete={handleDelete} emptyMessage="কোনো আবেদন পাওয়া যায়নি।" />

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
          <span>পৃষ্ঠা {safePage} / {totalPages}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">‹ আগে</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => Math.abs(p - safePage) <= 2).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`px-3 py-1.5 rounded-lg border transition-colors ${p === safePage ? "bg-primary-600 text-white border-primary-600" : "border-slate-200 hover:bg-slate-50"}`}>{p}</button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">পরে ›</button>
          </div>
        </div>
      )}
    </div>
  );
}
