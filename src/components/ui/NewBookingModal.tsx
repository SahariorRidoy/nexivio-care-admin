"use client";

import { useState } from "react";
import { X, Save } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { Booking } from "@/lib/booking.types";

const PAYMENT_METHODS = ["bKash", "Nagad", "Rocket", "Cash", "Bank Transfer", "Card", "Other"];
const PRICING_PERIODS = ["daily", "weekly", "monthly"] as const;
const PAYMENT_STATUSES = ["unpaid", "pending", "paid", "failed"] as const;
const STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;

interface Props {
  services: Record<string, string>;
  onClose: () => void;
  onCreate: (booking: Booking) => void;
}

const empty = {
  name: "", phone: "", address: "",
  patientName: "", patientGender: "", relationship: "",
  serviceType: "", packageName: "", pricingPeriod: "" as string,
  date: "", time: "",
  paymentMethod: "", amount: "", paymentStatus: "unpaid", transactionId: "",
  status: "pending", notes: "",
};

export default function NewBookingModal({ services, onClose, onCreate }: Props) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.serviceType) {
      toast.error("নাম, ফোন এবং সেবার ধরন আবশ্যক");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address || undefined,
        patientName: form.patientName || undefined,
        patientGender: form.patientGender || undefined,
        relationship: form.relationship || undefined,
        serviceType: form.serviceType,
        packageName: form.packageName || undefined,
        pricingPeriod: (form.pricingPeriod as "daily" | "weekly" | "monthly") || undefined,
        date: form.date || undefined,
        time: form.time || undefined,
        paymentMethod: form.paymentMethod || undefined,
        amount: form.amount ? parseFloat(form.amount) : undefined,
        paymentStatus: form.paymentStatus,
        transactionId: form.transactionId || undefined,
        notes: form.notes || undefined,
        status: form.status,
      };
      const res = await api.post<{ data: Booking }>("/bookings/admin/create", payload);
      onCreate(res.data);
    } catch {
      toast.error("বুকিং তৈরি ব্যর্থ হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  const serviceOptions = Object.entries(services);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-800">নতুন বুকিং তৈরি করুন</h3>
            <p className="text-xs text-slate-400 mt-0.5">অ্যাডমিন প্যানেল থেকে বুকিং</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Booker Info */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">বুকারের তথ্য</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 font-medium mb-1 block">নাম *</label>
                <input required value={form.name} onChange={set("name")} placeholder="পূর্ণ নাম"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300" />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium mb-1 block">ফোন *</label>
                <input required value={form.phone} onChange={set("phone")} placeholder="01XXXXXXXXX"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-500 font-medium mb-1 block">ঠিকানা</label>
                <input value={form.address} onChange={set("address")} placeholder="সম্পূর্ণ ঠিকানা"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300" />
              </div>
            </div>
          </section>

          <div className="border-t border-slate-100" />

          {/* Patient Info */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">রোগীর তথ্য (ঐচ্ছিক)</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-500 font-medium mb-1 block">রোগীর নাম</label>
                <input value={form.patientName} onChange={set("patientName")} placeholder="রোগীর নাম"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300" />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium mb-1 block">লিঙ্গ</label>
                <select value={form.patientGender} onChange={set("patientGender")}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white">
                  <option value="">— নির্বাচন —</option>
                  <option value="Male">পুরুষ</option>
                  <option value="Female">মহিলা</option>
                  <option value="Other">অন্যান্য</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium mb-1 block">সম্পর্ক</label>
                <input value={form.relationship} onChange={set("relationship")} placeholder="যেমন: বাবা, মা"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300" />
              </div>
            </div>
          </section>

          <div className="border-t border-slate-100" />

          {/* Service Info */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">সেবার তথ্য</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 font-medium mb-1 block">সেবার ধরন *</label>
                <select required value={form.serviceType} onChange={set("serviceType")}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white">
                  <option value="">— সেবা নির্বাচন করুন —</option>
                  {serviceOptions.map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium mb-1 block">প্যাকেজ</label>
                <input value={form.packageName} onChange={set("packageName")} placeholder="প্যাকেজের নাম"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300" />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium mb-1 block">মূল্য পিরিয়ড</label>
                <select value={form.pricingPeriod} onChange={set("pricingPeriod")}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white">
                  <option value="">— নির্বাচন —</option>
                  {PRICING_PERIODS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium mb-1 block">বুকিং অবস্থা</label>
                <select value={form.status} onChange={set("status")}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white">
                  {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium mb-1 block">তারিখ</label>
                <input type="date" value={form.date} onChange={set("date")}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300" />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium mb-1 block">সময়</label>
                <input type="time" value={form.time} onChange={set("time")}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300" />
              </div>
            </div>
          </section>

          <div className="border-t border-slate-100" />

          {/* Payment Info */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">পেমেন্টের তথ্য</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 font-medium mb-1 block">পরিমাণ (৳)</label>
                <input type="number" min="0" step="0.01" value={form.amount} onChange={set("amount")} placeholder="0.00"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300" />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium mb-1 block">পেমেন্ট অবস্থা</label>
                <select value={form.paymentStatus} onChange={set("paymentStatus")}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white">
                  {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium mb-1 block">পেমেন্ট পদ্ধতি</label>
                <select value={form.paymentMethod} onChange={set("paymentMethod")}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white">
                  <option value="">— নির্বাচন —</option>
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium mb-1 block">ট্রানজেকশন আইডি</label>
                <input value={form.transactionId} onChange={set("transactionId")} placeholder="TXN ID"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-500 font-medium mb-1 block">নোট</label>
                <textarea value={form.notes} onChange={set("notes")} rows={2} placeholder="অতিরিক্ত তথ্য..."
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none" />
              </div>
            </div>
          </section>
        </form>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 shrink-0 flex items-center justify-end gap-2 bg-slate-50">
          <button onClick={onClose} className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
            বাতিল
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 px-5 py-2 rounded-lg transition-colors disabled:opacity-60"
          >
            <Save size={13} /> {saving ? "তৈরি হচ্ছে..." : "বুকিং তৈরি করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}
