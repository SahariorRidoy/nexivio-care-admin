"use client";

import { Send, CheckCircle2, XCircle, CalendarDays, Layers, Megaphone, Wallet, RefreshCw } from "lucide-react";

export interface SmsStats {
  total: number; sent: number; failed: number; today: number;
  monthSent: number; monthSegments: number; totalSegments: number;
  successRate: number; campaigns: number;
  daily: { date: string; sent: number; failed: number }[];
}

interface Props {
  stats: SmsStats | null;
  balance: string | null;
  balanceLoading: boolean;
  onRefreshBalance: () => void;
}

export default function OverviewTab({ stats, balance, balanceLoading, onRefreshBalance }: Props) {
  const max = Math.max(1, ...(stats?.daily ?? []).map((d) => d.sent + d.failed));
  const cards = [
    { label: "আজ পাঠানো", value: stats?.today ?? "—", Icon: CalendarDays, tone: "bg-sky-50 text-sky-700" },
    { label: "এই মাসে (সফল)", value: stats?.monthSent ?? "—", sub: stats ? `${stats.monthSegments} ক্রেডিট` : "", Icon: Send, tone: "bg-primary-50 text-primary-700" },
    { label: "মোট সফল", value: stats?.sent ?? "—", sub: stats ? `সাফল্যের হার ${stats.successRate}%` : "", Icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700" },
    { label: "মোট ব্যর্থ", value: stats?.failed ?? "—", Icon: XCircle, tone: "bg-red-50 text-red-600" },
    { label: "মোট ক্রেডিট ব্যবহার", value: stats?.totalSegments ?? "—", Icon: Layers, tone: "bg-violet-50 text-violet-700" },
    { label: "ক্যাম্পেইন", value: stats?.campaigns ?? "—", Icon: Megaphone, tone: "bg-amber-50 text-amber-700" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid sm:grid-cols-[1.2fr_2fr] gap-4">
        <div className="rounded-xl bg-gradient-to-br from-primary-600 to-emerald-700 p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-white/80"><Wallet size={16} /> SMS ব্যালেন্স</span>
            <button onClick={onRefreshBalance} className="rounded-lg p-1.5 hover:bg-white/10" title="রিফ্রেশ">
              <RefreshCw size={14} className={balanceLoading ? "animate-spin" : ""} />
            </button>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight">{balanceLoading ? "…" : balance ?? "N/A"}</p>
          <p className="mt-1 text-[11px] text-white/70">প্রোভাইডার থেকে সরাসরি — কম ব্যালেন্সে বাল্ক পাঠানোর আগে রিচার্জ করুন</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {cards.map(({ label, value, sub, Icon, tone }) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-3.5">
              <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}><Icon size={16} /></div>
              <p className="text-xl font-bold text-slate-800">{typeof value === "number" ? value.toLocaleString() : value}</p>
              <p className="text-[11px] text-slate-500">{label}</p>
              {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">গত ১৪ দিনের কার্যক্রম</h3>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-primary-500" /> সফল</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-400" /> ব্যর্থ</span>
          </div>
        </div>
        <div className="flex h-44 items-end gap-1.5">
          {(stats?.daily ?? []).map((d) => {
            const total = d.sent + d.failed;
            return (
              <div key={d.date} className="group relative flex h-full flex-1 flex-col justify-end">
                <div className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-[10px] text-white group-hover:block">
                  {d.date}: {d.sent} সফল · {d.failed} ব্যর্থ
                </div>
                <div className="flex flex-col justify-end overflow-hidden rounded-t" style={{ height: `${(total / max) * 100}%`, minHeight: total ? 3 : 0 }}>
                  <div className="bg-red-400" style={{ height: total ? `${(d.failed / total) * 100}%` : 0 }} />
                  <div className="flex-1 bg-primary-500" />
                </div>
                <span className="mt-1 text-center text-[9px] text-slate-400">{d.date.slice(8)}</span>
              </div>
            );
          })}
          {!stats && <p className="m-auto text-xs text-slate-400">লোড হচ্ছে…</p>}
        </div>
      </div>
    </div>
  );
}
