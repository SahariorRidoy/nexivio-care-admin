"use client";

import { useEffect, useState, useCallback } from "react";
import { Send, MessageSquare, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";

interface SmsLog {
  id: string;
  to: string;
  message: string;
  status: string;
  response: string | null;
  sentBy: string | null;
  createdAt: string;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const LIMIT = 20;

export default function SmsPage() {
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState("");

  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: LIMIT, totalPages: 1 });
  const [loadingLogs, setLoadingLogs] = useState(true);

  const fetchLogs = useCallback(async (page: number) => {
    setLoadingLogs(true);
    try {
      const res = await api.get<{ data: SmsLog[]; meta: Meta }>("/sms", { page, limit: LIMIT });
      setLogs(res.data);
      setMeta(res.meta);
    } catch {
      // silent
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => { fetchLogs(1); }, [fetchLogs]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true); setSendError(""); setSendSuccess("");
    try {
      await api.post("/sms/send", { to, message });
      setSendSuccess("SMS সফলভাবে পাঠানো হয়েছে!");
      setTo(""); setMessage("");
      fetchLogs(1);
      setTimeout(() => setSendSuccess(""), 4000);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "SMS পাঠাতে ব্যর্থ হয়েছে");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <h2 className="text-lg font-bold text-slate-800">SMS পাঠান</h2>
        <p className="text-sm text-slate-500">BDBulkSMS এর মাধ্যমে SMS পাঠান ও ইতিহাস দেখুন</p>
      </div>

      {/* Send Form */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <Send size={15} className="text-primary-600" />
          <h3 className="text-sm font-semibold text-slate-700">নতুন SMS</h3>
        </div>
        <form onSubmit={handleSend} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">মোবাইল নম্বর <span className="text-red-500">*</span></label>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
              placeholder="01XXXXXXXXX"
              className={inp}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 flex items-center justify-between">
              <span>বার্তা <span className="text-red-500">*</span></span>
              <span className="text-slate-400">{message.length}/640</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              maxLength={640}
              rows={4}
              placeholder="আপনার বার্তা লিখুন..."
              className={`${inp} resize-none`}
            />
          </div>
          {sendError && <p className="text-sm text-red-500">{sendError}</p>}
          {sendSuccess && <p className="text-sm text-green-600 font-medium">✓ {sendSuccess}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-primary-700 text-white hover:bg-primary-800 disabled:opacity-60 transition-colors"
            >
              <Send size={14} />
              {sending ? "পাঠানো হচ্ছে..." : "SMS পাঠান"}
            </button>
          </div>
        </form>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare size={15} className="text-primary-600" />
            <h3 className="text-sm font-semibold text-slate-700">SMS ইতিহাস</h3>
          </div>
          <span className="text-xs text-slate-400">মোট: {meta.total}</span>
        </div>

        {loadingLogs ? (
          <div className="flex justify-center py-12">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-12">কোনো SMS পাঠানো হয়নি</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">নম্বর</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">বার্তা</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">স্ট্যাটাস</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">পাঠিয়েছেন</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">সময়</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-700">{log.to}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs">
                      <span className="line-clamp-2">{log.message}</span>
                    </td>
                    <td className="px-4 py-3">
                      {log.status === "sent" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                          <CheckCircle size={11} /> সফল
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
                          <XCircle size={11} /> ব্যর্থ
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{log.sentBy ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("bn-BD", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              পৃষ্ঠা {meta.page} / {meta.totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => fetchLogs(meta.page - 1)}
                disabled={meta.page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === meta.totalPages || Math.abs(p - meta.page) <= 1)
                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-slate-400 text-xs">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => fetchLogs(p as number)}
                      className={`min-w-[30px] h-[30px] rounded-lg text-xs font-medium transition-colors ${
                        meta.page === p
                          ? "bg-primary-700 text-white"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => fetchLogs(meta.page + 1)}
                disabled={meta.page >= meta.totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inp = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300";
