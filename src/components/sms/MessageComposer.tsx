"use client";

import { useRef, useState } from "react";
import { FileText, Languages } from "lucide-react";
import { PLACEHOLDERS, segmentInfo, SmsTemplate, STARTER_TEMPLATES, TEMPLATE_CATEGORIES, inp } from "@/lib/sms";

interface Props {
  value: string;
  onChange: (v: string) => void;
  templates: SmsTemplate[];
  signature?: string;
  allowPlaceholders?: boolean;
  rows?: number;
}

export default function MessageComposer({ value, onChange, templates, signature, allowPlaceholders = true, rows = 6 }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [showTpl, setShowTpl] = useState(false);
  const full = signature ? `${value}\n${signature}` : value;
  const info = segmentInfo(full);

  const insert = (token: string) => {
    const el = ref.current;
    if (!el) return onChange(value + token);
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + token + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + token.length, start + token.length); });
  };

  const all = [
    ...templates.map((t) => ({ ...t, saved: true })),
    ...STARTER_TEMPLATES.filter((s) => !templates.some((t) => t.body === s.body)).map((s, i) => ({ ...s, id: `starter-${i}`, saved: false })),
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-medium text-slate-600">বার্তা <span className="text-red-500">*</span></label>
        <div className="flex flex-wrap items-center gap-1.5">
          {allowPlaceholders && PLACEHOLDERS.map((p) => (
            <button key={p.token} type="button" onClick={() => insert(p.token)}
              className="px-2 py-1 text-[11px] font-medium rounded-md border border-dashed border-primary-300 text-primary-700 hover:bg-primary-50">
              + {p.label} <span className="font-mono opacity-70">{p.token}</span>
            </button>
          ))}
          <div className="relative">
            <button type="button" onClick={() => setShowTpl((v) => !v)}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">
              <FileText size={12} /> টেমপ্লেট
            </button>
            {showTpl && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowTpl(false)} />
                <div className="absolute right-0 z-20 mt-1 w-80 max-h-80 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg p-1">
                  {all.length === 0 && <p className="text-xs text-slate-400 p-3">কোনো টেমপ্লেট নেই</p>}
                  {all.map((t) => (
                    <button key={t.id} type="button"
                      onClick={() => { onChange(t.body); setShowTpl(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-700">{t.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                          {TEMPLATE_CATEGORIES.find((c) => c.value === t.category)?.label ?? t.category}{!t.saved && " · ডিফল্ট"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{t.body}</p>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <textarea ref={ref} value={value} onChange={(e) => onChange(e.target.value)} rows={rows} maxLength={1000}
        placeholder="আপনার বার্তা লিখুন… নাম ব্যবহার করতে {name} লিখুন" className={`${inp} resize-y leading-relaxed`} />

      {signature && (
        <p className="text-[11px] text-slate-400">সিগনেচার যুক্ত হবে: <span className="text-slate-600">{signature}</span></p>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Languages size={12} />
          {info.unicode ? <span className="text-amber-600 font-medium">Unicode (বাংলা) — ৭০ অক্ষর/SMS</span> : <span className="text-emerald-600 font-medium">GSM (English) — ১৬০ অক্ষর/SMS</span>}
        </span>
        <span>অক্ষর: <b className="text-slate-700">{info.len}</b></span>
        <span>SMS পার্ট: <b className={info.segments > 2 ? "text-red-600" : "text-slate-700"}>{info.segments}</b></span>
        <span>এই পার্টে বাকি: <b className="text-slate-700">{info.remaining}</b></span>
      </div>
    </div>
  );
}

/** Phone-style live preview of the message. */
export function SmsPreview({ text, senderId }: { text: string; senderId?: string }) {
  return (
    <div className="mx-auto w-full max-w-[260px] rounded-[2rem] border-[6px] border-slate-800 bg-slate-800 shadow-xl">
      <div className="rounded-[1.5rem] bg-slate-50 overflow-hidden">
        <div className="bg-white border-b border-slate-200 px-4 py-3 text-center">
          <div className="mx-auto mb-1 h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
            {(senderId || "SMS").slice(0, 2).toUpperCase()}
          </div>
          <p className="text-xs font-semibold text-slate-700">{senderId || "Sender ID"}</p>
        </div>
        <div className="min-h-[220px] p-3">
          {text ? (
            <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-white border border-slate-200 px-3 py-2 text-[12px] leading-relaxed text-slate-700 whitespace-pre-wrap break-words shadow-sm">
              {text}
            </div>
          ) : (
            <p className="text-center text-[11px] text-slate-400 mt-16">প্রিভিউ এখানে দেখা যাবে</p>
          )}
        </div>
      </div>
    </div>
  );
}
