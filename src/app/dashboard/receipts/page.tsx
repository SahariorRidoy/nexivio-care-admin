"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Search, Filter, Plus, Receipt, FileText, Pencil, Trash2,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/utils";
import AdminTable, { type Column } from "@/components/ui/AdminTable";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ReceiptFormModal from "@/components/ui/ReceiptFormModal";
import InvoiceFormModal from "@/components/ui/InvoiceFormModal";
import StandaloneReceiptView, { type StandaloneReceiptData } from "@/components/ui/StandaloneReceiptView";
import StandaloneInvoiceView, { type StandaloneInvoiceData } from "@/components/ui/StandaloneInvoiceView";

const PAGE_SIZE = 10;

type Tab = "receipts" | "invoices";

const payStatusClass: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  partial: "bg-amber-100 text-amber-700",
  unpaid: "bg-red-100 text-red-700",
};

function Pagination({ page, totalPages, total, onChange }: { page: number; totalPages: number; total: number; onChange: (p: number) => void }) {
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  const pages = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const r: (number | "...")[] = [1];
    if (page > 3) r.push("...");
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) r.push(p);
    if (page < totalPages - 2) r.push("...");
    r.push(totalPages);
    return r;
  }, [page, totalPages]);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-1">
      <p className="text-sm text-slate-500">{total === 0 ? "কোনো ফলাফল নেই" : `${from}–${to} দেখানো হচ্ছে, মোট ${total}টি`}</p>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(1)} disabled={page === 1} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors"><ChevronsLeft size={15} /></button>
        <button onClick={() => onChange(page - 1)} disabled={page === 1} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors"><ChevronLeft size={15} /></button>
        {pages.map((p, i) => p === "..." ? (
          <span key={`e-${i}`} className="px-2 text-slate-400 text-sm">…</span>
        ) : (
          <button key={p} onClick={() => onChange(p as number)} className={`min-w-[34px] h-[34px] rounded-lg border text-sm font-medium transition-colors ${p === page ? "bg-primary-600 text-white border-primary-600" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{p}</button>
        ))}
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors"><ChevronRight size={15} /></button>
        <button onClick={() => onChange(totalPages)} disabled={page === totalPages} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors"><ChevronsRight size={15} /></button>
      </div>
    </div>
  );
}

export default function ReceiptsPage() {
  const [tab, setTab] = useState<Tab>("receipts");

  // Receipts state
  const [receipts, setReceipts] = useState<StandaloneReceiptData[]>([]);
  const [receiptsLoading, setReceiptsLoading] = useState(true);
  const [receiptModal, setReceiptModal] = useState(false);
  const [editReceipt, setEditReceipt] = useState<StandaloneReceiptData | null>(null);
  const [viewReceipt, setViewReceipt] = useState<StandaloneReceiptData | null>(null);
  const [deleteReceiptId, setDeleteReceiptId] = useState<string | null>(null);
  const [deletingReceipt, setDeletingReceipt] = useState(false);

  // Invoices state
  const [invoices, setInvoices] = useState<StandaloneInvoiceData[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [editInvoice, setEditInvoice] = useState<StandaloneInvoiceData | null>(null);
  const [viewInvoice, setViewInvoice] = useState<StandaloneInvoiceData | null>(null);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get<{ data: StandaloneReceiptData[] }>("/receipts")
      .then((r) => setReceipts(r.data))
      .catch(() => {})
      .finally(() => setReceiptsLoading(false));
    api.get<{ data: StandaloneInvoiceData[] }>("/invoices")
      .then((r) => setInvoices(r.data.map((inv) => ({ ...inv, items: inv.items as never }))))
      .catch(() => {})
      .finally(() => setInvoicesLoading(false));
  }, []);

  useEffect(() => setPage(1), [search, filterStatus, dateFrom, dateTo, tab]);

  // ── Filtered receipts ──
  const filteredReceipts = useMemo(() => {
    const q = search.toLowerCase();
    return receipts.filter((r) => {
      const matchStatus = filterStatus === "all" || r.paymentStatus === filterStatus;
      const d = r.date.slice(0, 10);
      const matchFrom = !dateFrom || d >= dateFrom;
      const matchTo = !dateTo || d <= dateTo;
      const matchSearch = !q || r.receivedFrom.toLowerCase().includes(q) || r.phone.includes(q) || r.receiptNumber.toLowerCase().includes(q) || r.serviceType.toLowerCase().includes(q);
      return matchStatus && matchFrom && matchTo && matchSearch;
    });
  }, [receipts, search, filterStatus, dateFrom, dateTo]);

  // ── Filtered invoices ──
  const filteredInvoices = useMemo(() => {
    const q = search.toLowerCase();
    return invoices.filter((inv) => {
      const matchStatus = filterStatus === "all" || inv.paymentStatus === filterStatus;
      const d = inv.invoiceDate.slice(0, 10);
      const matchFrom = !dateFrom || d >= dateFrom;
      const matchTo = !dateTo || d <= dateTo;
      const matchSearch = !q || inv.clientName.toLowerCase().includes(q) || inv.phone.includes(q) || inv.invoiceNumber.toLowerCase().includes(q);
      return matchStatus && matchFrom && matchTo && matchSearch;
    });
  }, [invoices, search, filterStatus, dateFrom, dateTo]);

  const activeList = tab === "receipts" ? filteredReceipts : filteredInvoices;
  const totalPages = Math.max(1, Math.ceil(activeList.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  // ── Receipt CRUD ──
  const saveReceipt = async (data: Omit<StandaloneReceiptData, "id" | "receiptNumber" | "createdAt" | "updatedAt">) => {
    if (editReceipt) {
      const res = await api.patch<{ data: StandaloneReceiptData }>(`/receipts/${editReceipt.id}`, data);
      setReceipts((p) => p.map((r) => r.id === editReceipt.id ? res.data : r));
      toast.success("রিসিট আপডেট হয়েছে!");
      setEditReceipt(null);
    } else {
      const res = await api.post<{ data: StandaloneReceiptData }>("/receipts", data);
      setReceipts((p) => [res.data, ...p]);
      toast.success("রিসিট তৈরি হয়েছে!");
    }
    setReceiptModal(false);
  };

  const confirmDeleteReceipt = async () => {
    if (!deleteReceiptId) return;
    setDeletingReceipt(true);
    await api.delete(`/receipts/${deleteReceiptId}`).catch(() => {});
    setReceipts((p) => p.filter((r) => r.id !== deleteReceiptId));
    setDeleteReceiptId(null);
    setDeletingReceipt(false);
    toast.success("রিসিট মুছে ফেলা হয়েছে!");
  };

  // ── Invoice CRUD ──
  const saveInvoice = async (data: Omit<StandaloneInvoiceData, "id" | "invoiceNumber" | "createdAt" | "updatedAt">) => {
    if (editInvoice) {
      const res = await api.patch<{ data: StandaloneInvoiceData }>(`/invoices/${editInvoice.id}`, data);
      setInvoices((p) => p.map((inv) => inv.id === editInvoice.id ? { ...res.data, items: res.data.items as never } : inv));
      toast.success("ইনভয়েস আপডেট হয়েছে!");
      setEditInvoice(null);
    } else {
      const res = await api.post<{ data: StandaloneInvoiceData }>("/invoices", data);
      setInvoices((p) => [{ ...res.data, items: res.data.items as never }, ...p]);
      toast.success("ইনভয়েস তৈরি হয়েছে!");
    }
    setInvoiceModal(false);
  };

  const confirmDeleteInvoice = async () => {
    if (!deleteInvoiceId) return;
    setDeletingInvoice(true);
    await api.delete(`/invoices/${deleteInvoiceId}`).catch(() => {});
    setInvoices((p) => p.filter((inv) => inv.id !== deleteInvoiceId));
    setDeleteInvoiceId(null);
    setDeletingInvoice(false);
    toast.success("ইনভয়েস মুছে ফেলা হয়েছে!");
  };

  // ── Receipt columns ──
  const receiptColumns: Column<StandaloneReceiptData>[] = [
    {
      key: "receiptNumber", label: "রিসিট নং",
      render: (r) => <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{r.receiptNumber}</span>,
    },
    {
      key: "date", label: "তারিখ",
      render: (r) => <div className="text-xs text-slate-500">{formatDate(r.date)}</div>,
    },
    {
      key: "receivedFrom", label: "প্রাপক / ফোন",
      render: (r) => (
        <div>
          <div className="font-medium text-slate-800">{r.receivedFrom}</div>
          <div className="text-xs text-slate-400">{r.phone}</div>
        </div>
      ),
    },
    {
      key: "serviceType", label: "সেবা",
      render: (r) => <div className="text-sm text-slate-700">{r.serviceType}</div>,
    },
    {
      key: "amount", label: "মোট / পরিশোধ",
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-800 text-sm">৳{r.amount.toLocaleString()}</div>
          {r.paymentStatus === "partial" && <div className="text-xs text-amber-600">পরিশোধ: ৳{r.paidAmount.toLocaleString()}</div>}
        </div>
      ),
    },
    {
      key: "paymentStatus", label: "পেমেন্ট",
      render: (r) => (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${payStatusClass[r.paymentStatus] ?? "bg-slate-100 text-slate-600"}`}>
          {r.paymentStatus === "paid" ? "Paid" : r.paymentStatus === "partial" ? "Partial" : "Unpaid"}
        </span>
      ),
    },
    {
      key: "_actions" as keyof StandaloneReceiptData, label: "",
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <button onClick={() => setViewReceipt(r)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
            <Receipt size={12} /> View
          </button>
          <button onClick={() => { setEditReceipt(r); setReceiptModal(true); }} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors">
            <Pencil size={12} /> Edit
          </button>
          <button onClick={() => setDeleteReceiptId(r.id)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      ),
    },
  ];

  // ── Invoice columns ──
  const invoiceColumns: Column<StandaloneInvoiceData>[] = [
    {
      key: "invoiceNumber", label: "ইনভয়েস নং",
      render: (r) => <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{r.invoiceNumber}</span>,
    },
    {
      key: "invoiceDate", label: "তারিখ",
      render: (r) => <div className="text-xs text-slate-500">{formatDate(r.invoiceDate)}</div>,
    },
    {
      key: "clientName", label: "ক্লায়েন্ট / ফোন",
      render: (r) => (
        <div>
          <div className="font-medium text-slate-800">{r.clientName}</div>
          <div className="text-xs text-slate-400">{r.phone}</div>
        </div>
      ),
    },
    {
      key: "total", label: "মোট / পরিশোধ",
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-800 text-sm">৳{r.total.toLocaleString()}</div>
          {r.paymentStatus !== "paid" && <div className="text-xs text-amber-600">বাকি: ৳{(r.total - r.paidAmount).toLocaleString()}</div>}
        </div>
      ),
    },
    {
      key: "paymentStatus", label: "পেমেন্ট",
      render: (r) => (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${payStatusClass[r.paymentStatus] ?? "bg-slate-100 text-slate-600"}`}>
          {r.paymentStatus === "paid" ? "Paid" : r.paymentStatus === "partial" ? "Partial" : "Unpaid"}
        </span>
      ),
    },
    {
      key: "createdAt", label: "তৈরির সময়",
      render: (r) => <div className="text-xs text-slate-400">{formatDateTime(r.createdAt)}</div>,
    },
    {
      key: "_actions" as keyof StandaloneInvoiceData, label: "",
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <button onClick={() => setViewInvoice(r)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            <FileText size={12} /> View
          </button>
          <button onClick={() => { setEditInvoice(r); setInvoiceModal(true); }} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors">
            <Pencil size={12} /> Edit
          </button>
          <button onClick={() => setDeleteInvoiceId(r.id)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      ),
    },
  ];

  const paginatedReceipts = filteredReceipts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const paginatedInvoices = filteredInvoices.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div>
      {/* Modals */}
      <ConfirmModal open={!!deleteReceiptId} onConfirm={confirmDeleteReceipt} onCancel={() => setDeleteReceiptId(null)} message="এই রিসিটটি স্থায়ীভাবে মুছে যাবে। আপনি কি নিশ্চিত?" />
      <ConfirmModal open={!!deleteInvoiceId} onConfirm={confirmDeleteInvoice} onCancel={() => setDeleteInvoiceId(null)} message="এই ইনভয়েসটি স্থায়ীভাবে মুছে যাবে। আপনি কি নিশ্চিত?" />

      {receiptModal && (
        <ReceiptFormModal
          initial={editReceipt}
          onSave={saveReceipt}
          onClose={() => { setReceiptModal(false); setEditReceipt(null); }}
        />
      )}
      {invoiceModal && (
        <InvoiceFormModal
          initial={editInvoice}
          onSave={saveInvoice}
          onClose={() => { setInvoiceModal(false); setEditInvoice(null); }}
        />
      )}
      {viewReceipt && <StandaloneReceiptView receipt={viewReceipt} onClose={() => setViewReceipt(null)} />}
      {viewInvoice && <StandaloneInvoiceView invoice={viewInvoice} onClose={() => setViewInvoice(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">রিসিট ও ইনভয়েস</h2>
          <p className="text-sm text-slate-500">
            {tab === "receipts" ? `${filteredReceipts.length}টি রিসিট` : `${filteredInvoices.length}টি ইনভয়েস`} পাওয়া গেছে
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setEditReceipt(null); setReceiptModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Receipt size={15} /> নতুন রিসিট
          </button>
          <button
            onClick={() => { setEditInvoice(null); setInvoiceModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <FileText size={15} /> নতুন ইনভয়েস
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab("receipts")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "receipts" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          <Receipt size={15} /> Money Receipts
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === "receipts" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>{receipts.length}</span>
        </button>
        <button
          onClick={() => setTab("invoices")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "invoices" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          <FileText size={15} /> Invoices
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === "invoices" ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-500"}`}>{invoices.length}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={tab === "receipts" ? "নাম, ফোন, রিসিট নং বা সেবা দিয়ে খুঁজুন..." : "নাম, ফোন বা ইনভয়েস নং দিয়ে খুঁজুন..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="pl-8 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white">
            <option value="all">সব পেমেন্ট</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white text-slate-600" title="তারিখ থেকে" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white text-slate-600" title="তারিখ পর্যন্ত" />
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="px-3 py-2 text-xs font-medium text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap">
            ✕ তারিখ মুছুন
          </button>
        )}
      </div>

      {/* Table */}
      {tab === "receipts" ? (
        <>
          <AdminTable
            columns={receiptColumns}
            data={paginatedReceipts}
            loading={receiptsLoading}
            emptyMessage="কোনো রিসিট পাওয়া যায়নি।"
          />
          <Pagination page={safePage} totalPages={totalPages} total={filteredReceipts.length} onChange={setPage} />
        </>
      ) : (
        <>
          <AdminTable
            columns={invoiceColumns}
            data={paginatedInvoices}
            loading={invoicesLoading}
            emptyMessage="কোনো ইনভয়েস পাওয়া যায়নি।"
          />
          <Pagination page={safePage} totalPages={totalPages} total={filteredInvoices.length} onChange={setPage} />
        </>
      )}
    </div>
  );
}
