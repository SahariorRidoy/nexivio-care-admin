"use client";

import { useEffect, useMemo, useState } from "react";
import { Send, User, Users, Target, Upload, AlertTriangle, CheckCircle2, Loader2, X, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import MessageComposer, { SmsPreview } from "./MessageComposer";
import Modal from "@/components/ui/Modal";
import {
  AudienceFilter, AudienceSource, PAYMENT_STATUS, SOURCES, SmsTemplate, inp, localPhone,
  parseCsv, parseNumbers, segmentInfo, sourceLabel,
} from "@/lib/sms";

type Mode = "single" | "bulk" | "audience";

interface AudienceMeta {
  counts: Record<AudienceSource, number>;
  serviceTypes: string[];
  trainings: { id: string; title: string }[];
}

interface PreviewResult {
  total: number;
  invalid: number;
  sample: { phone: string; name?: string | null; sources: string[] }[];
}

interface Props {
  templates: SmsTemplate[];
  senderId: string;
  signature: string;
  configured: boolean;
  onSent: (campaignId?: string) => void;
  seed?: { text: string; n: number } | null;
}

export default function ComposeTab({ templates, senderId, signature, configured, onSent, seed }: Props) {
  const [mode, setMode] = useState<Mode>("single");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [confirm, setConfirm] = useState(false);

  // single
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");

  // bulk
  const [numbersText, setNumbersText] = useState("");
  const [csvContacts, setCsvContacts] = useState<{ phone: string; name?: string }[]>([]);
  const [csvName, setCsvName] = useState("");

  // audience
  const [meta, setMeta] = useState<AudienceMeta | null>(null);
  const [filters, setFilters] = useState<Record<string, AudienceFilter>>({});
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [excludeText, setExcludeText] = useState("");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const [campaignName, setCampaignName] = useState("");

  useEffect(() => { if (seed) setMessage(seed.text); }, [seed]);

  useEffect(() => {
    if (mode === "audience" && !meta) {
      api.get<{ data: AudienceMeta }>("/sms/audiences/meta").then((r) => setMeta(r.data)).catch(() => {});
    }
  }, [mode, meta]);

  const parsed = useMemo(() => parseNumbers(numbersText), [numbersText]);
  const bulkTotal = useMemo(() => {
    const s = new Set(parsed.valid);
    csvContacts.forEach((c) => s.add(c.phone));
    return s.size;
  }, [parsed, csvContacts]);

  const activeFilters = Object.values(filters);

  // Debounced audience preview
  useEffect(() => {
    if (mode !== "audience") return;
    if (!activeFilters.length) { setPreview(null); return; }
    const t = setTimeout(async () => {
      setPreviewing(true);
      try {
        const r = await api.post<{ data: PreviewResult }>("/sms/audiences/preview", {
          filters: activeFilters, from: from || undefined, to: to || undefined,
          exclude: excludeText ? excludeText.split(/[\s,;]+/).filter(Boolean) : undefined,
        });
        setPreview(r.data);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "প্রিভিউ ব্যর্থ");
      } finally { setPreviewing(false); }
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, JSON.stringify(filters), from, to, excludeText]);

  const recipientCount =
    mode === "single" ? (parseNumbers(phone).valid.length ? 1 : 0) : mode === "bulk" ? bulkTotal : preview?.total ?? 0;

  const sampleName = mode === "single" ? name : mode === "audience" ? preview?.sample[0]?.name ?? "" : csvContacts[0]?.name ?? "";
  const previewText = useMemo(() => {
    const body = message
      .replace(/\{name\}/g, sampleName || "Customer")
      .replace(/\{phone\}/g, mode === "single" ? phone || "01XXXXXXXXX" : "01XXXXXXXXX");
    return signature ? `${body}\n${signature}` : body;
  }, [message, sampleName, phone, mode, signature]);
  const seg = segmentInfo(previewText).segments;
  const estimate = seg * recipientCount;

  const toggleSource = (k: AudienceSource) =>
    setFilters((f) => {
      const n = { ...f };
      if (n[k]) delete n[k]; else n[k] = { source: k };
      return n;
    });
  const patchFilter = (k: AudienceSource, p: Partial<AudienceFilter>) =>
    setFilters((f) => ({ ...f, [k]: { ...f[k], ...p } }));
  const toggleIn = (arr: string[] | undefined, v: string) => {
    const s = new Set(arr ?? []);
    if (s.has(v)) s.delete(v); else s.add(v);
    return [...s];
  };

  const onCsv = async (file: File) => {
    const text = await file.text();
    const rows = parseCsv(text);
    if (!rows.length) return toast.error("CSV-তে কোনো সঠিক নম্বর পাওয়া যায়নি");
    setCsvContacts(rows);
    setCsvName(file.name);
    toast.success(`${rows.length}টি নম্বর ইমপোর্ট হয়েছে`);
  };

  const validate = (): string | null => {
    if (!configured) return "আগে Settings → Integrations-এ SMS গেটওয়ে কনফিগার করুন";
    if (!message.trim()) return "বার্তা লিখুন";
    if (!recipientCount) return "কমপক্ষে একজন সঠিক প্রাপক প্রয়োজন";
    return null;
  };

  const ask = () => {
    const err = validate();
    if (err) return toast.error(err);
    if (mode === "single") return void send();
    setConfirm(true);
  };

  const send = async () => {
    setConfirm(false);
    setSending(true);
    try {
      if (mode === "single") {
        await api.post("/sms/send", { to: phone, name: name || undefined, message });
        toast.success("SMS সফলভাবে পাঠানো হয়েছে");
        setPhone(""); setName(""); setMessage("");
        onSent();
        return;
      }
      const body: Record<string, unknown> = {
        name: campaignName.trim() || `${mode === "bulk" ? "Bulk" : "Segment"} — ${new Date().toLocaleString("en-GB")}`,
        message,
      };
      if (mode === "bulk") {
        body.numbers = parsed.valid;
        body.contacts = csvContacts;
      } else {
        body.audience = {
          filters: activeFilters, from: from || undefined, to: to || undefined,
          exclude: excludeText ? excludeText.split(/[\s,;]+/).filter(Boolean) : undefined,
        };
      }
      const r = await api.post<{ data: { id: string } }>("/sms/campaigns", body);
      toast.success("ক্যাম্পেইন শুরু হয়েছে — অগ্রগতি Campaigns ট্যাবে দেখুন");
      setMessage(""); setNumbersText(""); setCsvContacts([]); setCsvName(""); setCampaignName("");
      onSent(r.data.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "পাঠানো ব্যর্থ হয়েছে");
    } finally {
      setSending(false);
    }
  };

  const MODES: { key: Mode; label: string; hint: string; Icon: typeof User }[] = [
    { key: "single", label: "একক SMS", hint: "একজন প্রাপক", Icon: User },
    { key: "bulk", label: "বাল্ক SMS", hint: "নম্বর তালিকা / CSV", Icon: Users },
    { key: "audience", label: "কাস্টমার সেগমেন্ট", hint: "ডাটাবেস থেকে টার্গেট", Icon: Target },
  ];

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-5">
      <div className="flex flex-col gap-5">
        {!configured && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>SMS গেটওয়ে কনফিগার করা নেই। <a href="/dashboard/settings" className="underline font-medium">Settings → Integrations</a> থেকে API Token ও Masking Sender ID দিন।</span>
          </div>
        )}

        {/* Mode selector */}
        <div className="grid grid-cols-3 gap-2">
          {MODES.map(({ key, label, hint, Icon }) => (
            <button key={key} type="button" onClick={() => setMode(key)}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                mode === key ? "border-primary-500 bg-primary-50 ring-2 ring-primary-200" : "border-slate-200 bg-white hover:border-slate-300"
              }`}>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${mode === key ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                <Icon size={17} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-800 truncate">{label}</span>
                <span className="block text-[11px] text-slate-500 truncate">{hint}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Recipients */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-slate-700">প্রাপক</h3>

          {mode === "single" && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">মোবাইল নম্বর <span className="text-red-500">*</span></label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" className={`${inp} font-mono`} />
                {phone && !parseNumbers(phone).valid.length && <p className="text-[11px] text-red-500">সঠিক বাংলাদেশি মোবাইল নম্বর দিন</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">নাম (ঐচ্ছিক — {"{name}"} এর জন্য)</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="গ্রাহকের নাম" className={inp} />
              </div>
            </div>
          )}

          {mode === "bulk" && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">নম্বর তালিকা (কমা, স্পেস বা নতুন লাইনে আলাদা করুন)</label>
                <textarea value={numbersText} onChange={(e) => setNumbersText(e.target.value)} rows={5}
                  placeholder={"01711000000\n01811000000, 01911000000"} className={`${inp} font-mono text-xs`} />
                <div className="flex flex-wrap gap-3 text-[11px]">
                  <span className="text-emerald-600">✓ সঠিক: {parsed.valid.length}</span>
                  {parsed.duplicates > 0 && <span className="text-slate-500">ডুপ্লিকেট বাদ: {parsed.duplicates}</span>}
                  {parsed.invalid.length > 0 && (
                    <span className="text-red-500" title={parsed.invalid.join(", ")}>✗ ভুল: {parsed.invalid.length} ({parsed.invalid.slice(0, 3).join(", ")}{parsed.invalid.length > 3 ? "…" : ""})</span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
                  <Upload size={14} /> CSV ইমপোর্ট (phone, name)
                  <input type="file" accept=".csv,.txt" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) onCsv(f); e.target.value = ""; }} />
                </label>
                {csvName && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs text-primary-700">
                    {csvName} · {csvContacts.length} জন
                    <button type="button" onClick={() => { setCsvContacts([]); setCsvName(""); }}><X size={12} /></button>
                  </span>
                )}
              </div>
            </>
          )}

          {mode === "audience" && (
            <div className="flex flex-col gap-4">
              <div className="grid sm:grid-cols-2 gap-2">
                {SOURCES.map((s) => {
                  const on = !!filters[s.key];
                  return (
                    <button key={s.key} type="button" onClick={() => toggleSource(s.key)}
                      className={`flex items-start justify-between gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                        on ? "border-primary-500 bg-primary-50" : "border-slate-200 hover:bg-slate-50"
                      }`}>
                      <span>
                        <span className="block text-sm font-medium text-slate-800">{s.label}</span>
                        <span className="block text-[11px] text-slate-500">{s.hint}</span>
                      </span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${on ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                        {meta?.counts[s.key] ?? "…"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {activeFilters.map((f) => {
                const def = SOURCES.find((s) => s.key === f.source)!;
                if (!def.status && !def.payment && !def.serviceType && !def.training) return null;
                return (
                  <div key={f.source} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 flex flex-col gap-2.5">
                    <p className="text-xs font-semibold text-slate-700">{def.label} — ফিল্টার</p>
                    {def.status && (
                      <ChipRow label="স্ট্যাটাস" options={def.status} selected={f.status}
                        onToggle={(v) => patchFilter(f.source, { status: toggleIn(f.status, v) })} />
                    )}
                    {def.payment && (
                      <ChipRow label="পেমেন্ট" options={PAYMENT_STATUS} selected={f.paymentStatus}
                        onToggle={(v) => patchFilter(f.source, { paymentStatus: toggleIn(f.paymentStatus, v) })} />
                    )}
                    {def.serviceType && meta?.serviceTypes.length ? (
                      <select value={f.serviceType ?? ""} onChange={(e) => patchFilter(f.source, { serviceType: e.target.value || undefined })} className={`${inp} sm:max-w-xs`}>
                        <option value="">সব সার্ভিস</option>
                        {meta.serviceTypes.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : null}
                    {def.training && meta?.trainings.length ? (
                      <select value={f.trainingId ?? ""} onChange={(e) => patchFilter(f.source, { trainingId: e.target.value || undefined })} className={`${inp} sm:max-w-xs`}>
                        <option value="">সব কোর্স</option>
                        {meta.trainings.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                      </select>
                    ) : null}
                  </div>
                );
              })}

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">তারিখ থেকে</label>
                  <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inp} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">তারিখ পর্যন্ত</label>
                  <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inp} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">বাদ দিন (নম্বর)</label>
                  <input value={excludeText} onChange={(e) => setExcludeText(e.target.value)} placeholder="017…, 018…" className={`${inp} font-mono text-xs`} />
                </div>
              </div>

              <div className="rounded-lg border border-slate-200">
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                    <Eye size={13} /> অডিয়েন্স প্রিভিউ
                    {previewing && <Loader2 size={12} className="animate-spin text-primary-600" />}
                  </span>
                  {preview && (
                    <span className="text-slate-500">
                      ইউনিক প্রাপক: <b className="text-primary-700">{preview.total}</b>
                      {preview.invalid > 0 && <> · ভুল নম্বর বাদ: {preview.invalid}</>}
                    </span>
                  )}
                </div>
                {!activeFilters.length ? (
                  <p className="p-4 text-center text-xs text-slate-400">উপরে এক বা একাধিক উৎস নির্বাচন করুন</p>
                ) : preview && preview.sample.length ? (
                  <ul className="max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {preview.sample.map((r) => (
                      <li key={r.phone} className="flex items-center justify-between gap-2 px-3 py-1.5">
                        <span className="text-slate-700 truncate">{r.name || "—"}</span>
                        <span className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-slate-400 hidden sm:inline">{r.sources.map(sourceLabel).join(", ")}</span>
                          <span className="font-mono text-slate-500">{localPhone(r.phone)}</span>
                        </span>
                      </li>
                    ))}
                    {preview.total > preview.sample.length && (
                      <li className="px-3 py-1.5 text-center text-slate-400">…আরও {preview.total - preview.sample.length} জন</li>
                    )}
                  </ul>
                ) : (
                  <p className="p-4 text-center text-xs text-slate-400">{previewing ? "লোড হচ্ছে…" : "কোনো প্রাপক পাওয়া যায়নি"}</p>
                )}
              </div>
            </div>
          )}

          {mode !== "single" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">ক্যাম্পেইনের নাম (ঐচ্ছিক)</label>
              <input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="যেমন: ঈদ অফার ২০২৬" className={inp} />
            </div>
          )}
        </div>

        {/* Message */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <MessageComposer value={message} onChange={setMessage} templates={templates} signature={signature} />
        </div>
      </div>

      {/* Right rail: preview + summary */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-4 self-start">
        <SmsPreview text={previewText} senderId={senderId} />
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-2 text-sm">
          <Row label="Sender ID (Mask)" value={senderId || "—"} />
          <Row label="প্রাপক" value={recipientCount.toLocaleString()} />
          <Row label="SMS পার্ট / প্রাপক" value={seg} />
          <Row label="আনুমানিক মোট SMS" value={estimate.toLocaleString()} strong />
          {message.includes("{name}") && mode !== "single" && (
            <p className="text-[11px] text-slate-500 flex items-start gap-1">
              <CheckCircle2 size={12} className="mt-0.5 text-emerald-600 shrink-0" /> প্রতিটি প্রাপক নিজের নামসহ পার্সোনালাইজড SMS পাবেন
            </p>
          )}
          <button type="button" onClick={ask} disabled={sending}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-60">
            {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {sending ? "পাঠানো হচ্ছে…" : mode === "single" ? "SMS পাঠান" : `${recipientCount.toLocaleString()} জনকে পাঠান`}
          </button>
        </div>
      </div>

      <Modal open={confirm} onClose={() => setConfirm(false)} title="বাল্ক SMS নিশ্চিত করুন" width="max-w-md">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-slate-50 p-3"><p className="text-lg font-bold text-slate-800">{recipientCount.toLocaleString()}</p><p className="text-[11px] text-slate-500">প্রাপক</p></div>
            <div className="rounded-lg bg-slate-50 p-3"><p className="text-lg font-bold text-slate-800">{seg}</p><p className="text-[11px] text-slate-500">পার্ট/SMS</p></div>
            <div className="rounded-lg bg-primary-50 p-3"><p className="text-lg font-bold text-primary-700">{estimate.toLocaleString()}</p><p className="text-[11px] text-slate-500">মোট ক্রেডিট</p></div>
          </div>
          <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 whitespace-pre-wrap max-h-40 overflow-y-auto">{previewText}</p>
          <p className="text-xs text-amber-700">পাঠানোর পর এটি ফেরানো যাবে না।</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setConfirm(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">বাতিল</button>
            <button type="button" onClick={send} className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800"><Send size={14} /> নিশ্চিত, পাঠান</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-500 text-xs">{label}</span>
      <span className={strong ? "font-bold text-primary-700" : "font-medium text-slate-700"}>{value}</span>
    </div>
  );
}

function ChipRow({ label, options, selected, onToggle }: {
  label: string; options: { value: string; label: string }[]; selected?: string[]; onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] text-slate-500 w-14">{label}:</span>
      {options.map((o) => {
        const on = selected?.includes(o.value);
        return (
          <button key={o.value} type="button" onClick={() => onToggle(o.value)}
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${on ? "border-primary-500 bg-primary-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"}`}>
            {o.label}
          </button>
        );
      })}
      {!selected?.length && <span className="text-[10px] text-slate-400">(সব)</span>}
    </div>
  );
}
