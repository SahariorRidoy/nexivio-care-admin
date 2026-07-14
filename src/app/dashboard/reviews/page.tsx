"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, Filter, Star } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import AdminTable, { type Column } from "@/components/ui/AdminTable";

interface Review {
  id: string;
  customerName: string;
  serviceUsed: string | null;
  rating: number;
  commentEn: string | null;
  commentBn: string | null;
  isApproved: boolean;
  createdAt: string;
}

const PAGE_SIZE = 10;

export default function ReviewsPage() {
  const [data, setData] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterApproved, setFilterApproved] = useState<"all" | "approved" | "pending">("all");
  const [filterRating, setFilterRating] = useState<"all" | "5" | "4" | "3" | "2" | "1">("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    api
      .get<{ data: Review[] }>("/reviews")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((r) => {
      const matchApproved =
        filterApproved === "all" ||
        (filterApproved === "approved" && r.isApproved) ||
        (filterApproved === "pending" && !r.isApproved);
      const matchRating =
        filterRating === "all" || r.rating === Number(filterRating);
      const matchSearch =
        !q ||
        r.customerName.toLowerCase().includes(q) ||
        (r.serviceUsed ?? "").toLowerCase().includes(q) ||
        (r.commentEn ?? "").toLowerCase().includes(q) ||
        (r.commentBn ?? "").toLowerCase().includes(q);
      return matchApproved && matchRating && matchSearch;
    });
  }, [data, search, filterApproved, filterRating]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => setPage(1), [search, filterApproved, filterRating]);

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/reviews/${id}`, { isApproved: true });
      setData((prev) => prev.map((r) => (r.id === id ? { ...r, isApproved: true } : r)));
    } catch {
      alert("অনুমোদন ব্যর্থ হয়েছে");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.patch(`/reviews/${id}`, { isApproved: false });
      setData((prev) => prev.map((r) => (r.id === id ? { ...r, isApproved: false } : r)));
    } catch {
      alert("প্রত্যাখ্যান ব্যর্থ হয়েছে");
    }
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/reviews/${id}`).catch(() => {});
    setData((prev) => prev.filter((r) => r.id !== id));
  };

  const columns: Column<Review>[] = [
    { key: "customerName", label: "নাম" },
    {
      key: "serviceUsed",
      label: "সেবা",
      render: (r) => <span className="text-slate-500">{r.serviceUsed || "—"}</span>,
    },
    {
      key: "rating",
      label: "রেটিং",
      render: (r) => (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={12}
              className={i < r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}
            />
          ))}
          <span className="ml-1 text-xs text-slate-500">{r.rating}/5</span>
        </div>
      ),
    },
    {
      key: "commentEn",
      label: "মন্তব্য",
      className: "max-w-xs",
      render: (r) => (
        <span className="block truncate text-slate-600 max-w-xs" title={r.commentEn ?? ""}>
          {r.commentEn || r.commentBn || "—"}
        </span>
      ),
    },
    {
      key: "isApproved",
      label: "অবস্থা",
      render: (r) => (
        <span
          className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
            r.isApproved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {r.isApproved ? "অনুমোদিত" : "বিচারাধীন"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "তারিখ",
      render: (r) => formatDate(r.createdAt),
    },
  ];

  const pendingCount = data.filter((r) => !r.isApproved).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">রিভিউসমূহ</h2>
          <p className="text-sm text-slate-500">
            {filtered.length}টি রিভিউ (মোট {data.length}টি
            {pendingCount > 0 && (
              <span className="ml-1 text-amber-600 font-medium">· {pendingCount}টি অপেক্ষারত</span>
            )}
            )
          </p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="নাম, সেবা বা মন্তব্য দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={filterApproved}
            onChange={(e) => setFilterApproved(e.target.value as "all" | "approved" | "pending")}
            className="pl-8 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
          >
            <option value="all">সব অবস্থা</option>
            <option value="pending">অপেক্ষারত</option>
            <option value="approved">অনুমোদিত</option>
          </select>
        </div>
        <div>
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value as typeof filterRating)}
            className="px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
          >
            <option value="all">সব রেটিং</option>
            {["5", "4", "3", "2", "1"].map((r) => (
              <option key={r} value={r}>
                {"★".repeat(Number(r))} ({r} তারা)
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
        onApprove={(id) => {
          const review = data.find((r) => r.id === id);
          if (review && !review.isApproved) handleApprove(id);
        }}
        onReject={(id) => {
          const review = data.find((r) => r.id === id);
          if (review && review.isApproved) handleReject(id);
        }}
        onDelete={handleDelete}
        emptyMessage="কোনো রিভিউ পাওয়া যায়নি।"
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
