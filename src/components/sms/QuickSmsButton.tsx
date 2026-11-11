"use client";

import { useState } from "react";
import { MessageSquareText, Send, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import Modal from "@/components/ui/Modal";
import MessageComposer from "./MessageComposer";
import { SmsTemplate, localPhone, normalizePhone } from "@/lib/sms";

/** Small button that opens a one-off SMS composer for a known contact. Reusable on any admin page. */
export default function QuickSmsButton({ phone, name, className, label }: {
  phone: string; name?: string | null; className?: string; label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [sending, setSending] = useState(false);
  const valid = normalizePhone(phone);

  const openModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(true);
    if (!templates.length) api.get<{ data: SmsTemplate[] }>("/sms/templates").then((r) => setTemplates(r.data)).catch(() => {});
  };

  const send = async () => {
    if (!message.trim()) return toast.error("বার্তা লিখুন");
    setSending(true);
    try {
      await api.post("/sms/send", { to: phone, name: name ?? undefined, message });
      toast.success("SMS পাঠানো হয়েছে");
      setMessage(""); setOpen(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : "SMS ব্যর্থ"); } finally { setSending(false); }
  };

  if (!valid) return null;

  return (
    <>
      <button type="button" onClick={openModal} title="SMS পাঠান"
        className={className ?? "p-1 rounded bg-sky-100 text-sky-600 hover:bg-sky-200 transition-colors"}>
        <MessageSquareText size={11} />{label && <span className="ml-1">{label}</span>}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`SMS — ${name ? `${name} · ` : ""}${localPhone(valid)}`}>
        <div className="flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
          <MessageComposer value={message} onChange={setMessage} templates={templates} rows={5} />
          <div className="flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">বাতিল</button>
            <button onClick={send} disabled={sending} className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-60">
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} পাঠান
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
