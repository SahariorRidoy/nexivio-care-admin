"use client";

import { useEffect, useState } from "react";
import {
  X, MapPin, Phone, Copy, Receipt, Trash2, Save, Edit3, ChevronDown, ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { formatDate, formatDateTime, formatTime } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import type { Booking, BookingHistoryEntry } from "@/lib/booking.types";
import { statusLabel, statusClass, paymentStatusClass, type Status } from "@/lib/booking.types";

const STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;
const PAYMENT_STATUSES = ["unpaid", "pending", "paid", "failed"] as const;
const PAYMENT_METHODS = ["bKash", "Nagad", "Rocket", "Cash", "Bank Transfer", "Card", "Other"];

const pricingPeriodLabel: Record<string, { label: string; color: string }> = {
  daily:   { label: "Daily",   color: "bg-sky-100 text-sky-700" },
  weekly:  { label: "Weekly",  color: "bg-violet-100 text-violet-700" },
  monthly: { label: "Monthly", color: "bg-emerald-100 text-emerald-700" },
};

const historyFieldLabel: Record<string, string> = {
  status: "Booking Status",
  paymentStatus: "Payment Status",
  amount: "Amount",
  date: "Date",
  time: "Time",
  paymentMethod: "Payment Method",
  transactionId: "Transaction ID",
};

interface Props {
  booking: Booking;
  services: Record<string, string>;
  onClose: () => void;
  onUpdate: (updated: Booking) => void;
  onDelete: (id: string) => void;
  onOpenReceipt: (b: Booking) => void;
}

export default function BookingDetailModal({ booking, services, onClose, onUpdate, onDelete, onOpenReceipt }: Props) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [form, setForm] = useState({
    status: booking.status as Status,
    paymentStatus: booking.paymentStatus ?? "unpaid",
    amount: booking.amount ? String(booking.amount) : "",
    paymentMethod: booking.paymentMethod ?? "",
    transactionId: booking.transactionId ?? "",
    date: booking.date ?? "",
    time: booking.time ?? "",
    notes: booking.notes ?? "",
    note: "",
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Sync form if booking prop changes
  useEffect(() => {
    setForm({
      status: booking.status as Status,
      paymentStatus: booking.paymentStatus ?? "unpaid",
      amount: booking.amount ? String(booking.amount) : "",
      paymentMethod: booking.paymentMethod ?? "",
      transactionId: booking.transactionId ?? "",
      date: booking.date ?? "",
      time: booking.time ?? "",
      notes: booking.notes ?? "",
      note: "",
    });
  }, [booking]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        status: form.status,
        paymentStatus: form.paymentStatus,
        amount: form.amount ? parseFloat(form.amount) : undefined,
        paymentMethod: form.paymentMethod || undefined,
        transactionId: form.transactionId || undefined,
        date: form.date || undefined,
        time: form.time || undefined,
        notes: form.notes || undefined,
        changedBy: user?.name ?? user?.email ?? "Admin",
        note: form.note || undefined,
      };
      const res = await api.patch<{ data: Booking }>(`/bookings/${booking.id}`, payload);
      onUpdate(res.data);
      toast.success("বুকিং আপডেট হয়েছে!");
      setEditMode(false);
      setForm((f) => ({ ...f, note: "" }));
    } catch {
      toast.error("আপডেট ব্যর্থ হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  const serviceName = services[booking.serviceType] ?? booking.serviceType;
  const initials = booking.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const history: BookingHistoryEntry[] = booking.history ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 px-6 pt-5 pb-10 shrink-0 relative">
          <button onClick={onClose} className="absolute cursor-pointer top-4 right-4 p-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors">
            <X size={16} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-white text-xl font-bold shrink-0">
              {initials}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">{booking.name}</h3>
              <p className="text-primary-100 text-sm mt-0.5">{booking.phone}</p>
              {booking.address && <p className="text-primary-100 text-sm mt-0.5 flex items-center gap-1"><MapPin size={11} />{booking.address}</p>}
            </div>
          </div>
        </div>

        {/* ID + Receipt bar */}
        <div className="mx-6 -mt-5 mb-1 shrink-0 z-10 relative">
          <div className="bg-white rounded-xl shadow-md border border-slate-100 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Receipt</span>
              <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                {booking.receiptNumber ?? "—"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenReceipt(booking)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
              >
                <Receipt size={13} /> View Receipt
              </button>
              <button
                onClick={() => setEditMode((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${editMode ? "bg-amber-100 text-amber-700" : "bg-primary-50 text-primary-600 hover:bg-primary-100"}`}
              >
                <Edit3 size={13} /> {editMode ? "Cancel Edit" : "Edit"}
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-4 flex-1 space-y-5">

          {/* Booker + Patient */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">বুকারের তথ্য</p>
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-slate-800">{booking.name}</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-slate-600">{booking.phone}</span>
                  <a href={`tel:${booking.phone}`} className="p-1 rounded bg-green-100 text-green-600 hover:bg-green-200 transition-colors"><Phone size={11} /></a>
                  <button onClick={() => { navigator.clipboard.writeText(booking.phone); toast.success("কপি হয়েছে!"); }} className="p-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"><Copy size={11} /></button>
                </div>
                {booking.address && <p className="text-xs text-slate-400 flex items-center gap-1"><MapPin size={10} />{booking.address}</p>}
              </div>
            </div>
            {(booking.patientName || booking.patientGender || booking.relationship) && (
              <div className="border-l border-slate-100 pl-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">রোগীর তথ্য</p>
                <div className="space-y-1.5">
                  {booking.patientName && <p className="text-sm font-semibold text-slate-800">{booking.patientName}</p>}
                  {booking.patientGender && <p className="text-xs text-slate-500">{booking.patientGender}</p>}
                  {booking.relationship && <p className="text-xs text-slate-400">সম্পর্ক: {booking.relationship}</p>}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100" />

          {/* Service Info */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">সেবার তথ্য</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">সেবার ধরন</p>
                <p className="text-sm font-bold text-primary-600">{serviceName}</p>
              </div>
              {booking.packageName && (
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">প্যাকেজ</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-slate-700">{booking.packageName}</p>
                    {booking.pricingPeriod && (() => {
                      const p = pricingPeriodLabel[booking.pricingPeriod];
                      return p ? <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${p.color}`}>{p.label}</span> : null;
                    })()}
                  </div>
                </div>
              )}
              {/* Editable date */}
              <div>
                <p className="text-xs text-slate-400 mb-0.5">তারিখ</p>
                {editMode ? (
                  <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-300 w-full" />
                ) : (
                  <p className="text-sm font-semibold text-slate-700">{booking.date ? formatDate(booking.date) : "—"}</p>
                )}
              </div>
              {/* Editable time */}
              <div>
                <p className="text-xs text-slate-400 mb-0.5">সময়</p>
                {editMode ? (
                  <input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                    className="text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-300 w-full" />
                ) : (
                  <p className="text-sm font-semibold text-slate-700">{booking.time ? formatTime(booking.time) : "—"}</p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Payment + Status — always editable in edit mode */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">পেমেন্ট ও অবস্থা</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">

              {/* Booking Status */}
              <div>
                <p className="text-xs text-slate-400 mb-1">বুকিং অবস্থা</p>
                {editMode ? (
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Status }))}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-primary-300 w-full ${statusClass[form.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {STATUSES.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
                  </select>
                ) : (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusClass[booking.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {statusLabel[booking.status] ?? booking.status}
                  </span>
                )}
              </div>

              {/* Payment Status */}
              <div>
                <p className="text-xs text-slate-400 mb-1">পেমেন্ট অবস্থা</p>
                {editMode ? (
                  <select value={form.paymentStatus} onChange={(e) => setForm((f) => ({ ...f, paymentStatus: e.target.value }))}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-primary-300 w-full ${paymentStatusClass[form.paymentStatus] ?? "bg-slate-100 text-slate-600"}`}>
                    {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${paymentStatusClass[booking.paymentStatus ?? "unpaid"] ?? "bg-slate-100 text-slate-600"}`}>
                    {booking.paymentStatus ?? "unpaid"}
                  </span>
                )}
              </div>

              {/* Amount */}
              <div>
                <p className="text-xs text-slate-400 mb-1">পরিমাণ (৳)</p>
                {editMode ? (
                  <input type="number" min="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                    className="text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-300 w-full" />
                ) : (
                  <p className="text-sm font-bold text-emerald-600">{booking.amount ? `৳${booking.amount.toLocaleString()}` : "—"}</p>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <p className="text-xs text-slate-400 mb-1">পেমেন্ট পদ্ধতি</p>
                {editMode ? (
                  <select value={form.paymentMethod} onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                    className="text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-300 w-full bg-white">
                    <option value="">— নির্বাচন করুন —</option>
                    {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                ) : (
                  <p className="text-sm font-semibold text-slate-700">{booking.paymentMethod ?? "—"}</p>
                )}
              </div>

              {/* Transaction ID */}
              <div className="col-span-2">
                <p className="text-xs text-slate-400 mb-1">ট্রানজেকশন আইডি</p>
                {editMode ? (
                  <input type="text" value={form.transactionId} onChange={(e) => setForm((f) => ({ ...f, transactionId: e.target.value }))}
                    placeholder="Transaction ID"
                    className="text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-300 w-full" />
                ) : (
                  <p className="text-xs font-mono font-semibold text-slate-600">{booking.transactionId ?? "—"}</p>
                )}
              </div>

              {/* Notes */}
              <div className="col-span-2">
                <p className="text-xs text-slate-400 mb-1">নোট</p>
                {editMode ? (
                  <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    rows={2} placeholder="বুকিং সম্পর্কে নোট..."
                    className="text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-300 w-full resize-none" />
                ) : (
                  <p className="text-sm text-slate-600">{booking.notes ?? "—"}</p>
                )}
              </div>

              {/* Change note (only in edit mode) */}
              {editMode && (
                <div className="col-span-2">
                  <p className="text-xs text-slate-400 mb-1">পরিবর্তনের কারণ (ঐচ্ছিক)</p>
                  <input type="text" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                    placeholder="কেন পরিবর্তন করা হচ্ছে..."
                    className="text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-300 w-full" />
                </div>
              )}
            </div>
          </div>

          {/* History toggle */}
          {history.length > 0 && (
            <>
              <div className="border-t border-slate-100" />
              <div>
                <button
                  onClick={() => setShowHistory((v) => !v)}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  পরিবর্তনের ইতিহাস ({history.length}টি)
                </button>
                {showHistory && (
                  <div className="mt-3 space-y-2">
                    {history.map((h) => (
                      <div key={h.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-slate-700">{historyFieldLabel[h.field] ?? h.field}</span>
                            <span className="text-xs text-slate-400">পরিবর্তিত হয়েছে</span>
                            {h.changedBy && <span className="text-xs text-primary-600 font-medium">by {h.changedBy}</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-red-50 text-red-500 px-1.5 py-0.5 rounded line-through">{h.oldValue ?? "—"}</span>
                            <span className="text-slate-300 text-xs">→</span>
                            <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-semibold">{h.newValue ?? "—"}</span>
                          </div>
                          {h.note && <p className="text-xs text-slate-400 mt-1 italic">&quot;{h.note}&quot;</p>}
                          <p className="text-[10px] text-slate-300 mt-1">{formatDateTime(h.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 shrink-0 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <p className="text-xs text-slate-400">জমার তারিখ: <span className="font-medium text-slate-500">{formatDateTime(booking.createdAt)}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDelete(booking.id)}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-white px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-500 transition-colors cursor-pointer"
            >
              <Trash2 size={12} /> Delete
            </button>
            {editMode && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 px-4 py-1.5 rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
              >
                <Save size={12} /> {saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
