"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle, XCircle, Search, RotateCcw, Download, X, MessageSquare, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { Meta, SmsLog, fmtDate, inp, localPhone } from "@/lib/sms";
import Pager from "./Pager";

const TYPE_LABEL: Record<string, string> = { single: "একক", bulk: "বাল্ক", campaign: "ক্যাম্পেইন" };

interface Props {
  refreshKey: number;
  campaignFilter: { id: string; name: string } | null;
  clearCampaign: () => void;
}

export default function HistoryTab({ refreshKey, campaignFilter, clearCampaign }: Props) {
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 25, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [detail, setDetail] = useState<SmsLog | null>(null);
  const [resending, setResending] = useState<string | null>(null);

  const params = useCallback((page: number, limit = 25) => {
    const p: Record<string, string | number> = { page, limit };
    if (q) p.q = q;
    if (status) p.status = status;
    if (type) p.type = type;
    if (campaignFilter) p.campaignId = campaignFilter.id;
    return p;
  }, [q, status, type, campaignFilter]);

  const load = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const r = await api.get<{ data: SmsLog[]; meta: Meta }>("/sms", params(page));
      setLogs(r.data); setMeta(r.meta);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [params]);

  useEffect(() => {
    const t = setTimeout(() => load(1), 300);
    return () => clearTimeout(t);
  }, [load, refreshKey]);

  const resend = async (log: SmsLog) => {
    setResending(log.id);
    try { await api.post(`/sms/${log.id}/resend`, {}); toast.success("পুনরায় পাঠানো হয়েছে"); load(meta.page); }
    catch (e) { toast.error(e instanceof Error ? e.message : "ব্যর্থ"); } finally { setResending(null); }
  };

  const exportCsv = async () => {
    try {
      const rows: SmsLog[] = [];
      for (let page = 1; page <= 50; page++) {
        const r = await api.get<{ data: SmsLog[]; meta: Meta }>("/sms", params(page, 100));
        rows.push(...r.data);
        if (page >= r.meta.totalPages) break;
      }
      const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const csv = ["Date,Phone,Name,Type,Status,Segments,Campaign,Sent By,Message",
        ...rows.map((l) => [fmtDate(l.createdAt), localPhone(l.to), l.recipientName, l.type, l.status, l.segments, l.campaign?.name, l.sentBy, l.message].map(esc).join(","))].join("\n");
      const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url; a.download = `sms-report-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { toast.error(e instanceof Error ? e.message : "এক্সপোর্ট ব্যর্থ"); }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <h3 className="mr-auto inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
          <MessageSquare size={15} className="text-primary-600" /> SMS ইতিহাস <span className="text-xs font-normal text-slate-400">({meta.total})</span>
        </h3>
        {campaignFilter && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs text-primary-700">
            {campaignFilter.name}<button onClick={clearCampaign}><X size={12} /></button>
          </span>
        )}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="নম্বর, নাম বা বার্তা…" className={`${inp} w-52 py-1.5 pl-7 text-xs`} />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inp} w-auto py-1.5 text-xs`}>
          <option value="">সব স্ট্যাটাস</option><option value="sent">সফল</option><option value="failed">ব্যর্থ</option>
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className={`${inp} w-auto py-1.5 text-xs`}>
          <option value="">সব ধরন</option><option value="single">একক</option><option value="bulk">বাল্ক</option><option value="campaign">ক্যাম্পেইন</option>
        </select>
        <button onClick={exportCsv} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
          <Download size={12} /> CSV
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary-600" /></div>
      ) : logs.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-400">কোনো SMS পাওয়া যায়নি</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5 font-semibold">প্রাপক</th>
                <th className="px-4 py-2.5 font-semibold">বার্তা</th>
                <th className="px-4 py-2.5 font-semibold">ধরন</th>
                <th className="px-4 py-2.5 font-semibold">স্ট্যাটাস</th>
                <th className="px-4 py-2.5 font-semibold">সময়</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/60 cursor-pointer" onClick={() => setDetail(l)}>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <p className="font-mono text-slate-700">{localPhone(l.to)}</p>
                    {l.recipientName && <p className="text-[11px] text-slate-400">{l.recipientName}</p>}
                  </td>
                  <td className="px-4 py-2.5 max-w-xs"><span className="line-clamp-2 text-slate-600">{l.message}</span></td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className="text-xs text-slate-600">{TYPE_LABEL[l.type] ?? l.type}</span>
                    {l.campaign && <p className="text-[10px] text-slate-400 max-w-[140px] truncate">{l.campaign.name}</p>}
                  </td>
                  <td className="px-4 py-2.5">
                    {l.status === "sent" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700"><CheckCircle size={11} /> সফল</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600"><XCircle size={11} /> ব্যর্থ</span>
                    )}
                    <p className="text-[10px] text-slate-400 mt-0.5">{l.segments} পার্ট</p>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-xs text-slate-400">{fmtDate(l.createdAt)}</td>
                  <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                    {l.status === "failed" && (
                      <button onClick={() => resend(l)} disabled={resending === l.id} title="আবার পাঠান"
                        className="rounded-md p-1.5 text-amber-600 hover:bg-amber-50 disabled:opacity-50">
                        {resending === l.id ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager meta={meta} onPage={load} />

      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDetail(null)} />
          <div className="relative h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">SMS বিস্তারিত</h3>
              <button onClick={() => setDetail(null)} className="rounded-lg p-1.5 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <dl className="grid grid-cols-[110px_1fr] gap-y-2 text-sm">
              <dt className="text-slate-500">প্রাপক</dt><dd className="font-mono">{localPhone(detail.to)}</dd>
              <dt className="text-slate-500">নাম</dt><dd>{detail.recipientName ?? "—"}</dd>
              <dt className="text-slate-500">স্ট্যাটাস</dt><dd>{detail.status === "sent" ? "সফল" : "ব্যর্থ"}</dd>
              <dt className="text-slate-500">ধরন</dt><dd>{TYPE_LABEL[detail.type] ?? detail.type}{detail.campaign && ` — ${detail.campaign.name}`}</dd>
              <dt className="text-slate-500">পার্ট</dt><dd>{detail.segments}</dd>
              <dt className="text-slate-500">পাঠিয়েছেন</dt><dd>{detail.sentBy ?? "—"}</dd>
              <dt className="text-slate-500">সময়</dt><dd>{fmtDate(detail.createdAt)}</dd>
            </dl>
            <p className="mt-5 mb-1 text-xs font-semibold text-slate-500">বার্তা</p>
            <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{detail.message}</p>
            <p className="mt-5 mb-1 text-xs font-semibold text-slate-500">গেটওয়ে রেসপন্স</p>
            <pre className="whitespace-pre-wrap break-all rounded-lg bg-slate-900 p-3 text-[11px] text-slate-100">{detail.response ?? "—"}</pre>
            {detail.status === "failed" && (
              <button onClick={() => { resend(detail); setDetail(null); }} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600">
                <RotateCcw size={14} /> আবার পাঠান
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
