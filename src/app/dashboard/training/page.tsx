"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import AdminTable, { type Column } from "@/components/ui/AdminTable";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ImageUpload from "@/components/ui/ImageUpload";

interface SyllabusModule {
  titleEn: string;
  titleBn: string;
  items: string[];
}

interface Training {
  id: string;
  titleEn: string;
  titleBn: string;
  category: string | null;
  duration: string | null;
  weeklyClasses: string | null;
  totalHours: string | null;
  classType: string | null;
  fee: number;
  descriptionEn: string | null;
  descriptionBn: string | null;
  syllabusEn: string[];
  syllabusBn: string[];
  syllabusModules: SyllabusModule[] | null;
  image: string | null;
  imagePublicId: string | null;
  isActive: boolean;
  order: number;
  createdAt: string;
}

interface FormData {
  titleEn: string; titleBn: string; category: string; duration: string; weeklyClasses: string; totalHours: string; classType: string; fee: string;
  descriptionEn: string; descriptionBn: string;
  syllabusEn: string; syllabusBn: string;
  syllabusModules: SyllabusModule[];
  image: string | null; imagePublicId: string | null;
  isActive: boolean; order: string;
}

const empty: FormData = {
  titleEn: "", titleBn: "", category: "", duration: "", weeklyClasses: "", totalHours: "", classType: "offline", fee: "0",
  descriptionEn: "", descriptionBn: "", syllabusEn: "", syllabusBn: "",
  syllabusModules: [],
  image: null, imagePublicId: null, isActive: true, order: "0",
};

const PAGE_SIZE = 10;

export default function TrainingPage() {
  const [data, setData] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Training | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ data: Training[] }>("/training")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? data : data.filter(
      (t) => t.titleEn.toLowerCase().includes(q) || t.titleBn.toLowerCase().includes(q) || (t.category ?? "").toLowerCase().includes(q)
    );
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  useEffect(() => setPage(1), [search]);

  const openAdd = () => { setEditing(null); setForm(empty); setError(""); setModalOpen(true); };
  const openEdit = (row: Training) => {
    setEditing(row);
    setForm({
      titleEn: row.titleEn, titleBn: row.titleBn, category: row.category ?? "",
      duration: row.duration ?? "", weeklyClasses: row.weeklyClasses ?? "", totalHours: row.totalHours ?? "", classType: row.classType ?? "offline", fee: String(row.fee),
      descriptionEn: row.descriptionEn ?? "", descriptionBn: row.descriptionBn ?? "",
      syllabusEn: (row.syllabusEn ?? []).join("\n"), syllabusBn: (row.syllabusBn ?? []).join("\n"),
      syllabusModules: (row.syllabusModules as SyllabusModule[]) ?? [],
      image: row.image, imagePublicId: row.imagePublicId, isActive: row.isActive, order: String(row.order),
    });
    setError(""); setModalOpen(true);
  };

  const set = (k: keyof FormData, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titleEn.trim() || !form.titleBn.trim()) { setError("বাংলা ও ইংরেজি শিরোনাম প্রয়োজন"); return; }
    setSaving(true); setError("");
    try {
      const body = {
        titleEn: form.titleEn, titleBn: form.titleBn, category: form.category || undefined,
        duration: form.duration || undefined, weeklyClasses: form.weeklyClasses || undefined, totalHours: form.totalHours || undefined, classType: form.classType || "offline", fee: Number(form.fee) || 0,
        descriptionEn: form.descriptionEn || undefined, descriptionBn: form.descriptionBn || undefined,
        syllabusEn: form.syllabusEn.split("\n").map((s) => s.trim()).filter(Boolean),
        syllabusBn: form.syllabusBn.split("\n").map((s) => s.trim()).filter(Boolean),
        syllabusModules: form.syllabusModules.length > 0 ? form.syllabusModules : undefined,
        image: form.image || undefined, imagePublicId: form.imagePublicId || undefined,
        isActive: form.isActive, order: Number(form.order),
      };
      if (editing) {
        const res = await api.patch<{ data: Training }>(`/training/${editing.id}`, body);
        setData((prev) => prev.map((t) => t.id === editing.id ? res.data : t));
        toast.success("প্রোগ্রাম সফলভাবে আপডেট হয়েছে!");
      } else {
        const res = await api.post<{ data: Training }>("/training", body);
        setData((prev) => [res.data, ...prev]);
        toast.success("নতুন প্রোগ্রাম সফলভাবে যোগ হয়েছে!");
      }
      setModalOpen(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "সংরক্ষণ ব্যর্থ হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => setDeleteId(id);

  const confirmDelete = async () => {
    if (!deleteId) return;
    await api.delete(`/training/${deleteId}`).catch(() => {});
    setData((prev) => prev.filter((t) => t.id !== deleteId));
    setDeleteId(null);
    toast.success("প্রোগ্রাম সফলভাবে মুছে ফেলা হয়েছে!");
  };

  const columns: Column<Training>[] = [
    { key: "titleBn", label: "শিরোনাম (বাংলা)" },
    { key: "titleEn", label: "শিরোনাম (ইংরেজি)" },
    { key: "category", label: "ক্যাটাগরি", render: (r) => <span className="text-slate-500">{r.category || "—"}</span> },
    { key: "duration", label: "সময়কাল", render: (r) => <span className="text-slate-500">{r.duration || "—"}</span> },
    { key: "fee", label: "ফি", render: (r) => r.fee > 0 ? `৳${r.fee.toLocaleString()}` : "—" },
    { key: "isActive", label: "অবস্থা", render: (r) => (
      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${r.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
        {r.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
      </span>
    )},
    { key: "createdAt", label: "তারিখ", render: (r) => formatDate(r.createdAt) },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">প্রশিক্ষণ প্রোগ্রাম</h2>
          <p className="text-sm text-slate-500">{filtered.length}টি প্রোগ্রাম (মোট {data.length}টি)</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> নতুন প্রোগ্রাম
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="শিরোনাম বা ক্যাটাগরি দিয়ে খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300" />
      </div>

      <AdminTable columns={columns} data={paginated} loading={loading} onEdit={openEdit} onDelete={handleDelete} emptyMessage="কোনো প্রোগ্রাম পাওয়া যায়নি।" />

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

      <ConfirmModal
        open={!!deleteId}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        message="এই প্রোগ্রামটি স্থায়ীভাবে মুছে যাবে। আপনি কি নিশ্চিত?"
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "প্রোগ্রাম সম্পাদনা" : "নতুন প্রোগ্রাম যোগ করুন"} width="max-w-2xl">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="শিরোনাম (ইংরেজি) *"><input required value={form.titleEn} onChange={(e) => set("titleEn", e.target.value)} className={inp} /></Field>
            <Field label="শিরোনাম (বাংলা) *"><input required value={form.titleBn} onChange={(e) => set("titleBn", e.target.value)} className={inp} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="ক্যাটাগরি"><input value={form.category} onChange={(e) => set("category", e.target.value)} className={inp} /></Field>
            <Field label="সময়কাল"><input value={form.duration} onChange={(e) => set("duration", e.target.value)} placeholder="e.g. 3 months" className={inp} /></Field>
            <Field label="ফি (টাকা)"><input type="number" min="0" value={form.fee} onChange={(e) => set("fee", e.target.value)} className={inp} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="সাপ্তাহিক ক্লাস"><input value={form.weeklyClasses} onChange={(e) => set("weeklyClasses", e.target.value)} placeholder="e.g. 3 days/week" className={inp} /></Field>
            <Field label="মোট ঘণ্টা"><input value={form.totalHours} onChange={(e) => set("totalHours", e.target.value)} placeholder="e.g. 120 hours" className={inp} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="ক্লাসের ধরন">
              <select value={form.classType} onChange={(e) => set("classType", e.target.value)} className={inp}>
                <option value="offline">অফলাইন</option>
                <option value="online">অনলাইন</option>
                <option value="both">অনলাইন ও অফলাইন</option>
              </select>
            </Field>
            <Field label="ক্রম"><input type="number" value={form.order} onChange={(e) => set("order", e.target.value)} className={inp} /></Field>
          </div>
          <Field label="বিবরণ (ইংরেজি)"><textarea rows={2} value={form.descriptionEn} onChange={(e) => set("descriptionEn", e.target.value)} className={inp} /></Field>
          <Field label="বিবরণ (বাংলা)"><textarea rows={2} value={form.descriptionBn} onChange={(e) => set("descriptionBn", e.target.value)} className={inp} /></Field>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-600">সিলেবাস মডিউল</label>
              <button type="button" onClick={() => set("syllabusModules", [...form.syllabusModules, { titleEn: "", titleBn: "", items: [""] }])}
                className="flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-900">
                <Plus size={13} /> নতুন মডিউল
              </button>
            </div>
            {form.syllabusModules.map((mod, mi) => (
              <div key={mi} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2">
                  <span className="text-xs font-bold text-slate-500 shrink-0">Module {mi + 1}</span>
                  <input value={mod.titleEn} placeholder="Module title (English)" onChange={(e) => {
                    const m = [...form.syllabusModules]; m[mi] = { ...m[mi], titleEn: e.target.value }; set("syllabusModules", m);
                  }} className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-300" />
                  <input value={mod.titleBn} placeholder="মডিউল শিরোনাম (বাংলা)" onChange={(e) => {
                    const m = [...form.syllabusModules]; m[mi] = { ...m[mi], titleBn: e.target.value }; set("syllabusModules", m);
                  }} className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-300" />
                  <button type="button" onClick={() => set("syllabusModules", form.syllabusModules.filter((_, i) => i !== mi))}>
                    <Trash2 size={14} className="text-red-400 hover:text-red-600" />
                  </button>
                </div>
                <div className="flex flex-col gap-1 p-3">
                  {mod.items.map((item, ii) => (
                    <div key={ii} className="flex items-center gap-2">
                      <span className="text-slate-300 text-xs">•</span>
                      <input value={item} placeholder="বিষয়" onChange={(e) => {
                        const m = [...form.syllabusModules];
                        const items = [...m[mi].items]; items[ii] = e.target.value;
                        m[mi] = { ...m[mi], items }; set("syllabusModules", m);
                      }} className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-300" />
                      <button type="button" onClick={() => {
                        const m = [...form.syllabusModules];
                        m[mi] = { ...m[mi], items: m[mi].items.filter((_, i) => i !== ii) };
                        set("syllabusModules", m);
                      }}><Trash2 size={12} className="text-red-300 hover:text-red-500" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => {
                    const m = [...form.syllabusModules];
                    m[mi] = { ...m[mi], items: [...m[mi].items, ""] };
                    set("syllabusModules", m);
                  }} className="mt-1 text-xs text-primary-600 hover:text-primary-800 text-left">+ আইটেম যোগ করুন</button>
                </div>
              </div>
            ))}
          </div>
          <Field label="অবস্থা">
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="h-4 w-4 accent-primary-600" />
              <span className="text-sm text-slate-700">সক্রিয়</span>
            </label>
          </Field>
          <Field label="ছবি">
            <ImageUpload value={form.image ?? undefined} onChange={(url, publicId) => { set("image", url); set("imagePublicId", publicId); }} onClear={() => { set("image", null); set("imagePublicId", null); }} />
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
