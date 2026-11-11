"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Phone, Share2, Palette, Plug, PenLine, Check } from "lucide-react";
import { api } from "@/lib/api";
import ImageUpload from "@/components/ui/ImageUpload";

interface Settings {
  phone: string | null;
  phone2: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  businessHours: string | null;
  mapEmbedUrl: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  linkedinUrl: string | null;
  instagramUrl: string | null;
  messengerUrl: string | null;
  logoUrl: string | null;
  logoPublicId: string | null;
  qrImageUrl: string | null;
  qrPublicId: string | null;
  visitingCardUrl: string | null;
  visitingCardPublicId: string | null;
  signatureUrl: string | null;
  signaturePublicId: string | null;
  bkashBaseUrl: string | null;
  bkashAppKey: string | null;
  bkashAppSecret: string | null;
  bkashUsername: string | null;
  bkashPassword: string | null;
  smsProvider: string | null;
  smsApiKey: string | null;
  smsSenderId: string | null;
  smsSignature: string | null;
}

const empty: Settings = {
  phone: "", phone2: "", whatsapp: "", email: "", address: "", businessHours: "",
  mapEmbedUrl: "", facebookUrl: "", youtubeUrl: "", linkedinUrl: "",
  instagramUrl: "", messengerUrl: "", logoUrl: null, logoPublicId: null,
  qrImageUrl: null, qrPublicId: null,
  visitingCardUrl: null, visitingCardPublicId: null,
  signatureUrl: null, signaturePublicId: null,
  bkashBaseUrl: "https://tokenized.sandbox.bka.sh/v1.2.0-beta",
  bkashAppKey: "", bkashAppSecret: "", bkashUsername: "", bkashPassword: "",
  smsProvider: "bdbulksms", smsApiKey: "", smsSenderId: "", smsSignature: "",
};

type TabKey = "contact" | "social" | "branding" | "integrations";

const TABS: { key: TabKey; label: string; hint: string; icon: typeof Phone }[] = [
  { key: "contact", label: "যোগাযোগ তথ্য", hint: "ফোন, ইমেইল ও ঠিকানা", icon: Phone },
  { key: "social", label: "সোশ্যাল মিডিয়া", hint: "প্রোফাইল লিংকসমূহ", icon: Share2 },
  { key: "branding", label: "ব্র্যান্ডিং ও অ্যাসেট", hint: "লোগো, QR ও স্বাক্ষর", icon: Palette },
  { key: "integrations", label: "ইন্টিগ্রেশন", hint: "bKash ও SMS গেটওয়ে", icon: Plug },
];

export default function SettingsPage() {
  const [form, setForm] = useState<Settings>(empty);
  const [tab, setTab] = useState<TabKey>("contact");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<{ data: Settings }>("/settings/admin")
      .then((r) => setForm({ ...empty, ...r.data }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (k: keyof Settings, v: string | null) =>
    setForm((f) => ({ ...f, [k]: v }));

  /** Assets save immediately so an upload is never lost to an unsaved form. */
  const saveAsset = async (patch: Partial<Settings>, message?: string) => {
    setForm((f) => ({ ...f, ...patch }));
    try {
      await api.patch("/settings", { ...form, ...patch });
      if (message) toast.success(message);
    } catch {
      toast.error("সংরক্ষণ ব্যর্থ হয়েছে");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await api.patch("/settings", form);
      toast.success("সেটিংস সফলভাবে সংরক্ষিত হয়েছে!");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "সংরক্ষণ ব্যর্থ হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-800">সাইট সেটিংস</h2>
        <p className="text-sm text-slate-500">যোগাযোগ তথ্য, সোশ্যাল মিডিয়া ও ব্র্যান্ডিং পরিচালনা করুন</p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Tab nav */}
        <nav className="lg:w-60 w-full shrink-0 flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
          {TABS.map(({ key, label, hint, icon: Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left whitespace-nowrap lg:whitespace-normal transition-colors ${
                  active ? "bg-primary-50 ring-1 ring-primary-200" : "hover:bg-slate-50"
                }`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  active ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-500 group-hover:text-slate-700"
                }`}>
                  <Icon size={15} />
                </span>
                <span className="min-w-0">
                  <span className={`block text-sm font-semibold ${active ? "text-primary-800" : "text-slate-700"}`}>{label}</span>
                  <span className="hidden lg:block text-[11px] text-slate-400 truncate">{hint}</span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* Panels */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          {tab === "contact" && (
            <Section title="যোগাযোগ তথ্য">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="ফোন নম্বর ১">
                  <input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} className={inp} placeholder="01700-000000" />
                </Field>
                <Field label="ফোন নম্বর ২">
                  <input value={form.phone2 ?? ""} onChange={(e) => set("phone2", e.target.value)} className={inp} placeholder="01800-000000" />
                </Field>
                <Field label="WhatsApp নম্বর">
                  <input value={form.whatsapp ?? ""} onChange={(e) => set("whatsapp", e.target.value)} className={inp} placeholder="01700000000" />
                </Field>
                <Field label="ইমেইল">
                  <input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} className={inp} />
                </Field>
                <Field label="ব্যবসার সময়" className="sm:col-span-2">
                  <input value={form.businessHours ?? ""} onChange={(e) => set("businessHours", e.target.value)} className={inp} placeholder="সকাল ৯টা – রাত ৯টা" />
                </Field>
              </div>
              <Field label="ঠিকানা">
                <textarea rows={2} value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} className={inp} />
              </Field>
              <Field label="Google Maps Embed URL">
                <input value={form.mapEmbedUrl ?? ""} onChange={(e) => set("mapEmbedUrl", e.target.value)} className={inp} placeholder="https://www.google.com/maps/embed?..." />
              </Field>
            </Section>
          )}

          {tab === "social" && (
            <Section title="সোশ্যাল মিডিয়া লিংক">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Facebook URL">
                  <input value={form.facebookUrl ?? ""} onChange={(e) => set("facebookUrl", e.target.value)} className={inp} placeholder="https://facebook.com/..." />
                </Field>
                <Field label="YouTube URL">
                  <input value={form.youtubeUrl ?? ""} onChange={(e) => set("youtubeUrl", e.target.value)} className={inp} placeholder="https://youtube.com/..." />
                </Field>
                <Field label="LinkedIn URL">
                  <input value={form.linkedinUrl ?? ""} onChange={(e) => set("linkedinUrl", e.target.value)} className={inp} placeholder="https://linkedin.com/..." />
                </Field>
                <Field label="Instagram URL">
                  <input value={form.instagramUrl ?? ""} onChange={(e) => set("instagramUrl", e.target.value)} className={inp} placeholder="https://instagram.com/..." />
                </Field>
                <Field label="Messenger URL" className="sm:col-span-2">
                  <input value={form.messengerUrl ?? ""} onChange={(e) => set("messengerUrl", e.target.value)} className={inp} placeholder="https://m.me/..." />
                </Field>
              </div>
            </Section>
          )}

          {tab === "branding" && (
            <>
              <Section title="লোগো ও QR কোড">
                <div className="grid sm:grid-cols-2 gap-6">
                  <Field label="লোগো">
                    <ImageUpload
                      value={form.logoUrl ?? undefined}
                      contain
                      onChange={(url, publicId) => saveAsset({ logoUrl: url, logoPublicId: publicId }, "লোগো সংরক্ষিত হয়েছে!")}
                      onClear={() => saveAsset({ logoUrl: null, logoPublicId: null })}
                    />
                  </Field>
                  <Field label="QR কোড">
                    <ImageUpload
                      value={form.qrImageUrl ?? undefined}
                      contain
                      onChange={(url, publicId) => saveAsset({ qrImageUrl: url, qrPublicId: publicId }, "QR কোড সংরক্ষিত হয়েছে!")}
                      onClear={() => saveAsset({ qrImageUrl: null, qrPublicId: null })}
                    />
                  </Field>
                </div>
              </Section>

              {/* Authorized signature */}
              <Section title="অনুমোদিত স্বাক্ষর" icon={PenLine}>
                <p className="text-xs text-slate-500">
                  এই স্বাক্ষরটি <strong className="font-semibold text-slate-700">রিসিট ও ইনভয়েস</strong>-এর &ldquo;Authorized Signature&rdquo; অংশে স্বয়ংক্রিয়ভাবে বসবে।
                  স্বচ্ছ ব্যাকগ্রাউন্ডের PNG ছবি ব্যবহার করলে প্রিন্টে সবচেয়ে ভালো দেখাবে।
                </p>
                <Field label="স্বাক্ষরের ছবি">
                  <ImageUpload
                    value={form.signatureUrl ?? undefined}
                    contain
                    label="স্বাক্ষর আপলোড করুন"
                    onChange={(url, publicId) => saveAsset({ signatureUrl: url, signaturePublicId: publicId }, "স্বাক্ষর সংরক্ষিত হয়েছে!")}
                    onClear={() => saveAsset({ signatureUrl: null, signaturePublicId: null })}
                  />
                </Field>
                {form.signatureUrl && (
                  <p className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700">
                    <Check size={13} /> রিসিট ও ইনভয়েসে এই স্বাক্ষর ব্যবহার হচ্ছে
                  </p>
                )}
              </Section>

              <Section title="ভিজিটিং কার্ড">
                <p className="text-xs text-slate-500">এখানে আপলোড করা ছবি ফ্রন্টেন্ডের Contact পেজ থেকে গ্রাহকরা ডাউনলোড করতে পারবেন।</p>
                <Field label="ভিজিটিং কার্ড (Image)">
                  <ImageUpload
                    value={form.visitingCardUrl ?? undefined}
                    label="ভিজিটিং কার্ড আপলোড করুন"
                    onChange={(url, publicId) => saveAsset({ visitingCardUrl: url, visitingCardPublicId: publicId }, "ভিজিটিং কার্ড সংরক্ষিত হয়েছে!")}
                    onClear={() => saveAsset({ visitingCardUrl: null, visitingCardPublicId: null })}
                  />
                </Field>
                {form.visitingCardUrl && (
                  <a href={form.visitingCardUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-primary-600 hover:underline font-medium">
                    🪪 বর্তমান কার্ড দেখুন
                  </a>
                )}
              </Section>
            </>
          )}

          {tab === "integrations" && (
            <>
              <Section title="bKash পেমেন্ট গেটওয়ে">
                <p className="text-xs text-slate-500">Sandbox: <code>https://tokenized.sandbox.bka.sh/v1.2.0-beta</code> — Production: <code>https://tokenized.pay.bka.sh/v1.2.0-beta</code></p>
                <Field label="Base URL">
                  <input value={form.bkashBaseUrl ?? ""} onChange={(e) => set("bkashBaseUrl", e.target.value)} className={inp} placeholder="https://tokenized.sandbox.bka.sh/v1.2.0-beta" />
                </Field>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="App Key">
                    <input value={form.bkashAppKey ?? ""} onChange={(e) => set("bkashAppKey", e.target.value)} className={inp} />
                  </Field>
                  <Field label="App Secret">
                    <input type="password" value={form.bkashAppSecret ?? ""} onChange={(e) => set("bkashAppSecret", e.target.value)} className={inp} />
                  </Field>
                  <Field label="Username">
                    <input value={form.bkashUsername ?? ""} onChange={(e) => set("bkashUsername", e.target.value)} className={inp} />
                  </Field>
                  <Field label="Password">
                    <input type="password" value={form.bkashPassword ?? ""} onChange={(e) => set("bkashPassword", e.target.value)} className={inp} />
                  </Field>
                </div>
              </Section>

              <Section title="SMS গেটওয়ে (Masking SMS)">
                <p className="text-xs text-slate-500">Masking SMS-এ প্রাপক আপনার অনুমোদিত Sender ID (যেমন NEXIVIO) দেখতে পাবেন। Sender ID প্রোভাইডার থেকে অনুমোদিত হতে হবে। সংরক্ষণের পর <a href="/dashboard/sms" className="underline text-primary-600">SMS পেজে</a> ব্যালেন্স চেক করে সংযোগ যাচাই করুন।</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="প্রোভাইডার">
                    <select value={form.smsProvider ?? "bdbulksms"} onChange={(e) => set("smsProvider", e.target.value)} className={inp}>
                      <option value="bdbulksms">BDBulkSMS (api.bdbulksms.net — token)</option>
                      <option value="bulksmsbd">BulkSMSBD (bulksmsbd.net — api_key + senderid)</option>
                      <option value="legacy">Legacy (পূর্বের ইন্টিগ্রেশন)</option>
                    </select>
                  </Field>
                  <Field label="API Token / Key">
                    <input type="password" value={form.smsApiKey ?? ""} onChange={(e) => set("smsApiKey", e.target.value)} className={inp} placeholder="Provider API token" />
                  </Field>
                  <Field label="Masking Sender ID">
                    <input value={form.smsSenderId ?? ""} onChange={(e) => set("smsSenderId", e.target.value)} className={inp} placeholder="e.g. NEXIVIO" />
                  </Field>
                  <Field label="সিগনেচার (ঐচ্ছিক — প্রতিটি SMS-এর শেষে যুক্ত হবে)">
                    <input value={form.smsSignature ?? ""} onChange={(e) => set("smsSignature", e.target.value)} className={inp} placeholder="- Nexivio Care" />
                  </Field>
                </div>
              </Section>
            </>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex items-center justify-between gap-4 pb-8">
            <p className="text-xs text-slate-400">ছবি আপলোড সঙ্গে সঙ্গে সংরক্ষিত হয়; অন্যান্য তথ্যের জন্য সংরক্ষণ করুন।</p>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-primary-700 text-white hover:bg-primary-800 disabled:opacity-60 transition-colors shrink-0"
            >
              {saving ? "সংরক্ষণ হচ্ছে..." : "সেটিংস সংরক্ষণ করুন"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon?: typeof Phone }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
        {Icon && <Icon size={14} className="text-primary-600" />}
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </div>
      <div className="p-5 flex flex-col gap-4">{children}</div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <label className="text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}

const inp = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none";
