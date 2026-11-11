"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Meta } from "@/lib/sms";

export default function Pager({ meta, onPage }: { meta: Meta; onPage: (p: number) => void }) {
  if (meta.totalPages <= 1) return null;
  const pages = Array.from({ length: meta.totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === meta.totalPages || Math.abs(p - meta.page) <= 1)
    .reduce<(number | "...")[]>((acc, p, idx, arr) => {
      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);
  const btn = "p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed";
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
      <span className="text-xs text-slate-500">পৃষ্ঠা {meta.page} / {meta.totalPages}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(meta.page - 1)} disabled={meta.page <= 1} className={btn}><ChevronLeft size={15} /></button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} className="px-1 text-xs text-slate-400">…</span>
          ) : (
            <button key={p} onClick={() => onPage(p)}
              className={`h-[30px] min-w-[30px] rounded-lg text-xs font-medium ${meta.page === p ? "bg-primary-700 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onPage(meta.page + 1)} disabled={meta.page >= meta.totalPages} className={btn}><ChevronRight size={15} /></button>
      </div>
    </div>
  );
}
