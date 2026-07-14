"use client";

import { Trash2 } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message?: string;
}

export default function ConfirmModal({ open, onConfirm, onCancel, message = "আপনি কি এটি মুছে ফেলতে চান?" }: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <Trash2 size={22} className="text-red-600" />
        </div>
        <div className="text-center">
          <h3 className="text-base font-bold text-slate-800 mb-1">নিশ্চিত করুন</h3>
          <p className="text-sm text-slate-500">{message}</p>
        </div>
        <div className="flex gap-3 w-full">
          <button onClick={onCancel} className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            বাতিল
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">
            হ্যাঁ, মুছুন
          </button>
        </div>
      </div>
    </div>
  );
}
