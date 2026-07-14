"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import ImageUpload from "@/components/ui/ImageUpload";

interface Settings {
  phone: string | null;
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
  missionEn: string | null;
  missionBn: string | null;
  visionEn: string | null;
  visionBn: string | null;
  bkashBaseUrl: string | null;
  bkashAppKey: string | null;
  bkashAppSecret: string | null;
  bkashUsername: string | null;
  bkashPassword: string | null;
  smsApiKey: string | null;
  smsSenderId: string | null;
}

const empty: Settings = {
  phone: "", whatsapp: "", email: "", address: "", businessHours: "",
  mapEmbedUrl: "", facebookUrl: "", youtubeUrl: "", linkedinUrl: "",
  instagramUrl: "", messengerUrl: "", logoUrl: null, logoPublicId: null,
  qrImageUrl: null, qrPublicId: null, missionEn: "", missionBn: "",
  visionEn: "", visionBn: "",
  bkashBaseUrl: "https://tokenized.sandbox.bka.sh/v1.2.0-beta",
  bkashAppKey: "", bkashAppSecret: "", bkashUsername: "", bkashPassword: "",
  smsApiKey: "", smsSenderId: "",
};

export default function SettingsPage() {
  const [form, setForm] = useState<Settings>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<{ data: Settings }>("/settings")
      .then((r) => setForm({ ...empty, ...r.data }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (k: keyof Settings, v: string | null) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess(false);
    try {
      await api.patch("/settings", form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
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
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-800">সাইট সেটিংস</h2>
        <p className="text-sm text-slate-500">যোগাযোগ তথ্য, সোশ্যাল মিডিয়া ও ব্র্যান্ডিং পরিচালনা করুন</p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-8">

        {/* Contact Info */}
        <Section title="যোগাযোগ তথ্য">
          <div className="grid grid-cols-2 gap-4">
            <Field label="ফোন নম্বর">
              <input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} className={inp} placeholder="01700-000000" />
            </Field>
            <Field label="WhatsApp নম্বর">
              <input value={form.whatsapp ?? ""} onChange={(e) => set("whatsapp", e.target.value)} className={inp} placeholder="01700000000" />
            </Field>
            <Field label="ইমেইল">
              <input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} className={inp} />
            </Field>
            <Field label="ব্যবসার সময়">
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

        {/* Social Media */}
        <Section title="সোশ্যাল মিডিয়া লিংক">
          <div className="grid grid-cols-2 gap-4">
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
            <Field label="Messenger URL" className="col-span-2">
              <input value={form.messengerUrl ?? ""} onChange={(e) => set("messengerUrl", e.target.value)} className={inp} placeholder="https://m.me/..." />
            </Field>
          </div>
        </Section>

        {/* Branding */}
        <Section title="ব্র্যান্ডিং">
          <div className="grid grid-cols-2 gap-6">
            <Field label="লোগো">
              <ImageUpload
                value={form.logoUrl ?? undefined}
                onChange={(url, publicId) => { set("logoUrl", url); set("logoPublicId", publicId); }}
                onClear={() => { set("logoUrl", null); set("logoPublicId", null); }}
              />
            </Field>
            <Field label="QR কোড">
              <ImageUpload
                value={form.qrImageUrl ?? undefined}
                onChange={(url, publicId) => { set("qrImageUrl", url); set("qrPublicId", publicId); }}
                onClear={() => { set("qrImageUrl", null); set("qrPublicId", null); }}
              />
            </Field>
          </div>
        </Section>

        {/* Mission & Vision */}
        <Section title="মিশন ও ভিশন">
          <div className="grid grid-cols-2 gap-4">
            <Field label="মিশন (ইংরেজি)">
              <textarea rows={3} value={form.missionEn ?? ""} onChange={(e) => set("missionEn", e.target.value)} className={inp} />
            </Field>
            <Field label="মিশন (বাংলা)">
              <textarea rows={3} value={form.missionBn ?? ""} onChange={(e) => set("missionBn", e.target.value)} className={inp} />
            </Field>
            <Field label="ভিশন (ইংরেজি)">
              <textarea rows={3} value={form.visionEn ?? ""} onChange={(e) => set("visionEn", e.target.value)} className={inp} />
            </Field>
            <Field label="ভিশন (বাংলা)">
              <textarea rows={3} value={form.visionBn ?? ""} onChange={(e) => set("visionBn", e.target.value)} className={inp} />
            </Field>
          </div>
        </Section>

        {/* bKash Payment Gateway */}
        <Section title="bKash পেমেন্ট গেটওয়ে">
          <p className="text-xs text-slate-500">Sandbox: <code>https://tokenized.sandbox.bka.sh/v1.2.0-beta</code> — Production: <code>https://tokenized.pay.bka.sh/v1.2.0-beta</code></p>
          <Field label="Base URL">
            <input value={form.bkashBaseUrl ?? ""} onChange={(e) => set("bkashBaseUrl", e.target.value)} className={inp} placeholder="https://tokenized.sandbox.bka.sh/v1.2.0-beta" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
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

        {/* SMS Gateway */}
        <Section title="SMS গেটওয়ে (BDBulkSMS)">
          <p className="text-xs text-slate-500">BDBulkSMS — বাংলাদেশের জনপ্রিয় ও সাশ্রয়ী Bulk SMS সেবা। API Key ও Sender ID পেতে <a href="https://bdbulksms.net" target="_blank" rel="noreferrer" className="underline text-primary-600">bdbulksms.net</a> থেকে অ্যাকাউন্ট খুলুন।</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="API Token">
              <input type="password" value={form.smsApiKey ?? ""} onChange={(e) => set("smsApiKey", e.target.value)} className={inp} placeholder="Your BDBulkSMS API key" />
            </Field>
            <Field label="Sender ID (SID)">
              <input value={form.smsSenderId ?? ""} onChange={(e) => set("smsSenderId", e.target.value)} className={inp} placeholder="e.g. NEXIVIO" />
            </Field>
          </div>
        </Section>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-600 font-medium">✓ সেটিংস সফলভাবে সংরক্ষিত হয়েছে</p>}

        <div className="flex justify-end pb-8">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-primary-700 text-white hover:bg-primary-800 disabled:opacity-60 transition-colors"
          >
            {saving ? "সংরক্ষণ হচ্ছে..." : "সেটিংস সংরক্ষণ করুন"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
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
