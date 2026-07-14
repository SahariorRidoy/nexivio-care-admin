"use client";

import { useEffect, useState } from "react";
import AdminTable, { type Column } from "@/components/ui/AdminTable";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function ContactsPage() {
  const [data, setData] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ data: Contact[] }>("/contacts")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggleRead = async (id: string, current: boolean) => {
    setTogglingId(id);
    try {
      await api.patch(`/contacts/${id}`, { isRead: !current });
      setData((prev) => prev.map((c) => c.id === id ? { ...c, isRead: !current } : c));
    } catch { alert("আপডেট ব্যর্থ হয়েছে"); }
    finally { setTogglingId(null); }
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/contacts/${id}`).catch(() => {});
    setData((prev) => prev.filter((c) => c.id !== id));
  };

  const unread = data.filter((c) => !c.isRead).length;

  const columns: Column<Contact>[] = [
    {
      key: "isRead", label: "",
      render: (r) => (
        <span className={`inline-block h-2 w-2 rounded-full ${r.isRead ? "bg-slate-200" : "bg-primary-500"}`} />
      ),
    },
    { key: "name", label: "নাম", render: (r) => <span className={r.isRead ? "text-slate-500" : "font-semibold text-slate-800"}>{r.name}</span> },
    { key: "phone", label: "ফোন" },
    { key: "email", label: "ইমেইল", render: (r) => <span className="text-slate-500">{r.email || "—"}</span> },
    { key: "subject", label: "বিষয়" },
    { key: "message", label: "বার্তা", className: "max-w-xs", render: (r) => <span className="block truncate text-slate-500 max-w-xs" title={r.message}>{r.message}</span> },
    {
      key: "isRead", label: "অবস্থা",
      render: (r) => (
        <button
          disabled={togglingId === r.id}
          onClick={() => handleToggleRead(r.id, r.isRead)}
          className={`text-xs font-medium px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
            r.isRead ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-primary-100 text-primary-700 hover:bg-primary-200"
          }`}
        >
          {r.isRead ? "পঠিত" : "অপঠিত"}
        </button>
      ),
    },
    { key: "createdAt", label: "তারিখ", render: (r) => formatDate(r.createdAt) },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">যোগাযোগ বার্তাসমূহ</h2>
          <p className="text-sm text-slate-500">
            {data.length}টি বার্তা
            {unread > 0 && <span className="ml-1 text-primary-600 font-medium">· {unread}টি অপঠিত</span>}
          </p>
        </div>
      </div>
      <AdminTable columns={columns} data={data} loading={loading} onDelete={handleDelete} />
    </div>
  );
}
