"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { formatDate, assetUrl } from "@/lib/utils";
import AdminTable, { type Column } from "@/components/ui/AdminTable";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ImageUpload from "@/components/ui/ImageUpload";

type BannerType = 'offer' | 'campaign' | 'training' | 'service';

const BANNER_TYPES: { value: BannerType; label: string }[] = [
  { value: 'offer',    label: 'Running Offer' },
  { value: 'campaign', label: 'Promotional Campaign' },
  { value: 'training', label: 'Training Announcement' },
  { value: 'service',  label: 'Care Service Promotion' },
];

interface Banner {
  id: string;
  titleEn: string;
  titleBn: string;
  subtitleEn: string | null;
  subtitleBn: string | null;
  image: string;
  imagePublicId: string | null;
  ctaLink: string | null;
  type: BannerType;
  isActive: boolean;
  order: number;
  createdAt: string;
}

interface FormData {
  titleEn: string; titleBn: string; subtitleEn: string; subtitleBn: string;
  image: string; imagePublicId: string; ctaLink: string; type: BannerType; isActive: boolean; order: string;
}

const empty: FormData = {
  titleEn: "", titleBn: "", subtitleEn: "", subtitleBn: "",
  image: "", imagePublicId: "", ctaLink: "", type: "campaign", isActive: true, order: "0",
};

const PAGE_SIZE = 10;

export default function BannersPage() {
  const [data, setData] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ data: Banner[] }>("/banners")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? data : data.filter((b) => b.titleEn.toLowerCase().includes(q) || b.titleBn.toLowerCase().includes(q));
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  useEffect(() => setPage(1), [search]);

  const openAdd = () => { setEditing(null); setForm(empty); setError(""); setModalOpen(true); };
  const openEdit = (row: Banner) => {
    setEditing(row);
    setForm({
      titleEn: row.titleEn, titleBn: row.titleBn,
      subtitleEn: row.subtitleEn ?? "", subtitleBn: row.subtitleBn ?? "",
      image: row.image, imagePublicId: row.imagePublicId ?? "",
      ctaLink: row.ctaLink ?? "", type: row.type ?? "campaign", isActive: row.isActive, order: String(row.order),
    });
    setError(""); setModalOpen(true);
  };

  const set = (k: keyof FormData, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titleEn.trim() || !form.titleBn.trim()) { setError("বাংলা ও ইংরেজি শিরোনাম প্রয়োজন"); return; }
    if (!form.image) { setError("ছবি আপলোড করুন"); return; }
    setSaving(true); setError("");
    try {
      const body = {
        titleEn: form.titleEn, titleBn: form.titleBn,
        subtitleEn: form.subtitleEn || undefined, subtitleBn: form.subtitleBn || undefined,
        image: form.image, imagePublicId: form.imagePublicId || undefined,
        ctaLink: form.ctaLink || undefined, type: form.type, isActive: form.isActive, order: Number(form.order),
      };
      if (editing) {
        const res = await api.patch<{ data: Banner }>(`/banners/${editing.id}`, body);
        setData((prev) => prev.map((b) => b.id === editing.id ? res.data : b));
        toast.success("ব্যানার সফলভাবে আপডেট হয়েছে!");
      } else {
        const res = await api.post<{ data: Banner }>("/banners", body);
        setData((prev) => [res.data, ...prev]);
        toast.success("নতুন ব্যানার সফলভাবে যোগ হয়েছে!");
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
    await api.delete(`/banners/${deleteId}`).catch(() => {});
    setData((prev) => prev.filter((b) => b.id !== deleteId));
    setDeleteId(null);
    toast.success("ব্যানার সফলভাবে মুছে ফেলা হয়েছে!");
  };

  const columns: Column<Banner>[] = [
    {
      key: "image", label: "ছবি",
      render: (r) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={assetUrl(r.image)} alt={r.titleBn} className="h-10 w-20 object-cover rounded" />
      ),
    },
    { key: "titleBn", label: "শিরোনাম (বাংলা)" },
    { key: "titleEn", label: "শিরোনাম (ইংরেজি)" },
    { key: "type", label: "ধরন", render: (r) => {
      const t = BANNER_TYPES.find((x) => x.value === r.type);
      const colors: Record<BannerType, string> = {
        offer: "bg-red-100 text-red-700",
        campaign: "bg-orange-100 text-orange-700",
        training: "bg-blue-100 text-blue-700",
        service: "bg-green-100 text-green-700",
      };
      return <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${colors[r.type] ?? "bg-slate-100 text-slate-500"}`}>{t?.label ?? r.type}</span>;
    }},
    { key: "order", label: "ক্রম" },
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
          <h2 className="text-lg font-bold text-slate-800">ব্যানার</h2>
          <p className="text-sm text-slate-500">{filtered.length}টি ব্যানার (মোট {data.length}টি)</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> নতুন ব্যানার
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="শিরোনাম দিয়ে খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300" />
      </div>

      <AdminTable columns={columns} data={paginated} loading={loading} onEdit={openEdit} onDelete={handleDelete} emptyMessage="কোনো ব্যানার পাওয়া যায়নি।" />

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
        message="এই ব্যানারটি স্থায়ীভাবে মুছে যাবে। আপনি কি নিশ্চিত?"
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "ব্যানার সম্পাদনা" : "নতুন ব্যানার যোগ করুন"} width="max-w-xl">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="শিরোনাম (ইংরেজি) *"><input required value={form.titleEn} onChange={(e) => set("titleEn", e.target.value)} className={inp} /></Field>
            <Field label="শিরোনাম (বাংলা) *"><input required value={form.titleBn} onChange={(e) => set("titleBn", e.target.value)} className={inp} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="সাবটাইটেল (ইংরেজি)"><input value={form.subtitleEn} onChange={(e) => set("subtitleEn", e.target.value)} className={inp} /></Field>
            <Field label="সাবটাইটেল (বাংলা)"><input value={form.subtitleBn} onChange={(e) => set("subtitleBn", e.target.value)} className={inp} /></Field>
          </div>
          <Field label="ব্যানার ধরন *">
            <select value={form.type} onChange={(e) => set("type", e.target.value as BannerType)} className={inp}>
              {BANNER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="CTA লিংক"><input value={form.ctaLink} onChange={(e) => set("ctaLink", e.target.value)} placeholder="https://..." className={inp} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="ক্রম"><input type="number" value={form.order} onChange={(e) => set("order", e.target.value)} className={inp} /></Field>
            <Field label="অবস্থা">
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="h-4 w-4 accent-primary-600" />
                <span className="text-sm text-slate-700">সক্রিয়</span>
              </label>
            </Field>
          </div>
          <Field label="ব্যানার ছবি *">
            <ImageUpload value={form.image || undefined} onChange={(url, publicId) => { set("image", url); set("imagePublicId", publicId); }} onClear={() => { set("image", ""); set("imagePublicId", ""); }} />
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
const inp = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300";
