"use client";

import { Loader2, Trash2, Pencil, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface AdminTableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  loading: boolean;
  onEdit?: (row: T) => void;
  onDelete?: (id: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  emptyMessage?: string;
}

export default function AdminTable<T extends { id: string }>({
  columns,
  data,
  loading,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  emptyMessage = "কোনো তথ্য পাওয়া যায়নি।",
}: AdminTableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-primary-600" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400 text-sm">{emptyMessage}</div>
    );
  }

  const hasActions = onEdit || onDelete || onApprove || onReject;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} className={cn("px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider", col.className)}>
                {col.label}
              </th>
            ))}
            {hasActions && (
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                কার্যক্রম
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 bg-white">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50 transition-colors">
              {columns.map((col) => (
                <td key={String(col.key)} className={cn("px-4 py-3 text-slate-700", col.className)}>
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[String(col.key)] ?? "—")}
                </td>
              ))}
              {hasActions && (
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 justify-end">
                    {onApprove && (
                      <button
                        onClick={() => onApprove(row.id)}
                        className="p-1.5 rounded-md text-green-600 hover:bg-green-50 transition-colors"
                        title="অনুমোদন"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    {onReject && (
                      <button
                        onClick={() => onReject(row.id)}
                        className="p-1.5 rounded-md text-orange-500 hover:bg-orange-50 transition-colors"
                        title="প্রত্যাখ্যান"
                      >
                        <XCircle size={16} />
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(row)}
                        className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                        title="সম্পাদনা"
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(row.id)}
                        className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                        title="মুছুন"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
