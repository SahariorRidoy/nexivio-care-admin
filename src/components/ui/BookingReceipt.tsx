"use client";

import { useRef, useState } from "react";
import { X, Download, Printer, Share2, MessageCircle, Mail, Copy, Check } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export interface ReceiptBooking {
  id: string;
  receiptNumber?: string | null;
  name: string;
  phone: string;
  address?: string | null;
  patientName?: string | null;
  patientGender?: string | null;
  relationship?: string | null;
  serviceType: string;
  packageName?: string | null;
  pricingPeriod?: string | null;
  date?: string | null;
  time?: string | null;
  paymentMethod?: string | null;
  amount?: number | null;
  paymentStatus?: string | null;
  transactionId?: string | null;
  notes?: string | null;
  status: string;
  createdAt: string;
}

interface Props {
  booking: ReceiptBooking;
  serviceName: string;
  onClose: () => void;
}

const paymentStatusColor: Record<string, string> = {
  paid: "#16a34a",
  unpaid: "#d97706",
  pending: "#64748b",
  failed: "#dc2626",
};

const statusColor: Record<string, string> = {
  confirmed: "#16a34a",
  completed: "#2563eb",
  pending: "#d97706",
  cancelled: "#dc2626",
};

function formatDateEn(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric", month: "long", day: "numeric",
  });
}

function formatTimeEn(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export default function BookingReceipt({ booking, serviceName, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const rcptNo = booking.receiptNumber ?? `RCP-${booking.id.slice(0, 8).toUpperCase()}`;

  const handleDownload = async () => {
    const blob = await getPdfBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `Receipt-${rcptNo}.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = async () => {
    const canvas = await getCanvas();
    if (!canvas) return;
    const imgData = canvas.toDataURL("image/png");

    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;border:0;visibility:hidden;";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Receipt - ${rcptNo}</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#fff;}img{width:100%;display:block;}@media print{@page{margin:0;size:A4;}body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}</style></head><body><img src="${imgData}"/></body></html>`);
    doc.close();

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
  };

  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const getCanvas = async () => {
    const content = printRef.current;
    if (!content) return null;
    return html2canvas(content, { scale: 2, useCORS: true });
  };

  const getPdfBlob = async (): Promise<Blob | null> => {
    const canvas = await getCanvas();
    if (!canvas) return null;
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width / 2, canvas.height / 2] });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
    return pdf.output("blob");
  };

  const handleShareWhatsApp = async () => {
    const blob = await getPdfBlob();
    if (!blob) return;
    const file = new File([blob], `Receipt-${rcptNo}.pdf`, { type: "application/pdf" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: `Receipt ${rcptNo}` });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `Receipt-${rcptNo}.pdf`; a.click();
      URL.revokeObjectURL(url);
      window.open(`https://web.whatsapp.com/`, "_blank");
    }
    setShowShare(false);
  };

  const handleShareEmail = async () => {
    const blob = await getPdfBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `Receipt-${rcptNo}.pdf`; a.click();
    URL.revokeObjectURL(url);
    const subject = `Receipt ${rcptNo} - Nexivio Care`;
    const body = `Dear ${booking.name},\n\nPlease find your receipt (downloaded) attached.\n\nThank you for choosing Nexivio Care.`;
    setTimeout(() => window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_self"), 300);
    setShowShare(false);
  };

  const handleCopyPdf = async () => {
    const blob = await getPdfBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `Receipt-${rcptNo}.pdf`; a.click();
    URL.revokeObjectURL(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowShare(false);
  };

  const handleNativeShare = async () => {
    const blob = await getPdfBlob();
    if (!blob) return;
    const file = new File([blob], `Receipt-${rcptNo}.pdf`, { type: "application/pdf" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: `Receipt ${rcptNo}`, text: `Nexivio Care Receipt - ${booking.name}` });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `Receipt-${rcptNo}.pdf`; a.click();
      URL.revokeObjectURL(url);
    }
    setShowShare(false);
  };

  const issuedDate = formatDateEn(booking.createdAt);
  const pStatus = booking.paymentStatus ?? "unpaid";
  const bStatus = booking.status ?? "pending";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
          <p className="text-sm font-semibold text-slate-700">Receipt Preview</p>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <Printer size={13} /> Print
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Download size={13} /> Download PDF
            </button>
            <div className="relative">
              <button
                onClick={() => setShowShare((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Share2 size={13} /> Share
              </button>
              {showShare && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowShare(false)} />
                  <div className="absolute right-0 top-9 z-20 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 overflow-hidden">
                    <button onClick={handleShareWhatsApp} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                      <MessageCircle size={14} className="text-green-500" /> WhatsApp
                    </button>
                    <button onClick={handleShareEmail} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                      <Mail size={14} className="text-blue-500" /> Email
                    </button>
                    <button onClick={handleCopyPdf} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-slate-400" />}
                      {copied ? "Saved!" : "Save PDF"}
                    </button>
                    <button onClick={handleNativeShare} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                      <Share2 size={14} className="text-purple-500" /> Share via...
                    </button>
                  </div>
                </>
              )}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Receipt Preview */}
        <div className="overflow-y-auto flex-1 bg-slate-100 p-6">
          <div ref={printRef}>
            <div style={{
              width: "100%", maxWidth: "680px", margin: "0 auto",
              background: "#fff", fontFamily: "'Segoe UI', Arial, sans-serif",
              color: "#1e293b", borderRadius: "12px", overflow: "hidden",
              boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
            }}>

              {/* Header */}
              <div style={{ background: "linear-gradient(135deg, #2e7d32 0%, #43a047 100%)", padding: "32px 36px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <div style={{
                        width: "48px", height: "48px", borderRadius: "8px",
                        overflow: "hidden", border: "2px solid rgba(255,255,255,0.4)",
                        background: "rgba(255,255,255,0.15)",
                      }}>
                        <img src="/logo.jpeg" alt="Nexivio Care" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div>
                        <p style={{ color: "#fff", fontWeight: 800, fontSize: "18px", lineHeight: 1 }}>Nexivio Care</p>
                        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "11px" }}>Professional Healthcare Services</p>
                      </div>
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "11px", marginTop: "8px" }}>
                      Dhaka, Bangladesh · nexiviocare.com
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1.5px" }}>Money Receipt</p>
                    <p style={{ color: "#fff", fontWeight: 800, fontSize: "20px", marginTop: "2px" }}>{rcptNo}</p>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "11px", marginTop: "4px" }}>Issued: {issuedDate}</p>
                  </div>
                </div>
              </div>

              {/* Status Bar */}
              <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "12px 36px", display: "flex", gap: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>BOOKING STATUS</span>
                  <span style={{
                    fontSize: "11px", fontWeight: 700, padding: "2px 10px", borderRadius: "20px",
                    background: `${statusColor[bStatus] ?? "#64748b"}18`,
                    color: statusColor[bStatus] ?? "#64748b",
                    border: `1px solid ${statusColor[bStatus] ?? "#64748b"}40`,
                    textTransform: "uppercase",
                  }}>{bStatus}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>PAYMENT STATUS</span>
                  <span style={{
                    fontSize: "11px", fontWeight: 700, padding: "2px 10px", borderRadius: "20px",
                    background: `${paymentStatusColor[pStatus] ?? "#64748b"}18`,
                    color: paymentStatusColor[pStatus] ?? "#64748b",
                    border: `1px solid ${paymentStatusColor[pStatus] ?? "#64748b"}40`,
                    textTransform: "uppercase",
                  }}>{pStatus}</span>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: "28px 36px" }}>

                {/* Client + Patient */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
                  <div>
                    <p style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: "10px" }}>Billed To</p>
                    <p style={{ fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>{booking.name}</p>
                    <p style={{ fontSize: "13px", color: "#475569", marginTop: "3px" }}>{booking.phone}</p>
                    {booking.address && <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "3px" }}>{booking.address}</p>}
                  </div>
                  {booking.patientName && (
                    <div style={{ borderLeft: "2px solid #e2e8f0", paddingLeft: "20px" }}>
                      <p style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: "10px" }}>Patient</p>
                      <p style={{ fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>{booking.patientName}</p>
                      {booking.patientGender && <p style={{ fontSize: "12px", color: "#475569", marginTop: "3px" }}>{booking.patientGender}</p>}
                      {booking.relationship && <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Relation: {booking.relationship}</p>}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div style={{ borderTop: "1px dashed #e2e8f0", margin: "0 0 24px" }} />

                {/* Service Table */}
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px" }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9" }}>
                      <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", borderRadius: "6px 0 0 6px" }}>Service Description</th>
                      <th style={{ padding: "10px 14px", textAlign: "center", fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Period</th>
                      <th style={{ padding: "10px 14px", textAlign: "center", fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>Date / Time</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", borderRadius: "0 6px 6px 0" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 14px" }}>
                        <p style={{ fontWeight: 600, fontSize: "14px", color: "#0f172a" }}>{serviceName}</p>
                        {booking.packageName && <p style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>Package: {booking.packageName}</p>}
                      </td>
                      <td style={{ padding: "14px", textAlign: "center" }}>
                        <span style={{ fontSize: "12px", color: "#475569", fontWeight: 500 }}>
                          {booking.pricingPeriod ? booking.pricingPeriod.charAt(0).toUpperCase() + booking.pricingPeriod.slice(1) : "—"}
                        </span>
                      </td>
                      <td style={{ padding: "14px", textAlign: "center" }}>
                        <p style={{ fontSize: "12px", color: "#475569" }}>{booking.date ? formatDateEn(booking.date) : "—"}</p>
                        {booking.time && <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>{formatTimeEn(booking.time)}</p>}
                      </td>
                      <td style={{ padding: "14px", textAlign: "right" }}>
                        <span style={{ fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>
                          {booking.amount ? `৳${booking.amount.toLocaleString()}` : "—"}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Total Box */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
                  <div style={{ minWidth: "240px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                      <span style={{ fontSize: "13px", color: "#64748b" }}>Subtotal</span>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{booking.amount ? `৳${booking.amount.toLocaleString()}` : "—"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0" }}>
                      <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>Total</span>
                      <span style={{ fontSize: "18px", fontWeight: 800, color: "#2e7d32" }}>{booking.amount ? `৳${booking.amount.toLocaleString()}` : "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                {(booking.paymentMethod || booking.transactionId) && (
                  <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "14px 18px", marginBottom: "24px", border: "1px solid #e2e8f0" }}>
                    <p style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: "8px" }}>Payment Details</p>
                    <div style={{ display: "flex", gap: "32px" }}>
                      {booking.paymentMethod && (
                        <div>
                          <p style={{ fontSize: "11px", color: "#94a3b8" }}>Method</p>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>{booking.paymentMethod}</p>
                        </div>
                      )}
                      {booking.transactionId && (
                        <div>
                          <p style={{ fontSize: "11px", color: "#94a3b8" }}>Transaction ID</p>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", fontFamily: "monospace", marginTop: "2px" }}>{booking.transactionId}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {booking.notes && (
                  <div style={{ background: "#fffbeb", borderRadius: "8px", padding: "12px 16px", marginBottom: "24px", border: "1px solid #fde68a" }}>
                    <p style={{ fontSize: "10px", fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Notes</p>
                    <p style={{ fontSize: "12px", color: "#78350f" }}>{booking.notes}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0", padding: "18px 36px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: "11px", color: "#94a3b8" }}>Thank you for choosing Nexivio Care</p>
                  <p style={{ fontSize: "10px", color: "#cbd5e1", marginTop: "2px" }}>This is a computer-generated receipt. No signature required.</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "10px", color: "#94a3b8" }}>Booking ID</p>
                  <p style={{ fontSize: "11px", fontFamily: "monospace", color: "#64748b", fontWeight: 600 }}>{booking.id.slice(0, 16)}…</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
