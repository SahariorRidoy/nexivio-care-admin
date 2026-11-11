"use client";

import { useCallback, useEffect, useState } from "react";
import { Megaphone, RotateCcw, ListChecks, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { Meta, SmsCampaign, fmtDate, sourceLabel } from "@/lib/sms";
import Pager from "./Pager";

const STATUS: Record<string, { label: string; cls: string }> = {
  processing: { label: "চলমান", cls: "bg-sky-50 text-sky-700" },
  completed: { label: "সম্পন্ন", cls: "bg-emerald-50 text-emerald-700" },
  partial: { label: "আংশিক", cls: "bg-amber-50 text-amber-700" },
  failed: { label: "ব্যর্থ", cls: "bg-red-50 text-red-600" },
};

export default function CampaignsTab({ refreshKey, onViewLogs }: { refreshKey: number; onViewLogs: (c: SmsCampaign) => void }) {
  const [rows, setRows] = useState<SmsCampaign[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (page: number, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const r = await api.get<{ data: SmsCampaign[]; meta: Meta }>("/sms/campaigns", { page, limit: 15 });
      setRows(r.data); setMeta(r.meta);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(1); }, [load, refreshKey]);

  // Poll while any campaign is processing
  useEffect(() => {
    if (!rows.some((r) => r.status === "processing")) return;
    const t = setInterval(() => load(meta.page, true), 3000);
    return () => clearInterval(t);
  }, [rows, meta.page, load]);

  const retry = async (c: SmsCampaign) => {
    try {
      await api.post(`/sms/campaigns/${c.id}/retry`, {});
      toast.success(`${c.failed}টি ব্যর্থ SMS পুনরায় পাঠানো হচ্ছে`);
      load(meta.page, true);
    } catch (e) { toast.error(e instanceof Error ? e.message : "ব্যর্থ"); }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
        <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700"><Megaphone size={15} className="text-primary-600" /> ক্যাম্পেইন</h3>
        <span className="text-xs text-slate-400">মোট: {meta.total}</span>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary-600" /></div>
      ) : rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-400">এখনো কোনো ক্যাম্পেইন নেই — Compose থেকে বাল্ক বা সেগমেন্ট SMS পাঠান</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((c) => {
            const done = c.sent + c.failed;
            const pct = c.total ? Math.round((done / c.total) * 100) : 0;
            const st = STATUS[c.status] ?? { label: c.status, cls: "bg-slate-100 text-slate-600" };
            const sources = c.audience?.filters?.map((f) => sourceLabel(f.source)) ?? [];
            return (
              <li key={c.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-800">{c.name}</p>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${st.cls}`}>
                        {c.status === "processing" && <Loader2 size={10} className="animate-spin" />}{st.label}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{c.message}</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {fmtDate(c.createdAt)} · {c.createdBy ?? "Admin"}
                      {sources.length > 0 && <> · {sources.join(", ")}</>}
                      {(c.audience?.manual ?? 0) > 0 && <> · ম্যানুয়াল তালিকা</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.failed > 0 && c.status !== "processing" && (
                      <button onClick={() => retry(c)} className="inline-flex items-center gap-1 rounded-lg border border-amber-200 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50">
                        <RotateCcw size={12} /> ব্যর্থগুলো আবার পাঠান
                      </button>
                    )}
                    <button onClick={() => onViewLogs(c)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                      <ListChecks size={12} /> রিপোর্ট
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 flex">
                    <div className="bg-primary-500" style={{ width: `${c.total ? (c.sent / c.total) * 100 : 0}%` }} />
                    <div className="bg-red-400" style={{ width: `${c.total ? (c.failed / c.total) * 100 : 0}%` }} />
                  </div>
                  <span className="whitespace-nowrap text-[11px] text-slate-500">
                    <b className="text-emerald-600">{c.sent}</b> সফল · <b className="text-red-500">{c.failed}</b> ব্যর্থ / {c.total} ({pct}%) · {c.segments} ক্রেডিট
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Pager meta={meta} onPage={(p) => load(p)} />
    </div>
  );
}
