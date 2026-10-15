"use client";

import { useState } from "react";
import { X, Save, Plus, Trash2 } from "lucide-react";
import type { StandaloneInvoiceData, InvoiceItem } from "@/components/ui/StandaloneInvoiceView";

interface Props {
  initial?: StandaloneInvoiceData | null;
  onSave: (data: Omit<StandaloneInvoiceData, "id" | "invoiceNumber" | "createdAt" | "updatedAt">) => Promise<void>;
  onClose: () => void;
}

interface FormData {
  invoiceDate: string;
  clientName: string;
  phone: string;
  email: string;
  address: string;
  discount: string;
  paidAmount: string;
  paymentStatus: "unpaid" | "partial" | "paid";
  paymentMethod: string;
  transactionRef: string;
  notes: string;
}

const today = () => new Date().toISOString().slice(0, 10);
const PAYMENT_METHODS = ["Cash", "bKash", "Nagad", "Bank Transfer", "Cheque", "Other"];
const SERVICE_SUGGESTIONS = ["Caregiver Service", "Nursing Service", "Nanny Care", "Elder Care", "Stroke & Paralysis Care", "Physiotherapy", "Home Visit", "Other"];

const inp = "h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20";
const labelCls = "text-[11px] text-slate-400 uppercase tracking-wide mb-0.5 block";

const emptyItem = (): InvoiceItem => ({ service: "", package: "", rate: 0, days: 1, amount: 0 });

export default function InvoiceFormModal({ initial, onSave, onClose }: Props) {
  const [form, setForm] = useState<FormData>({
    invoiceDate: initial?.invoiceDate?.slice(0, 10) ?? today(),
    clientName: initial?.clientName ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    address: initial?.address ?? "",
    discount: initial?.discount?.toString() ?? "0",
    paidAmount: initial?.paidAmount?.toString() ?? "0",
    paymentStatus: (initial?.paymentStatus as FormData["paymentStatus"]) ?? "unpaid",
    paymentMethod: initial?.paymentMethod ?? "",
    transactionRef: initial?.transactionRef ?? "",
    notes: initial?.notes ?? "",
  });
  const [items, setItems] = useState<InvoiceItem[]>(
    initial?.items?.length ? initial.items : [emptyItem()]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof FormData, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const updateItem = (i: number, k: keyof InvoiceItem, v: string | number) => {
    setItems((prev) => {
      const next = prev.map((item, idx) => {
        if (idx !== i) return item;
        const updated = { ...item, [k]: v };
        if (k === "rate" || k === "days") {
          updated.amount = (Number(k === "rate" ? v : updated.rate) || 0) * (Number(k === "days" ? v : updated.days) || 0);
        }
        return updated;
      });
      return next;
    });
  };

  const subtotal = items.reduce((s, it) => s + (it.amount || 0), 0);
  const discount = parseFloat(form.discount) || 0;
  const total = Math.max(0, subtotal - discount);
  const paidAmount = parseFloat(form.paidAmount) || 0;
  const due = Math.max(0, total - paidAmount);

  const handlePaidChange = (v: string) => {
    set("paidAmount", v);
    const paid = parseFloat(v) || 0;
    if (paid <= 0) set("paymentStatus", "unpaid");
    else if (paid >= total) set("paymentStatus", "paid");
    else set("paymentStatus", "partial");
  };

  const handleSubmit = async () => {
    if (!form.clientName.trim()) return setError("Client name is required");
    if (!form.phone.trim()) return setError("Mobile number is required");
    if (!form.address.trim()) return setError("Address is required");
    if (items.some((it) => !it.service.trim())) return setError("All service rows must have a description");
    if (total <= 0) return setError("Total amount must be greater than 0");
    setError("");
    setSaving(true);
    try {
      await onSave({
        invoiceDate: form.invoiceDate,
        clientName: form.clientName,
        phone: form.phone,
        email: form.email || null,
        address: form.address,
        items,
        subtotal,
        discount,
        total,
        paidAmount,
        paymentStatus: form.paymentStatus,
        paymentMethod: form.paymentMethod || "",
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
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">{initial ? "Edit Invoice" : "New Invoice"}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Fill in the details to generate an invoice</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Invoice date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Invoice Date</label>
              <input type="date" value={form.invoiceDate} onChange={(e) => set("invoiceDate", e.target.value)} className={inp} />
            </div>
          </div>

          {/* Client info */}
          <div className="p-4 bg-slate-50 rounded-xl space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Client Information</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Client Name <span className="text-red-400">*</span></label>
                <input value={form.clientName} onChange={(e) => set("clientName", e.target.value)} placeholder="Full name" className={inp} />
              </div>
              <div>
                <label className={labelCls}>Mobile No. <span className="text-red-400">*</span></label>
                <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="01XXXXXXXXX" className={inp} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Email (optional)</label>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="client@email.com" className={inp} />
              </div>
              <div>
                <label className={labelCls}>Address <span className="text-red-400">*</span></label>
                <input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Client address" className={inp} />
              </div>
            </div>
          </div>

          {/* Service items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Services</p>
              <button
                onClick={() => setItems((p) => [...p, emptyItem()])}
                className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
              >
                <Plus size={13} /> Add Row
              </button>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="px-3 py-2 text-left font-semibold">Service Description</th>
                    <th className="px-3 py-2 text-left font-semibold w-28">Package</th>
                    <th className="px-3 py-2 text-right font-semibold w-24">Rate (৳)</th>
                    <th className="px-3 py-2 text-center font-semibold w-16">Days</th>
                    <th className="px-3 py-2 text-right font-semibold w-24">Amount (৳)</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-2 py-1.5">
                        <input
                          list="svc-suggestions"
                          value={item.service}
                          onChange={(e) => updateItem(i, "service", e.target.value)}
                          placeholder="Service name..."
                          className="h-8 w-full rounded-md border border-slate-200 px-2 text-xs focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400/20"
                        />
                        <datalist id="svc-suggestions">
                          {SERVICE_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
                        </datalist>
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          value={item.package ?? ""}
                          onChange={(e) => updateItem(i, "package", e.target.value)}
                          placeholder="Package..."
                          className="h-8 w-full rounded-md border border-slate-200 px-2 text-xs focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400/20"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number" min="0"
                          value={item.rate || ""}
                          onChange={(e) => updateItem(i, "rate", parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="h-8 w-full rounded-md border border-slate-200 px-2 text-xs text-right focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400/20"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number" min="0"
                          value={item.days || ""}
                          onChange={(e) => updateItem(i, "days", parseFloat(e.target.value) || 0)}
                          placeholder="1"
                          className="h-8 w-full rounded-md border border-slate-200 px-2 text-xs text-center focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400/20"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-right font-semibold text-slate-700">
                        {item.amount > 0 ? item.amount.toLocaleString() : "—"}
                      </td>
                      <td className="px-1 py-1.5">
                        {items.length > 1 && (
                          <button onClick={() => setItems((p) => p.filter((_, idx) => idx !== i))} className="p-1 text-red-400 hover:text-red-600 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1.5">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold">৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Discount (৳)</span>
                <input
                  type="number" min="0"
                  value={form.discount}
                  onChange={(e) => set("discount", e.target.value)}
                  className="h-7 w-28 rounded-md border border-slate-200 px-2 text-xs text-right focus:border-primary-400 focus:outline-none"
                />
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-800 border-t border-slate-200 pt-1.5">
                <span>Total</span>
                <span className="text-primary-700">৳{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="p-4 bg-slate-50 rounded-xl space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Payment Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Payment Method</label>
                <select value={form.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value)} className={inp}>
                  <option value="">Select method</option>
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Paid Amount (৳)</label>
                <input type="number" min="0" value={form.paidAmount} onChange={(e) => handlePaidChange(e.target.value)} placeholder="0" className={inp} />
              </div>
            </div>
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
              {due > 0 && <span className="text-xs text-amber-600 font-semibold ml-auto">Due: ৳{due.toLocaleString()}</span>}
            </div>
            <div>
              <label className={labelCls}>Transaction Reference</label>
              <input value={form.transactionRef} onChange={(e) => set("transactionRef", e.target.value)} placeholder="TrxID, bank ref, etc." className={inp} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Additional notes..."
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
            <Save size={15} /> {saving ? "Saving..." : initial ? "Update Invoice" : "Create Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}
