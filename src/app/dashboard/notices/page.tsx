"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Search, Filter, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate, assetUrl } from "@/lib/utils";
import AdminTable, { type Column } from "@/components/ui/AdminTable";
import Modal from "@/components/ui/Modal";

interface Notice {
  id: string;
  titleBn: string;
  titleEn: string;
  contentEn: string | null;
  contentBn: string | null;
  type: string;
  documentUrl: string | null;
  documentPublicId: string | null;
  isActive: boolean;
  order: number;
  createdAt: string;
}

interface FormData {
  titleEn: string; titleBn: string; contentEn: string; contentBn: string;
  type: string; isActive: boolean; order: string;
  documentUrl: string; documentPublicId: string;
}

const TYPES = ["general", "training", "circular", "job"] as const;
type NoticeType = (typeof TYPES)[number];

const typeLabel: Record<string, string> = { general: "সাধারণ", training: "প্রশিক্ষণ", circular: "সার্কুলার", job: "চাকরি" };
const typeClass: Record<string, string> = { general: "bg-slate-100 text-slate-600", training: "bg-blue-100 text-blue-700", circular: "bg-amber-100 text-amber-700", job: "bg-green-100 text-green-700" };

const empty: FormData = { titleEn: "", titleBn: "", contentEn: "", contentBn: "", type: "general", isActive: true, order: "0", documentUrl: "", documentPublicId: "" };

const PAGE_SIZE = 10;

export default function NoticesPage() {
  const [data, setData] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<NoticeType | "all">("all");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    api.get<{ data: Notice[] }>("/notices")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((n) => {
      const matchType = filterType === "all" || n.type === filterType;
      const matchActive = filterActive === "all" || (filterActive === "active" && n.isActive) || (filterActive === "inactive" && !n.isActive);
      const matchSearch = !q || n.titleBn.toLowerCase().includes(q) || n.titleEn.toLowerCase().includes(q);
      return matchType && matchActive && matchSearch;
    });
  }, [data, search, filterType, filterActive]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  useEffect(() => setPage(1), [search, filterType, filterActive]);

  const openAdd = () => { setEditing(null); setForm(empty); setError(""); setModalOpen(true); };
  const openEdit = (row: Notice) => {
    setEditing(row);
    setForm({ titleEn: row.titleEn, titleBn: row.titleBn, contentEn: row.contentEn ?? "", contentBn: row.contentBn ?? "", type: row.type, isActive: row.isActive, order: String(row.order), documentUrl: row.documentUrl ?? "", documentPublicId: row.documentPublicId ?? "" });
    setError(""); setModalOpen(true);
  };

  const set = (k: keyof FormData, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const handleDocUpload = async (file: File) => {
    setUploadingDoc(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await api.upload<{ data: { url: string; publicId: string } }>("/uploads/pdf", fd);
      set("documentUrl", res.data.url); set("documentPublicId", res.data.publicId);
    } catch { alert("ডকুমেন্ট আপলোড ব্যর্থ হয়েছে"); }
    finally { setUploadingDoc(false); }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    setTogglingId(id);
    try {
      await api.patch(`/notices/${id}`, { isActive: !current });
      setData((prev) => prev.map((n) => n.id === id ? { ...n, isActive: !current } : n));
    } catch { alert("অবস্থা পরিবর্তন ব্যর্থ হয়েছে"); }
    finally { setTogglingId(null); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titleEn.trim() || !form.titleBn.trim()) { setError("বাংলা ও ইংরেজি শিরোনাম প্রয়োজন"); return; }
    setSaving(true); setError("");
    try {
      const body = {
        titleEn: form.titleEn, titleBn: form.titleBn,
        contentEn: form.contentEn || undefined, contentBn: form.contentBn || undefined,
        type: form.type, isActive: form.isActive, order: Number(form.order),
        documentUrl: form.documentUrl || undefined, documentPublicId: form.documentPublicId || undefined,
      };
      if (editing) {
        const res = await api.patch<{ data: Notice }>(`/notices/${editing.id}`, body);
        setData((prev) => prev.map((n) => n.id === editing.id ? res.data : n));
      } else {
        const res = await api.post<{ data: Notice }>("/notices", body);
        setData((prev) => [res.data, ...prev]);
      }
      setModalOpen(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "সংরক্ষণ ব্যর্থ হয়েছে");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/notices/${id}`).catch(() => {});
    setData((prev) => prev.filter((n) => n.id !== id));
  };

  const columns: Column<Notice>[] = [
    { key: "titleBn", label: "শিরোনাম (বাংলা)" },
    { key: "titleEn", label: "শিরোনাম (ইংরেজি)" },
    {
      key: "type", label: "ধরন",
      render: (r) => <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${typeClass[r.type] ?? "bg-slate-100 text-slate-600"}`}>{typeLabel[r.type] ?? r.type}</span>,
    },
    {
      key: "documentUrl", label: "ডকুমেন্ট",
      render: (r) => r.documentUrl ? <a href={assetUrl(r.documentUrl)} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-xs">ডাউনলোড</a> : <span className="text-slate-400">—</span>,
    },
    {
      key: "isActive", label: "অবস্থা",
      render: (r) => (
        <button disabled={togglingId === r.id} onClick={() => handleToggleActive(r.id, r.isActive)}
          className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full cursor-pointer transition-colors ${r.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
          {r.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
        </button>
      ),
    },
    { key: "createdAt", label: "তারিখ", render: (r) => formatDate(r.createdAt) },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">নোটিসসমূহ</h2>
          <p className="text-sm text-slate-500">{filtered.length}টি নোটিস (মোট {data.length}টি)</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> নতুন নোটিস
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="শিরোনাম দিয়ে খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300" />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as NoticeType | "all")}
            className="pl-8 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white">
            <option value="all">সব ধরন</option>
            {TYPES.map((t) => <option key={t} value={t}>{typeLabel[t]}</option>)}
          </select>
        </div>
        <select value={filterActive} onChange={(e) => setFilterActive(e.target.value as "all" | "active" | "inactive")}
          className="px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white">
          <option value="all">সব অবস্থা</option>
          <option value="active">সক্রিয়</option>
          <option value="inactive">নিষ্ক্রিয়</option>
        </select>
      </div>

      <AdminTable columns={columns} data={paginated} loading={loading} onEdit={openEdit} onDelete={handleDelete} emptyMessage="কোনো নোটিস পাওয়া যায়নি।" />

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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "নোটিস সম্পাদনা" : "নতুন নোটিস যোগ করুন"} width="max-w-xl">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="শিরোনাম (ইংরেজি) *"><input required value={form.titleEn} onChange={(e) => set("titleEn", e.target.value)} className={inp} /></Field>
            <Field label="শিরোনাম (বাংলা) *"><input required value={form.titleBn} onChange={(e) => set("titleBn", e.target.value)} className={inp} /></Field>
          </div>
          <Field label="বিষয়বস্তু (ইংরেজি)"><textarea rows={2} value={form.contentEn} onChange={(e) => set("contentEn", e.target.value)} className={inp} /></Field>
          <Field label="বিষয়বস্তু (বাংলা)"><textarea rows={2} value={form.contentBn} onChange={(e) => set("contentBn", e.target.value)} className={inp} /></Field>
          <div className="grid grid-cols-3 gap-4">
            <Field label="ধরন">
              <select value={form.type} onChange={(e) => set("type", e.target.value)} className={inp}>
                {TYPES.map((t) => <option key={t} value={t}>{typeLabel[t]}</option>)}
              </select>
            </Field>
            <Field label="ক্রম"><input type="number" value={form.order} onChange={(e) => set("order", e.target.value)} className={inp} /></Field>
            <Field label="অবস্থা">
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="h-4 w-4 accent-primary-600" />
                <span className="text-sm text-slate-700">সক্রিয়</span>
              </label>
            </Field>
          </div>
          <Field label="ডকুমেন্ট (PDF)">
            {form.documentUrl ? (
              <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-slate-50">
                <a href={assetUrl(form.documentUrl)} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline flex-1 truncate">আপলোড করা ডকুমেন্ট</a>
                <button type="button" onClick={() => { set("documentUrl", ""); set("documentPublicId", ""); }} className="text-xs text-red-500 hover:text-red-700">সরান</button>
              </div>
            ) : (
              <label className={`flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-primary-400 text-slate-500 hover:text-primary-600 transition-colors ${uploadingDoc ? "opacity-60 pointer-events-none" : ""}`}>
                {uploadingDoc ? <Loader2 size={15} className="animate-spin" /> : null}
                <span className="text-sm">{uploadingDoc ? "আপলোড হচ্ছে..." : "PDF ফাইল বেছে নিন"}</span>
                <input type="file" accept=".pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleDocUpload(e.target.files[0]); }} />
              </label>
            )}
          </Field>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">বাতিল</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-semibold rounded-lg bg-primary-700 text-white hover:bg-primary-800 disabled:opacity-60">
              {saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1"><label className="text-xs font-medium text-slate-600">{label}</label>{children}</div>;
}
const inp = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none";
