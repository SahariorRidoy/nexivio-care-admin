"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import AdminTable, { type Column } from "@/components/ui/AdminTable";
import Modal from "@/components/ui/Modal";
import ImageUpload from "@/components/ui/ImageUpload";

interface ServicePackage {
  tier: "basic" | "standard" | "premium";
  nameEn: string;
  nameBn: string;
  dutyHours: number;
  dailyPrice: number;
  weeklyPrice: number;
  monthlyPrice: number;
  includedFeatures: string[];
}

interface OtherService {
  id: string;
  nameEn: string;
  nameBn: string;
  category: string | null;
  shortDescEn: string | null;
  shortDescBn: string | null;
  descriptionEn: string | null;
  descriptionBn: string | null;
  image: string | null;
  imagePublicId: string | null;
  icon: string | null;
  featuresEn: string[];
  featuresBn: string[];
  isActive: boolean;
  order: number;
  packages: ServicePackage[] | null;
  createdAt: string;
}

const DEFAULT_PACKAGES: ServicePackage[] = [
  { tier: "basic",    nameEn: "Basic",    nameBn: "বেসিক",        dutyHours: 8,  dailyPrice: 0, weeklyPrice: 0, monthlyPrice: 0, includedFeatures: [] },
  { tier: "standard", nameEn: "Standard", nameBn: "স্ট্যান্ডার্ড", dutyHours: 12, dailyPrice: 0, weeklyPrice: 0, monthlyPrice: 0, includedFeatures: [] },
  { tier: "premium",  nameEn: "Premium",  nameBn: "প্রিমিয়াম",    dutyHours: 24, dailyPrice: 0, weeklyPrice: 0, monthlyPrice: 0, includedFeatures: [] },
];

type FormData = {
  nameEn: string; nameBn: string; category: string;
  shortDescEn: string; shortDescBn: string;
  descriptionEn: string; descriptionBn: string;
  image: string | null; imagePublicId: string | null;
  isActive: boolean; order: number;
  featuresEn: string[];
  featuresBn: string[];
  packages: ServicePackage[];
};

const empty: FormData = {
  nameEn: "", nameBn: "", category: "", shortDescEn: "", shortDescBn: "",
  descriptionEn: "", descriptionBn: "",
  image: null, imagePublicId: null,
  isActive: true, order: 0,
  featuresEn: [],
  featuresBn: [],
  packages: DEFAULT_PACKAGES.map((p) => ({ ...p })),
};

const PAGE_SIZE = 10;
const TIERS = ["basic", "standard", "premium"] as const;
const TIER_LABELS = { basic: "বেসিক", standard: "স্ট্যান্ডার্ড", premium: "প্রিমিয়াম" };

export default function OtherServicesPage() {
  const [data, setData] = useState<OtherService[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<OtherService | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"info" | "features" | "basic" | "standard" | "premium">("info");

  useEffect(() => {
    api.get<{ data: OtherService[] }>("/other-services")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? data : data.filter((s) => s.nameEn.toLowerCase().includes(q) || s.nameBn.toLowerCase().includes(q));
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  useEffect(() => setPage(1), [search]);

  const openAdd = () => { setEditing(null); setForm(empty); setError(""); setActiveTab("info"); setModalOpen(true); };
  const openEdit = (row: OtherService) => {
    setEditing(row);
    setForm({
      nameEn: row.nameEn, nameBn: row.nameBn, category: row.category ?? "",
      shortDescEn: row.shortDescEn ?? "", shortDescBn: row.shortDescBn ?? "",
      descriptionEn: row.descriptionEn ?? "", descriptionBn: row.descriptionBn ?? "",
      image: row.image, imagePublicId: row.imagePublicId,
      isActive: row.isActive, order: row.order,
      featuresEn: row.featuresEn ?? [],
      featuresBn: row.featuresBn ?? [],
      packages: row.packages && row.packages.length === 3 ? row.packages : DEFAULT_PACKAGES.map((p) => ({ ...p })),
    });
    setError(""); setActiveTab("info"); setModalOpen(true);
  };

  const set = (k: keyof FormData, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const addFeature = () => setForm((f) => ({ ...f, featuresEn: [...f.featuresEn, ""], featuresBn: [...f.featuresBn, ""] }));
  const setFeatureEn = (i: number, val: string) =>
    setForm((f) => ({ ...f, featuresEn: f.featuresEn.map((x, j) => j === i ? val : x) }));
  const setFeatureBn = (i: number, val: string) =>
    setForm((f) => ({ ...f, featuresBn: f.featuresBn.map((x, j) => j === i ? val : x) }));
  const removeFeature = (i: number) =>
    setForm((f) => {
      const removed = f.featuresEn[i];
      return {
        ...f,
        featuresEn: f.featuresEn.filter((_, j) => j !== i),
        featuresBn: f.featuresBn.filter((_, j) => j !== i),
        packages: f.packages.map((p) => ({
          ...p,
          includedFeatures: p.includedFeatures.filter((x) => x !== removed),
        })),
      };
    });

  const setPkg = (tier: ServicePackage["tier"], k: keyof ServicePackage, v: unknown) =>
    setForm((f) => ({ ...f, packages: f.packages.map((p) => p.tier === tier ? { ...p, [k]: v } : p) }));

  const toggleFeature = (tier: ServicePackage["tier"], feature: string) =>
    setForm((f) => ({
      ...f,
      packages: f.packages.map((p) => {
        if (p.tier !== tier) return p;
        const has = p.includedFeatures.includes(feature);
        return { ...p, includedFeatures: has ? p.includedFeatures.filter((x) => x !== feature) : [...p.includedFeatures, feature] };
      }),
    }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameEn.trim() || !form.nameBn.trim()) { setError("বাংলা ও ইংরেজি নাম প্রয়োজন"); return; }
    setSaving(true); setError("");
    try {
      const body = { ...form, order: Number(form.order) };
      if (editing) {
        const res = await api.patch<{ data: OtherService }>(`/other-services/${editing.id}`, body);
        setData((prev) => prev.map((s) => s.id === editing.id ? res.data : s));
      } else {
        const res = await api.post<{ data: OtherService }>("/other-services", body);
        setData((prev) => [res.data, ...prev]);
      }
      setModalOpen(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "সংরক্ষণ ব্যর্থ হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/other-services/${id}`).catch(() => {});
    setData((prev) => prev.filter((s) => s.id !== id));
  };

  const columns: Column<OtherService>[] = [
    { key: "nameBn", label: "নাম (বাংলা)" },
    { key: "nameEn", label: "নাম (ইংরেজি)" },
    { key: "order", label: "ক্রম" },
    {
      key: "isActive", label: "অবস্থা",
      render: (r) => (
        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${r.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
          {r.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
        </span>
      ),
    },
    { key: "createdAt", label: "তারিখ", render: (r) => formatDate(r.createdAt) },
  ];

  const TABS = [
    { key: "info", label: "তথ্য" },
    { key: "features", label: "ফিচার লিস্ট" },
    ...TIERS.map((t) => ({ key: t, label: TIER_LABELS[t] })),
  ] as const;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">অন্যান্য সেবাসমূহ</h2>
          <p className="text-sm text-slate-500">{filtered.length}টি সেবা (মোট {data.length}টি)</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> নতুন সেবা
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="নাম দিয়ে খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300" />
      </div>

      <AdminTable columns={columns} data={paginated} loading={loading} onEdit={openEdit} onDelete={handleDelete} emptyMessage="কোনো সেবা পাওয়া যায়নি।" />

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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "সেবা সম্পাদনা" : "নতুন অন্যান্য সেবা যোগ করুন"} width="max-w-3xl">
        <form onSubmit={handleSave} className="flex flex-col gap-0">

          {/* Tabs */}
          <div className="flex gap-0 border-b border-slate-200 mb-5 overflow-x-auto">
            {TABS.map((tab) => (
              <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.key ? "border-primary-600 text-primary-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: Info */}
          {activeTab === "info" && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="নাম (ইংরেজি) *"><input required value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} className={inp} /></Field>
                <Field label="নাম (বাংলা) *"><input required value={form.nameBn} onChange={(e) => set("nameBn", e.target.value)} className={inp} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="সংক্ষিপ্ত বিবরণ (ইংরেজি)"><textarea rows={2} value={form.shortDescEn} onChange={(e) => set("shortDescEn", e.target.value)} className={inp} /></Field>
                <Field label="সংক্ষিপ্ত বিবরণ (বাংলা)"><textarea rows={2} value={form.shortDescBn} onChange={(e) => set("shortDescBn", e.target.value)} className={inp} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="বিস্তারিত বিবরণ (ইংরেজি)"><textarea rows={4} value={form.descriptionEn} onChange={(e) => set("descriptionEn", e.target.value)} className={inp} /></Field>
                <Field label="বিস্তারিত বিবরণ (বাংলা)"><textarea rows={4} value={form.descriptionBn} onChange={(e) => set("descriptionBn", e.target.value)} className={inp} /></Field>
              </div>
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
            </div>
          )}

          {/* Tab: Master Features */}
          {activeTab === "features" && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-slate-500">এখানে সব ফিচার একবার যোগ করুন (EN + BN)। তারপর প্রতিটি প্যাকেজ ট্যাবে গিয়ে টিক দিন।</p>
              <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-500 px-1">
                <span>ইংরেজি</span><span>বাংলা</span>
              </div>
              {form.featuresEn.map((f, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={f} onChange={(e) => setFeatureEn(i, e.target.value)} placeholder={`Feature ${i + 1}`} className={inp} />
                  <input value={form.featuresBn[i] ?? ""} onChange={(e) => setFeatureBn(i, e.target.value)} placeholder={`ফিচার ${i + 1}`} className={inp} />
                  <button type="button" onClick={() => removeFeature(i)} className="text-red-400 hover:text-red-600 shrink-0"><Trash2 size={15} /></button>
                </div>
              ))}
              {form.featuresEn.length === 0 && <p className="text-xs text-slate-400 italic">কোনো ফিচার নেই।</p>}
              <button type="button" onClick={addFeature} className="self-start text-sm text-primary-600 hover:underline flex items-center gap-1 mt-1">
                <Plus size={14} /> ফিচার যোগ করুন
              </button>
            </div>
          )}

          {/* Tabs: Package tiers */}
          {TIERS.includes(activeTab as ServicePackage["tier"]) && (() => {
            const tier = activeTab as ServicePackage["tier"];
            const pkg = form.packages.find((p) => p.tier === tier)!;
            return (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="নাম (ইংরেজি)"><input value={pkg.nameEn} onChange={(e) => setPkg(tier, "nameEn", e.target.value)} className={inp} /></Field>
                  <Field label="নাম (বাংলা)"><input value={pkg.nameBn} onChange={(e) => setPkg(tier, "nameBn", e.target.value)} className={inp} /></Field>
                </div>
                <Field label="ডিউটি আওয়ার (ঘণ্টা/দিন)">
                  <input type="number" value={pkg.dutyHours} onChange={(e) => setPkg(tier, "dutyHours", Number(e.target.value))} className={inp} />
                </Field>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="দৈনিক মূল্য (৳)"><input type="number" value={pkg.dailyPrice} onChange={(e) => setPkg(tier, "dailyPrice", Number(e.target.value))} className={inp} /></Field>
                  <Field label="সাপ্তাহিক মূল্য (৳)"><input type="number" value={pkg.weeklyPrice} onChange={(e) => setPkg(tier, "weeklyPrice", Number(e.target.value))} className={inp} /></Field>
                  <Field label="মাসিক মূল্য (৳)"><input type="number" value={pkg.monthlyPrice} onChange={(e) => setPkg(tier, "monthlyPrice", Number(e.target.value))} className={inp} /></Field>
                </div>

                {/* Feature checkboxes */}
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-2">এই প্যাকেজে কোন ফিচারগুলো আছে?</p>
                  {form.featuresEn.length === 0
                    ? <p className="text-xs text-slate-400 italic">আগে &quot;ফিচার লিস্ট&quot; ট্যাবে ফিচার যোগ করুন।</p>
                    : (
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-3 cursor-pointer pb-2 mb-1 border-b border-slate-100">
                          <input
                            type="checkbox"
                            checked={pkg.includedFeatures.length === form.featuresEn.length}
                            onChange={() => {
                              const allSelected = pkg.includedFeatures.length === form.featuresEn.length;
                              setPkg(tier, "includedFeatures", allSelected ? [] : [...form.featuresEn]);
                            }}
                            className="h-4 w-4 accent-primary-600"
                          />
                          <span className="text-sm font-semibold text-slate-700">সব সিলেক্ট করুন</span>
                        </label>
                        {form.featuresEn.map((f, i) => (
                          <label key={i} className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={pkg.includedFeatures.includes(f)}
                              onChange={() => toggleFeature(tier, f)}
                              className="h-4 w-4 accent-primary-600"
                            />
                            <span className={`text-sm ${pkg.includedFeatures.includes(f) ? "text-slate-800 font-medium" : "text-slate-400"}`}>
                              {f || `Feature ${i + 1}`}{form.featuresBn[i] ? ` / ${form.featuresBn[i]}` : ""}
                            </span>
                          </label>
                        ))}
                      </div>
                    )
                  }
                </div>
              </div>
            );
          })()}

          {error && <p className="text-sm text-red-500 mt-4">{error}</p>}
          <div className="flex justify-end gap-3 pt-5 mt-2 border-t border-slate-100">
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
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}
const inp = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none";
