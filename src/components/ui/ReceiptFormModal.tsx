"use client";

import { useState } from "react";
import { X, Save } from "lucide-react";
import type { StandaloneReceiptData } from "@/components/ui/StandaloneReceiptView";

interface Props {
  initial?: StandaloneReceiptData | null;
  onSave: (data: Omit<StandaloneReceiptData, "id" | "receiptNumber" | "createdAt" | "updatedAt">) => Promise<void>;
  onClose: () => void;
}

interface FormData {
  date: string;
  receivedFrom: string;
  phone: string;
  address: string;
  serviceType: string;
  paymentMethod: string;
  amount: string;
  paidAmount: string;
  paymentStatus: "unpaid" | "partial" | "paid";
  transactionRef: string;
  notes: string;
}

const today = () => new Date().toISOString().slice(0, 10);

const PAYMENT_METHODS = ["Cash", "bKash", "Nagad", "Bank Transfer", "Cheque", "Other"];
const SERVICE_TYPES = ["Caregiver Service", "Nursing Service", "Nanny Care", "Elder Care", "Stroke & Paralysis Care", "Physiotherapy", "Other"];

const inp = "h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20";
const labelCls = "text-[11px] text-slate-400 uppercase tracking-wide mb-0.5 block";

export default function ReceiptFormModal({ initial, onSave, onClose }: Props) {
  const [form, setForm] = useState<FormData>({
    date: initial?.date?.slice(0, 10) ?? today(),
    receivedFrom: initial?.receivedFrom ?? "",
    phone: initial?.phone ?? "",
    address: initial?.address ?? "",
    serviceType: initial?.serviceType ?? "",
    paymentMethod: initial?.paymentMethod ?? "",
    amount: initial?.amount?.toString() ?? "",
    paidAmount: initial?.paidAmount?.toString() ?? "",
    paymentStatus: (initial?.paymentStatus as FormData["paymentStatus"]) ?? "paid",
    transactionRef: initial?.transactionRef ?? "",
    notes: initial?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof FormData, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleAmountChange = (v: string) => {
    set("amount", v);
    const amt = parseFloat(v) || 0;
    const paid = parseFloat(form.paidAmount) || 0;
    if (paid === 0 || paid >= amt) {
      set("paidAmount", v);
      set("paymentStatus", "paid");
    }
  };

  const handlePaidChange = (v: string) => {
    set("paidAmount", v);
    const amt = parseFloat(form.amount) || 0;
    const paid = parseFloat(v) || 0;
    if (paid <= 0) set("paymentStatus", "unpaid");
    else if (paid >= amt) set("paymentStatus", "paid");
    else set("paymentStatus", "partial");
  };

  const handleSubmit = async () => {
    if (!form.receivedFrom.trim()) return setError("Received From is required");
    if (!form.phone.trim()) return setError("Mobile number is required");
    if (!form.serviceType.trim()) return setError("Service type is required");
    if (!form.paymentMethod.trim()) return setError("Payment method is required");
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) return setError("Valid amount is required");
    setError("");
    setSaving(true);
    try {
      const paidAmount = parseFloat(form.paidAmount) || amount;
      await onSave({
        date: form.date,
        receivedFrom: form.receivedFrom,
        phone: form.phone,
        address: form.address || null,
        serviceType: form.serviceType,
        paymentMethod: form.paymentMethod,
        amount,
        paidAmount,
        paymentStatus: form.paymentStatus,
        transactionRef: form.transactionRef || "",
        notes: form.notes || "",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">{initial ? "Edit Receipt" : "New Money Receipt"}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Fill in the details to generate a receipt</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Date */}
          <div>
            <label className={labelCls}>Receipt Date</label>
            <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className={inp} />
          </div>

          {/* Client info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Received From <span className="text-red-400">*</span></label>
              <input value={form.receivedFrom} onChange={(e) => set("receivedFrom", e.target.value)} placeholder="Client name" className={inp} />
            </div>
            <div>
              <label className={labelCls}>Mobile No. <span className="text-red-400">*</span></label>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="01XXXXXXXXX" className={inp} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Address</label>
            <input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Client address" className={inp} />
          </div>

          {/* Service & Payment method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Service Type <span className="text-red-400">*</span></label>
              <input
                list="svc-list"
                value={form.serviceType}
                onChange={(e) => set("serviceType", e.target.value)}
                placeholder="Select or type..."
                className={inp}
              />
              <datalist id="svc-list">
                {SERVICE_TYPES.map((s) => <option key={s} value={s} />)}
              </datalist>
            </div>
            <div>
              <label className={labelCls}>Payment Method <span className="text-red-400">*</span></label>
              <select value={form.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value)} className={inp}>
                <option value="">Select method</option>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Total Amount (BDT) <span className="text-red-400">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">৳</span>
                <input type="number" min="0" value={form.amount} onChange={(e) => handleAmountChange(e.target.value)} placeholder="0.00" className={`${inp} pl-7`} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Paid Amount (BDT)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">৳</span>
                <input type="number" min="0" value={form.paidAmount} onChange={(e) => handlePaidChange(e.target.value)} placeholder="0.00" className={`${inp} pl-7`} />
              </div>
            </div>
          </div>

          {/* Payment status badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Payment Status:</span>
            {(["unpaid", "partial", "paid"] as const).map((s) => (
              <button
                key={s}
                onClick={() => set("paymentStatus", s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${form.paymentStatus === s
                  ? s === "paid" ? "bg-green-600 text-white" : s === "partial" ? "bg-amber-500 text-white" : "bg-red-500 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
            {form.paymentStatus === "partial" && form.amount && (
              <span className="text-xs text-amber-600 font-semibold ml-auto">
                Due: ৳{(parseFloat(form.amount) - (parseFloat(form.paidAmount) || 0)).toLocaleString()}
              </span>
            )}
          </div>

          {/* Transaction ref */}
          <div>
            <label className={labelCls}>Transaction Reference / ID</label>
            <input value={form.transactionRef} onChange={(e) => set("transactionRef", e.target.value)} placeholder="bKash TrxID, bank ref, etc." className={inp} />
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Notes / Purpose</label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Purpose of payment..."
              rows={2}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            <Save size={15} /> {saving ? "Saving..." : initial ? "Update Receipt" : "Create Receipt"}
          </button>
        </div>
      </div>
    </div>
  );
}
