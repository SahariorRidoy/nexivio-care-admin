"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { assetUrl } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ImageUpload from "@/components/ui/ImageUpload";
import VideoUpload from "@/components/ui/VideoUpload";

interface GalleryItem {
  id: string;
  url: string;
  urlPublicId: string | null;
  titleEn: string | null;
  titleBn: string | null;
  type: string;
  order: number;
}

interface FormData {
  url: string; urlPublicId: string; titleEn: string; titleBn: string; type: string; order: string;
}

const empty: FormData = { url: "", urlPublicId: "", titleEn: "", titleBn: "", type: "photo", order: "0" };
const typeLabel: Record<string, string> = { photo: "ছবি", video: "ভিডিও", event: "ইভেন্ট" };

export default function GalleryPage() {
  const [data, setData] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ data: GalleryItem[] }>("/gallery")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openAdd = () => { setEditing(null); setForm(empty); setError(""); setModalOpen(true); };
  const openEdit = (item: GalleryItem) => {
    setEditing(item);
    setForm({ url: item.url, urlPublicId: item.urlPublicId ?? "", titleEn: item.titleEn ?? "", titleBn: item.titleBn ?? "", type: item.type, order: String(item.order) });
    setError(""); setModalOpen(true);
  };

  const set = (k: keyof FormData, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.url) { setError(form.type === "video" ? "ভিডিও আপলোড করুন" : "ছবি আপলোড করুন"); return; }
    setSaving(true); setError("");
    try {
      const body = {
        url: form.url, urlPublicId: form.urlPublicId || undefined,
        titleEn: form.titleEn || undefined, titleBn: form.titleBn || undefined,
        type: form.type, order: Number(form.order),
      };
      if (editing) {
        const res = await api.patch<{ data: GalleryItem }>(`/gallery/${editing.id}`, body);
        setData((prev) => prev.map((g) => g.id === editing.id ? res.data : g));
        toast.success("গ্যালারি আইটেম সফলভাবে আপডেট হয়েছে!");
      } else {
        const res = await api.post<{ data: GalleryItem }>("/gallery", body);
        setData((prev) => [res.data, ...prev]);
        toast.success("নতুন আইটেম সফলভাবে যোগ হয়েছে!");
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
    await api.delete(`/gallery/${deleteId}`).catch(() => {});
    setData((prev) => prev.filter((g) => g.id !== deleteId));
    setDeleteId(null);
    toast.success("গ্যালারি আইটেম সফলভাবে মুছে ফেলা হয়েছে!");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">গ্যালারি</h2>
          <p className="text-sm text-slate-500">{data.length}টি আইটেম</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> ছবি যোগ করুন
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">কোনো গ্যালারি আইটেম নেই।</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {data.map((item) => (
            <div key={item.id} className="relative group rounded-xl overflow-hidden border border-slate-100 shadow-sm aspect-square bg-slate-100">
              {item.type === "video" ? (
                <video src={assetUrl(item.url)} className="w-full h-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={assetUrl(item.url)} alt={item.titleBn ?? ""} className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                {item.titleBn && <p className="text-white text-xs text-center font-medium line-clamp-2">{item.titleBn}</p>}
                <span className="text-white text-xs bg-black/40 px-2 py-0.5 rounded">{typeLabel[item.type] ?? item.type}</span>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(item)} className="p-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        message="এই আইটেমটি স্থায়ীভাবে মুছে যাবে। আপনি কি নিশ্চিত?"
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "গ্যালারি সম্পাদনা" : "নতুন ছবি যোগ করুন"} width="max-w-md">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Field label={form.type === "video" ? "ভিডিও *" : "ছবি *"}>
            {form.type === "video" ? (
              <VideoUpload value={form.url || undefined} onChange={(url, publicId) => { set("url", url); set("urlPublicId", publicId); }} onClear={() => { set("url", ""); set("urlPublicId", ""); }} />
            ) : (
              <ImageUpload value={form.url || undefined} onChange={(url, publicId) => { set("url", url); set("urlPublicId", publicId); }} onClear={() => { set("url", ""); set("urlPublicId", ""); }} />
            )}
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="শিরোনাম (ইংরেজি)"><input value={form.titleEn} onChange={(e) => set("titleEn", e.target.value)} className={inp} /></Field>
            <Field label="শিরোনাম (বাংলা)"><input value={form.titleBn} onChange={(e) => set("titleBn", e.target.value)} className={inp} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="ধরন">
              <select value={form.type} onChange={(e) => { set("type", e.target.value); set("url", ""); set("urlPublicId", ""); }} className={inp}>
                <option value="photo">ছবি</option>
                <option value="video">ভিডিও</option>
                <option value="event">ইভেন্ট</option>
              </select>
            </Field>
            <Field label="ক্রম"><input type="number" value={form.order} onChange={(e) => set("order", e.target.value)} className={inp} /></Field>
          </div>
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
