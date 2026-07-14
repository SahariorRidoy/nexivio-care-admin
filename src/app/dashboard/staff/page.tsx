"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import { assetUrl } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import ImageUpload from "@/components/ui/ImageUpload";

interface StaffMember {
  id: string;
  nameEn: string;
  nameBn: string;
  designationEn: string | null;
  designationBn: string | null;
  image: string | null;
  imagePublicId: string | null;
  pointsEn: string[];
  pointsBn: string[];
  order: number;
  isActive: boolean;
}

interface FormData {
  nameEn: string; nameBn: string;
  designationEn: string; designationBn: string;
  image: string | null; imagePublicId: string | null;
  pointsEn: string[]; pointsBn: string[];
  order: string; isActive: boolean;
}

const empty: FormData = {
  nameEn: "", nameBn: "", designationEn: "", designationBn: "",
  image: null, imagePublicId: null,
  pointsEn: ["", ""], pointsBn: ["", ""],
  order: "0", isActive: true,
};

export default function StaffPage() {
  const [data, setData] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<{ data: StaffMember[] }>("/staff/all")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openAdd = () => { setEditing(null); setForm(empty); setError(""); setModalOpen(true); };
  const openEdit = (m: StaffMember) => {
    setEditing(m);
    setForm({
      nameEn: m.nameEn, nameBn: m.nameBn,
      designationEn: m.designationEn ?? "", designationBn: m.designationBn ?? "",
      image: m.image, imagePublicId: m.imagePublicId,
      pointsEn: m.pointsEn.length ? [...m.pointsEn] : ["", ""],
      pointsBn: m.pointsBn.length ? [...m.pointsBn] : ["", ""],
      order: String(m.order), isActive: m.isActive,
    });
    setError(""); setModalOpen(true);
  };

  const set = (k: keyof FormData, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const setPoint = (lang: "pointsEn" | "pointsBn", idx: number, val: string) => {
    setForm((f) => {
      const arr = [...f[lang]];
      arr[idx] = val;
      return { ...f, [lang]: arr };
    });
  };

  const addPoint = (lang: "pointsEn" | "pointsBn") =>
    setForm((f) => ({ ...f, [lang]: [...f[lang], ""] }));

  const removePoint = (lang: "pointsEn" | "pointsBn", idx: number) =>
    setForm((f) => ({ ...f, [lang]: f[lang].filter((_, i) => i !== idx) }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameEn.trim() || !form.nameBn.trim()) { setError("বাংলা ও ইংরেজি নাম প্রয়োজন"); return; }
    setSaving(true); setError("");
    try {
      const body = {
        nameEn: form.nameEn, nameBn: form.nameBn,
        designationEn: form.designationEn || undefined,
        designationBn: form.designationBn || undefined,
        image: form.image || undefined,
        imagePublicId: form.imagePublicId || undefined,
        pointsEn: form.pointsEn.filter(Boolean),
        pointsBn: form.pointsBn.filter(Boolean),
        order: Number(form.order), isActive: form.isActive,
      };
      if (editing) {
        const res = await api.patch<{ data: StaffMember }>(`/staff/${editing.id}`, body);
        setData((prev) => prev.map((m) => m.id === editing.id ? res.data : m));
      } else {
        const res = await api.post<{ data: StaffMember }>("/staff", body);
        setData((prev) => [...prev, res.data]);
      }
      setModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "সংরক্ষণ ব্যর্থ হয়েছে");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("এই কর্মীকে মুছতে নিশ্চিত?")) return;
    await api.delete(`/staff/${id}`).catch(() => {});
    setData((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">কর্মীবৃন্দ</h2>
          <p className="text-sm text-slate-500">{data.length}জন কর্মী</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> নতুন কর্মী
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">কোনো কর্মী নেই।</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {data.map((m) => (
            <div key={m.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="aspect-[4/3] bg-slate-100">
                {m.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={assetUrl(m.image)} alt={m.nameBn} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-primary-300">
                    {m.nameBn.charAt(0)}
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="font-semibold text-slate-800 text-sm truncate">{m.nameBn}</p>
                {m.designationBn && <p className="text-xs text-slate-500 truncate">{m.designationBn}</p>}
                {m.pointsBn.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {m.pointsBn.slice(0, 2).map((p, i) => (
                      <li key={i} className="text-xs text-slate-400 flex gap-1"><span className="text-primary-500">•</span>{p}</li>
                    ))}
                  </ul>
                )}
                <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${m.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                  {m.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                </span>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => openEdit(m)} className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600">
                    <Pencil size={12} /> সম্পাদনা
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "কর্মী সম্পাদনা" : "নতুন কর্মী যোগ করুন"} width="max-w-2xl">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="নাম (ইংরেজি) *"><input required value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} className={inp} /></Field>
            <Field label="নাম (বাংলা) *"><input required value={form.nameBn} onChange={(e) => set("nameBn", e.target.value)} className={inp} /></Field>
            <Field label="পদবি (ইংরেজি)"><input value={form.designationEn} onChange={(e) => set("designationEn", e.target.value)} className={inp} /></Field>
            <Field label="পদবি (বাংলা)"><input value={form.designationBn} onChange={(e) => set("designationBn", e.target.value)} className={inp} /></Field>
          </div>

          {/* Points EN */}
          <Field label="বুলেট পয়েন্ট (ইংরেজি)">
            <div className="flex flex-col gap-2">
              {form.pointsEn.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <input value={p} onChange={(e) => setPoint("pointsEn", i, e.target.value)} placeholder={`Point ${i + 1}`} className={`${inp} flex-1`} />
                  {form.pointsEn.length > 1 && (
                    <button type="button" onClick={() => removePoint("pointsEn", i)} className="p-2 text-red-400 hover:text-red-600"><X size={14} /></button>
                  )}
                </div>
              ))}
              {form.pointsEn.length < 5 && (
                <button type="button" onClick={() => addPoint("pointsEn")} className="text-xs text-primary-600 hover:underline text-left">+ পয়েন্ট যোগ করুন</button>
              )}
            </div>
          </Field>

          {/* Points BN */}
          <Field label="বুলেট পয়েন্ট (বাংলা)">
            <div className="flex flex-col gap-2">
              {form.pointsBn.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <input value={p} onChange={(e) => setPoint("pointsBn", i, e.target.value)} placeholder={`পয়েন্ট ${i + 1}`} className={`${inp} flex-1`} />
                  {form.pointsBn.length > 1 && (
                    <button type="button" onClick={() => removePoint("pointsBn", i)} className="p-2 text-red-400 hover:text-red-600"><X size={14} /></button>
                  )}
                </div>
              ))}
              {form.pointsBn.length < 5 && (
                <button type="button" onClick={() => addPoint("pointsBn")} className="text-xs text-primary-600 hover:underline text-left">+ পয়েন্ট যোগ করুন</button>
              )}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="ক্রম"><input type="number" value={form.order} onChange={(e) => set("order", e.target.value)} className={inp} /></Field>
            <Field label="অবস্থা">
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="h-4 w-4 accent-primary-600" />
                <span className="text-sm text-slate-700">সক্রিয়</span>
              </label>
            </Field>
          </div>

          <Field label="ছবি">
            <ImageUpload
              value={form.image ?? undefined}
              onChange={(url, publicId) => { set("image", url); set("imagePublicId", publicId); }}
              onClear={() => { set("image", null); set("imagePublicId", null); }}
            />
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
