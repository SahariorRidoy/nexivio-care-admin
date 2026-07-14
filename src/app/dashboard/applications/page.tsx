"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, Filter } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate, assetUrl } from "@/lib/utils";
import AdminTable, { type Column } from "@/components/ui/AdminTable";

interface Application {
  id: string;
  name: string;
  phone: string;
  experience?: string;
  education?: string;
  cvUrl?: string;
  status: string;
  createdAt: string;
}

const STATUSES = ["pending", "reviewed", "shortlisted", "hired", "rejected"] as const;
type Status = (typeof STATUSES)[number];

const statusLabel: Record<string, string> = {
  pending: "বিচারাধীন",
  reviewed: "পর্যালোচিত",
  shortlisted: "শর্টলিস্টেড",
  hired: "নিয়োগ পেয়েছে",
  rejected: "প্রত্যাখ্যাত",
};
const statusClass: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  reviewed: "bg-blue-100 text-blue-700",
  shortlisted: "bg-purple-100 text-purple-700",
  hired: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const PAGE_SIZE = 10;

export default function ApplicationsPage() {
  const [data, setData] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ data: Application[] }>("/applications")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((a) => {
      const matchStatus = filterStatus === "all" || a.status === filterStatus;
      const matchSearch =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.phone.includes(q) ||
        (a.experience ?? "").toLowerCase().includes(q) ||
        (a.education ?? "").toLowerCase().includes(q);
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
      await api.patch(`/applications/${id}`, { status });
      setData((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    } catch {
      alert("স্ট্যাটাস আপডেট ব্যর্থ হয়েছে");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/applications/${id}`).catch(() => {});
    setData((prev) => prev.filter((a) => a.id !== id));
  };

  const columns: Column<Application>[] = [
    { key: "name", label: "নাম" },
    { key: "phone", label: "ফোন" },
    {
      key: "experience",
      label: "অভিজ্ঞতা",
      render: (r) => <span className="text-slate-500">{r.experience || "—"}</span>,
    },
    {
      key: "education",
      label: "শিক্ষা",
      render: (r) => <span className="text-slate-500">{r.education || "—"}</span>,
    },
    {
      key: "cvUrl",
      label: "সিভি",
      render: (r) =>
        r.cvUrl ? (
          <a
            href={assetUrl(r.cvUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:underline text-xs font-medium"
          >
            ডাউনলোড
          </a>
        ) : (
          <span className="text-slate-400">—</span>
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
      label: "তারিখ",
      render: (r) => formatDate(r.createdAt),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">চাকরি আবেদনসমূহ</h2>
          <p className="text-sm text-slate-500">
            {filtered.length}টি আবেদন পাওয়া গেছে (মোট {data.length}টি)
          </p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="নাম, ফোন, শিক্ষা বা অভিজ্ঞতা দিয়ে খুঁজুন..."
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
        emptyMessage="কোনো আবেদন পাওয়া যায়নি।"
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
          <span>
            পৃষ্ঠা {safePage} / {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              ‹ আগে
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - safePage) <= 2)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-lg border transition-colors ${
                    p === safePage
                      ? "bg-primary-600 text-white border-primary-600"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              পরে ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
