"use client";

import { usePdfExport, PdfToolbar } from "@/components/ui/PdfToolbar";
import { numberToWords } from "@/lib/utils";

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
  dutyType?: string | null;
  serviceDays?: number | null;
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

const NAVY = "#0d2d6b";
const GREEN = "#1a7a3c";

const SERVICE_TYPES = [
  { key: "caregiver", label: "Caregiver Service" },
  { key: "elder", label: "Elder Care" },
  { key: "nursing", label: "Nursing Service" },
  { key: "stroke", label: "Stroke & Paralysis Care" },
  { key: "nanny", label: "Nanny Care" },
  { key: "other", label: "Other" },
];

const PAYMENT_METHODS = [
  { key: "cash", label: "Cash", emoji: "💵" },
  { key: "bank", label: "Bank Transfer", emoji: "🏛" },
  { key: "bkash", label: "bKash", emoji: "🦋" },
  { key: "nagad", label: "Nagad", emoji: "🔴" },
  { key: "other", label: "Other", emoji: "···" },
];

export default function BookingReceipt({ booking, serviceName, onClose }: Props) {
  const rcptNo = booking.receiptNumber ?? "—";
  const { printRef, getPdfBlob, handleDownload, handlePrint } = usePdfExport(`Receipt-${rcptNo}`);

  const amount = booking.amount ?? 0;
  const amountWords = numberToWords(amount);

  const d = new Date(booking.createdAt);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(2);

  const svcKey = booking.serviceType.toLowerCase();
  const checkedSvc = (key: string) => {
    if (key === "caregiver") return svcKey.includes("caregiver");
    if (key === "elder") return svcKey.includes("elder");
    if (key === "nursing") return svcKey.includes("nurs");
    if (key === "stroke") return svcKey.includes("stroke") || svcKey.includes("paralysis");
    if (key === "nanny") return svcKey.includes("nanny");
    if (key === "other") return !["caregiver","elder","nurs","stroke","paralysis","nanny"].some(k => svcKey.includes(k));
    return false;
  };

  const pm = (booking.paymentMethod ?? "").toLowerCase();
  const checkedPm = (key: string) => {
    if (key === "cash") return pm.includes("cash");
    if (key === "bank") return pm.includes("bank");
    if (key === "bkash") return pm.includes("bkash");
    if (key === "nagad") return pm.includes("nagad");
    return false;
  };

  const dotLine: React.CSSProperties = {
    borderBottom: "1.5px dotted #94a3b8",
    flex: 1,
    marginLeft: 4,
    marginBottom: 2,
  };

  const box = (checked: boolean): React.CSSProperties => ({
    width: 13, height: 13,
    border: `2px solid ${checked ? GREEN : "#94a3b8"}`,
    borderRadius: 2,
    background: checked ? GREEN : "#fff",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        <PdfToolbar
          filename={`Receipt-${rcptNo}`}
          title="Money Receipt Preview"
          onClose={onClose}
          getPdfBlob={getPdfBlob}
          handleDownload={handleDownload}
          handlePrint={handlePrint}
        />

        <div className="overflow-y-auto flex-1 bg-slate-100 p-4">
          {/* A4 landscape receipt */}
          <div
            ref={printRef}
            style={{
              background: "#fff",
              fontFamily: "'Segoe UI', Arial, sans-serif",
              color: "#1e293b",
              width: "100%",
              maxWidth: "960px",
              margin: "0 auto",
            }}
          >
            {/* ── HEADER ── */}
            <div style={{ position: "relative", overflow: "hidden", background: "#fff" }}>
              {/* Top navy bar */}
              <div style={{ background: NAVY, height: 7 }} />

              {/* Green arc top-right */}
              <div style={{
                position: "absolute", top: 0, right: 0,
                width: 260, height: 120,
                background: GREEN,
                clipPath: "polygon(55% 0, 100% 0, 100% 100%, 15% 100%)",
                opacity: 0.18,
              }} />

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 28px 10px" }}>
                {/* Logo + brand small */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 170 }}>
                  <div style={{ width: 76, height: 76, borderRadius: "50%", overflow: "hidden", border: `3px solid ${NAVY}`, flexShrink: 0 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo.jpeg" alt="Nexivio Care" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div>
                    <p style={{ color: NAVY, fontWeight: 900, fontSize: 15, lineHeight: 1.1 }}>Nexivio</p>
                    <p style={{ color: GREEN, fontWeight: 900, fontSize: 15, lineHeight: 1.1 }}>Care</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                      <div style={{ height: 1, width: 18, background: GREEN }} />
                      <p style={{ color: "#64748b", fontSize: 8, fontStyle: "italic" }}>Care you can trust</p>
                      <div style={{ height: 1, width: 18, background: GREEN }} />
                    </div>
                  </div>
                </div>

                {/* Center brand */}
                <div style={{ textAlign: "center", flex: 1 }}>
                  <p style={{ color: NAVY, fontWeight: 900, fontSize: 32, lineHeight: 1, letterSpacing: -0.5 }}>
                    Nexivio <span style={{ color: GREEN }}>Care</span>
                  </p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: "4px 0" }}>
                    <div style={{ height: 1, width: 40, background: "#94a3b8" }} />
                    <p style={{ color: "#64748b", fontSize: 11, fontStyle: "italic" }}>Care you can trust</p>
                    <div style={{ height: 1, width: 40, background: "#94a3b8" }} />
                  </div>
                  {/* Heart */}
                  <p style={{ color: GREEN, fontSize: 13, margin: "2px 0" }}>♥</p>
                  <div style={{ display: "inline-block", background: NAVY, color: "#fff", fontSize: 10, fontWeight: 700, padding: "5px 18px", borderRadius: 4, marginTop: 2 }}>
                    Professional Caregiving | Nursing | Nanny Care | Elder Care
                  </div>
                </div>

                {/* Contact */}
                <div style={{ textAlign: "right", minWidth: 210 }}>
                  {[
                    { icon: "📞", text: "01700-938055" },
                    { icon: "📞", text: "01923-905499" },
                    { icon: "✉️", text: "nexiviocare@gmail.com" },
                    { icon: "📍", text: "DIT Road, West Rampura, Dhaka" },
                  ].map(({ icon, text }) => (
                    <p key={text} style={{ fontSize: 11, color: "#1e293b", marginBottom: 4, fontWeight: 500 }}>{icon} {text}</p>
                  ))}
                </div>
              </div>

              {/* Wave divider */}
              <div style={{ position: "relative", height: 22, overflow: "hidden" }}>
                <svg viewBox="0 0 960 22" preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block" }}>
                  <path d="M0,0 Q240,22 480,11 Q720,0 960,18 L960,22 L0,22 Z" fill={NAVY} />
                  <path d="M0,4 Q240,22 480,14 Q720,4 960,20 L960,22 L0,22 Z" fill={GREEN} opacity="0.7" />
                </svg>
              </div>
            </div>

            {/* ── RECEIPT NO / TITLE / DATE ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px 12px", background: "#f8fafc" }}>
              {/* Receipt No */}
              <div style={{ border: `2px solid ${NAVY}`, borderRadius: 6, padding: "6px 20px", textAlign: "center", minWidth: 150 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: NAVY, textTransform: "uppercase", letterSpacing: 0.5 }}>Receipt No.</p>
                <p style={{ fontSize: 18, fontWeight: 900, color: "#e53e3e", letterSpacing: 1, marginTop: 2 }}>{rcptNo}</p>
              </div>

              {/* MONEY RECEIPT banner */}
              <div style={{ position: "relative", display: "inline-block" }}>
                <div style={{
                  background: NAVY,
                  color: "#fff",
                  fontSize: 22,
                  fontWeight: 900,
                  padding: "11px 48px",
                  letterSpacing: 3,
                  clipPath: "polygon(0 0, 100% 0, 96% 50%, 100% 100%, 0 100%, 4% 50%)",
                }}>
                  MONEY RECEIPT
                </div>
              </div>

              {/* Date */}
              <div style={{ border: `2px solid ${NAVY}`, borderRadius: 6, padding: "6px 20px", textAlign: "center", minWidth: 170 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: NAVY, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Date</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                  <span>{dd}</span>
                  <span style={{ color: "#94a3b8" }}>/</span>
                  <span>{mm}</span>
                  <span style={{ color: "#94a3b8" }}>/</span>
                  <span>20</span>
                  <span>{yy}</span>
                </div>
              </div>
            </div>

            {/* ── BODY: LEFT + RIGHT ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid #e2e8f0" }}>

              {/* LEFT */}
              <div style={{ padding: "20px 24px 16px 28px", borderRight: "1px solid #e2e8f0", position: "relative" }}>
                {/* Watermark */}
                <div style={{
                  position: "absolute", top: "50%", left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 180, height: 180, opacity: 0.04, pointerEvents: "none",
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.jpeg" alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>

                {[
                  { label: "Received From", value: booking.name },
                  { label: "Mobile No.", value: booking.phone },
                  { label: "Address", value: booking.address ?? "" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", alignItems: "flex-end", marginBottom: 16 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap", minWidth: 115 }}>{label}</span>
                    <span style={{ fontSize: 12, color: "#475569", marginRight: 4 }}>:</span>
                    <div style={{ ...dotLine }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{value}</span>
                    </div>
                  </div>
                ))}

                {/* Amount Received box */}
                <div style={{ border: `2px solid ${NAVY}`, borderRadius: 8, overflow: "hidden", marginTop: 20 }}>
                  <div style={{ display: "flex", alignItems: "stretch" }}>
                    <div style={{ background: GREEN, color: "#fff", padding: "10px 14px", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 120 }}>
                      <p style={{ fontSize: 11, fontWeight: 800, lineHeight: 1.3 }}>Amount Received</p>
                      <p style={{ fontSize: 9, opacity: 0.85 }}>(BDT)</p>
                    </div>
                    <div style={{ flex: 1, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 20, fontWeight: 900, color: NAVY }}>৳</span>
                      <div style={{ flex: 1, borderBottom: "1.5px dotted #94a3b8", paddingBottom: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                          {amount > 0 ? amount.toLocaleString() : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "8px 14px", borderTop: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", whiteSpace: "nowrap" }}>In Words:</span>
                      <div style={{ ...dotLine }}>
                        <span style={{ fontSize: 10.5, color: "#0f172a", fontWeight: 600 }}>{amount > 0 ? amountWords : ""}</span>
                      </div>
                    </div>
                    <div style={{ borderBottom: "1.5px dotted #94a3b8", marginTop: 10 }} />
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div style={{ padding: "20px 28px 16px 20px" }}>

                {/* Service Type */}
                <div style={{ border: `2px solid ${GREEN}`, borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
                  <div style={{ background: GREEN, padding: "7px 14px" }}>
                    <p style={{ color: "#fff", fontWeight: 800, fontSize: 12 }}>Service Type (✓)</p>
                  </div>
                  <div style={{ padding: "10px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px" }}>
                    {SERVICE_TYPES.map(({ key, label }) => {
                      const checked = checkedSvc(key);
                      return (
                        <div key={key} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <div style={box(checked)}>
                            {checked && <span style={{ color: "#fff", fontSize: 8, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                          </div>
                          <span style={{ fontSize: 11, color: "#1e293b", fontWeight: checked ? 700 : 400 }}>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Method */}
                <div style={{ border: `2px solid ${NAVY}`, borderRadius: 8, overflow: "hidden" }}>
                  <div style={{ background: NAVY, padding: "7px 14px" }}>
                    <p style={{ color: "#fff", fontWeight: 800, fontSize: 12 }}>Payment Method (✓)</p>
                  </div>
                  <div style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", gap: 6, marginBottom: 10 }}>
                      {PAYMENT_METHODS.map(({ key, label, emoji }) => {
                        const checked = checkedPm(key);
                        return (
                          <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                            <div style={{
                              width: 38, height: 38, borderRadius: "50%",
                              border: `2px solid ${checked ? GREEN : "#e2e8f0"}`,
                              background: checked ? "#e8f5ee" : "#f8fafc",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 16,
                            }}>
                              {emoji}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                              <div style={box(checked)}>
                                {checked && <span style={{ color: "#fff", fontSize: 8, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                              </div>
                              <span style={{ fontSize: 9.5, fontWeight: checked ? 700 : 400, color: checked ? GREEN : "#475569" }}>{label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, borderTop: "1px solid #f1f5f9", paddingTop: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap" }}>Transaction ID / Reference:</span>
                      <div style={{ ...dotLine }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#0f172a", fontFamily: "monospace" }}>
                          {booking.transactionId ?? ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── PURPOSE OF PAYMENT ── */}
            <div style={{ padding: "10px 28px 14px", borderTop: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap" }}>Purpose of Payment :</span>
                <div style={{ ...dotLine }}>
                  <span style={{ fontSize: 11, color: "#0f172a" }}>
                    {booking.notes ?? `Payment for ${serviceName}${booking.packageName ? ` – ${booking.packageName}` : ""}`}
                  </span>
                </div>
              </div>
            </div>

            {/* ── SIGNATURE ROW ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, padding: "12px 28px 20px", borderTop: "1px solid #e2e8f0" }}>
              <div style={{ border: `1.5px solid ${GREEN}60`, borderRadius: 8, padding: "14px 16px", background: "#e8f5ee" }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: NAVY, textAlign: "center", marginBottom: 36 }}>Received By</p>
                <div style={{ borderBottom: "1.5px dotted #94a3b8", marginBottom: 6 }} />
                <p style={{ fontSize: 10, color: "#64748b", textAlign: "center" }}>Name & Signature</p>
              </div>

              <div style={{ border: `1.5px solid ${GREEN}60`, borderRadius: 8, padding: "14px 16px", background: "#e8f5ee", textAlign: "center" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Company Seal</p>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", border: `3px solid ${GREEN}` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo.jpeg" alt="Nexivio Care" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                </div>
                <p style={{ fontSize: 10, fontWeight: 700, color: NAVY, marginTop: 6 }}>Nexivio Care</p>
                <p style={{ fontSize: 9, color: "#64748b", fontStyle: "italic" }}>Care you can trust</p>
              </div>

              <div style={{ border: `1.5px solid ${GREEN}60`, borderRadius: 8, padding: "14px 16px", background: "#e8f5ee" }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: NAVY, textAlign: "center", marginBottom: 36 }}>Client Signature</p>
                <div style={{ borderBottom: "1.5px dotted #94a3b8", marginBottom: 6 }} />
                <p style={{ fontSize: 10, color: "#64748b", textAlign: "center" }}>Name & Signature</p>
              </div>
            </div>

            {/* ── FOOTER ── */}
            <div style={{ background: NAVY, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 28px" }}>
              <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 12, fontStyle: "italic" }}>
                ♡ &nbsp;Thank you for choosing Nexivio Care.
              </p>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>
                🌐 www.nexiviocare.com
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
