"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Download, FileText, Send } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import MessageComposer from "./MessageComposer";
import { STARTER_TEMPLATES, SmsTemplate, TEMPLATE_CATEGORIES, inp, segmentInfo } from "@/lib/sms";

interface Props {
  templates: SmsTemplate[];
  reload: () => void;
  onUse: (t: SmsTemplate) => void;
}

export default function TemplatesTab({ templates, reload, onUse }: Props) {
  const [editing, setEditing] = useState<Partial<SmsTemplate> | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<SmsTemplate | null>(null);
  const [cat, setCat] = useState("all");

  const save = async () => {
    if (!editing?.name?.trim() || !editing.body?.trim()) return toast.error("নাম ও বার্তা দিন");
    setSaving(true);
    try {
      const body = { name: editing.name, category: editing.category ?? "general", body: editing.body };
      if (editing.id) await api.patch(`/sms/templates/${editing.id}`, body);
      else await api.post("/sms/templates", body);
      toast.success("টেমপ্লেট সংরক্ষিত হয়েছে");
      setEditing(null); reload();
    } catch (e) { toast.error(e instanceof Error ? e.message : "ব্যর্থ"); } finally { setSaving(false); }
  };

  const remove = async () => {
    if (!deleting) return;
    try { await api.delete(`/sms/templates/${deleting.id}`); toast.success("মুছে ফেলা হয়েছে"); reload(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "ব্যর্থ"); } finally { setDeleting(null); }
  };

  const importStarters = async () => {
    const missing = STARTER_TEMPLATES.filter((s) => !templates.some((t) => t.body === s.body));
    if (!missing.length) return toast("সব ডিফল্ট টেমপ্লেট আগেই আছে");
    try {
      for (const t of missing) await api.post("/sms/templates", t);
      toast.success(`${missing.length}টি টেমপ্লেট যোগ হয়েছে`); reload();
    } catch (e) { toast.error(e instanceof Error ? e.message : "ব্যর্থ"); }
  };

  const shown = cat === "all" ? templates : templates.filter((t) => t.category === cat);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[{ value: "all", label: "সব" }, ...TEMPLATE_CATEGORIES].map((c) => (
            <button key={c.value} onClick={() => setCat(c.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${cat === c.value ? "bg-primary-700 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={importStarters} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
            <Download size={13} /> ডিফল্ট টেমপ্লেট যোগ করুন
          </button>
          <button onClick={() => setEditing({ category: "general", body: "" })} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-700 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-800">
            <Plus size={13} /> নতুন টেমপ্লেট
          </button>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-14 text-center">
          <FileText className="mx-auto text-slate-300" />
          <p className="mt-2 text-sm text-slate-400">কোনো টেমপ্লেট নেই</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {shown.map((t) => {
            const info = segmentInfo(t.body);
            return (
              <div key={t.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-800 text-sm">{t.name}</p>
                  <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                    {TEMPLATE_CATEGORIES.find((c) => c.value === t.category)?.label ?? t.category}
                  </span>
                </div>
                <p className="mt-2 flex-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-600">{t.body}</p>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-[10px] text-slate-400">{info.len} অক্ষর · {info.segments} SMS{info.unicode ? " · বাংলা" : ""}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => onUse(t)} title="ব্যবহার করুন" className="rounded-md p-1.5 text-primary-700 hover:bg-primary-50"><Send size={13} /></button>
                    <button onClick={() => setEditing(t)} title="এডিট" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"><Pencil size={13} /></button>
                    <button onClick={() => setDeleting(t)} title="মুছুন" className="rounded-md p-1.5 text-red-500 hover:bg-red-50"><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "টেমপ্লেট এডিট" : "নতুন টেমপ্লেট"}>
        {editing && (
          <div className="flex flex-col gap-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">নাম *</label>
                <input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={inp} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">ক্যাটাগরি</label>
                <select value={editing.category ?? "general"} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className={inp}>
                  {TEMPLATE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <MessageComposer value={editing.body ?? ""} onChange={(v) => setEditing({ ...editing, body: v })} templates={[]} rows={5} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">বাতিল</button>
              <button onClick={save} disabled={saving} className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-60">
                {saving ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal open={!!deleting} onCancel={() => setDeleting(null)} onConfirm={remove} message={`"${deleting?.name}" টেমপ্লেটটি মুছে ফেলবেন?`} />
    </div>
  );
}
