"use client";

import { useRef, useEffect, useState } from "react";
import { usePdfExport, PdfToolbar } from "@/components/ui/PdfToolbar";
import type { ReceiptBooking } from "@/components/ui/BookingReceipt";

interface Props {
  booking: ReceiptBooking;
  serviceName: string;
  onClose: () => void;
}

const NAVY = "#0d2d6b";
const GREEN = "#1a7a3c";

const SERVICE_ROWS = [
  "Caregiver Service",
  "Nursing Service",
  "Nanny Care",
  "Elder Care",
  "Other Service (If Any)",
];

const PAYMENT_METHODS = [
  { key: "bank",   label: "Bank Transfer", emoji: "🏛" },
  { key: "bkash",  label: "bKash",         emoji: "🦋" },
  { key: "nagad",  label: "Nagad",          emoji: "🔴" },
  { key: "cash",   label: "Cash",           emoji: "💵" },
  { key: "cheque", label: "Cheque",         emoji: "✏️" },
  { key: "other",  label: "Other:",         emoji: "···" },
];

export default function BookingInvoice({ booking, serviceName, onClose }: Props) {
  const invNo = booking.receiptNumber
    ? booking.receiptNumber.replace("MR", "INV").replace("RCP", "INV")
    : `NC-INV-${new Date(booking.createdAt).getFullYear()}-${String(booking.id).slice(0, 4).toUpperCase()}`;

  const { printRef, getPdfBlob, handleDownload, handlePrint } = usePdfExport(`Invoice-${invNo}`);

  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [openedAt] = useState(() => new Date());

  const fmt = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd} / ${mm} / ${yyyy}`;
  };

  const fmtTime = (d: Date) => {
    const h = d.getHours();
    const min = String(d.getMinutes()).padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = String(h % 12 || 12).padStart(2, "0");
    return `${h12}:${min} ${ampm}`;
  };

  useEffect(() => {
    const compute = () => {
      if (!wrapRef.current) return;
      const { clientWidth } = wrapRef.current;
      setScale((clientWidth - 32) / 794);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const amount = booking.amount ?? 0;
  const qty = booking.serviceDays ?? 1;
  const period = booking.pricingPeriod ?? "daily";
  const unitRate = amount > 0 && qty > 0
    ? period === "daily"  ? amount / qty
    : period === "weekly" ? amount / Math.ceil(qty / 7)
    : amount / Math.ceil(qty / 30)
    : 0;
  const rateLabel = period === "weekly" ? "/wk" : period === "monthly" ? "/mo" : "/day";
  const pm = (booking.paymentMethod ?? "").toLowerCase();

  const checkedPm = (key: string) => {
    if (key === "cash")   return pm.includes("cash");
    if (key === "bank")   return pm.includes("bank");
    if (key === "bkash")  return pm.includes("bkash");
    if (key === "nagad")  return pm.includes("nagad");
    if (key === "cheque") return pm.includes("cheque");
    return false;
  };

  const svcKey = (booking.serviceType + " " + serviceName).toLowerCase();
  const matchRow = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes("caregiver")) return svcKey.includes("caregiver");
    if (l.includes("nursing"))   return svcKey.includes("nurs");
    if (l.includes("nanny"))     return svcKey.includes("nanny");
    if (l.includes("elder"))     return svcKey.includes("elder");
    return false;
  };

  const box = (checked: boolean): React.CSSProperties => ({
    width: 11, height: 11,
    border: `2px solid ${checked ? GREEN : "#94a3b8"}`,
    borderRadius: 2,
    background: checked ? GREEN : "#fff",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  });

  const dotLine: React.CSSProperties = {
    flex: 1, borderBottom: "1px dotted #94a3b8", marginLeft: 3, marginBottom: 1,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col" style={{ height: "95vh" }}>
        <PdfToolbar
          filename={`Invoice-${invNo}`}
          title="Invoice Preview"
          onClose={onClose}
          getPdfBlob={getPdfBlob}
          handleDownload={handleDownload}
          handlePrint={handlePrint}
        />

        {/* Scaling viewport — scrollable */}
        <div ref={wrapRef} className="flex-1 bg-slate-100 overflow-y-auto flex flex-col items-center py-4">
          <div style={{ transform: `scale(${scale})`, transformOrigin: "top center", width: 794, marginBottom: `${(1123 * scale) - 1123}px` }}>

            {/* A4: 794 x 1123 */}
            <div
              ref={printRef}
              style={{
                background: "#fff",
                fontFamily: "'Segoe UI', Arial, sans-serif",
                color: "#1e293b",
                width: 794,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >

              {/* HEADER */}
              <div style={{ position: "relative", overflow: "hidden" }}>
                <div style={{ background: NAVY, height: 6 }} />
                <div style={{ position: "absolute", top: 0, right: 0, width: 220, height: 120, background: GREEN, clipPath: "polygon(55% 0,100% 0,100% 100%,15% 100%)", opacity: 0.15 }} />

                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "10px 20px 8px" }}>

                  {/* Logo stacked */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 110 }}>
                    <div style={{ width: 68, height: 68, borderRadius: "50%", overflow: "hidden", border: `2.5px solid ${NAVY}`, marginBottom: 4 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/logo.jpeg" alt="Nexivio Care" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <p style={{ color: NAVY, fontWeight: 900, fontSize: 13, lineHeight: 1.1 }}>Nexivio</p>
                    <p style={{ color: GREEN, fontWeight: 900, fontSize: 13, lineHeight: 1.1 }}>Care</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
                      <div style={{ height: 1, width: 14, background: GREEN }} />
                      <p style={{ color: "#64748b", fontSize: 7, fontStyle: "italic" }}>Care you can trust</p>
                      <div style={{ height: 1, width: 14, background: GREEN }} />
                    </div>
                  </div>

                  {/* Center brand */}
                  <div style={{ textAlign: "center", flex: 1, padding: "0 8px" }}>
                    <p style={{ color: NAVY, fontWeight: 900, fontSize: 26, lineHeight: 1, letterSpacing: -0.5 }}>
                      Nexivio <span style={{ color: GREEN }}>Care</span>
                    </p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, margin: "3px 0" }}>
                      <div style={{ height: 1, width: 28, background: "#94a3b8" }} />
                      <p style={{ color: "#64748b", fontSize: 9, fontStyle: "italic" }}>Care you can trust</p>
                      <div style={{ height: 1, width: 28, background: "#94a3b8" }} />
                    </div>
                    <p style={{ color: GREEN, fontSize: 11, margin: "1px 0" }}>♥</p>
                    <div style={{ display: "inline-block", background: NAVY, color: "#fff", fontSize: 8.5, fontWeight: 700, padding: "3px 12px", borderRadius: 3, marginBottom: 5 }}>
                      Professional Caregiving | Nursing | Nanny Care | Elder Care
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
                      <p style={{ fontSize: 9, color: "#475569" }}>🌐 www.nexiviocare.com</p>
                      <p style={{ fontSize: 9, color: "#475569" }}>✉️ nexiviocare@gmail.com</p>
                    </div>
                  </div>

                  {/* Contact + QR */}
                  <div style={{ textAlign: "right", minWidth: 155 }}>
                    {[
                      { icon: "📞", text: "01700-938055" },
                      { icon: "📞", text: "01923-905499" },
                      { icon: "✉️", text: "nexiviocare@gmail.com" },
                      { icon: "🌐", text: "www.nexiviocare.com" },
                      { icon: "📍", text: "DIT Road, 2nd Floor, West Rampura\n(West Side of BTV Center), Rampura, Dhaka." },
                    ].map(({ icon, text }) => (
                      <p key={text} style={{ fontSize: 9, color: "#1e293b", marginBottom: 2.5, fontWeight: 500, whiteSpace: "pre-line" }}>{icon} {text}</p>
                    ))}

                  </div>
                </div>

                {/* Wave */}
                <div style={{ height: 16, overflow: "hidden" }}>
                  <svg viewBox="0 0 794 16" preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block" }}>
                    <path d="M0,0 Q198,16 397,8 Q596,0 794,13 L794,16 L0,16 Z" fill={NAVY} />
                    <path d="M0,3 Q198,16 397,10 Q596,3 794,15 L794,16 L0,16 Z" fill={GREEN} opacity="0.7" />
                  </svg>
                </div>
              </div>

              {/* INVOICE TITLE */}
              <div style={{ textAlign: "center", padding: "10px 20px 7px", borderBottom: `1.5px solid ${GREEN}30` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <div style={{ display: "flex", gap: 2 }}>
                    <div style={{ width: 28, height: 3, background: GREEN, borderRadius: 2 }} />
                    <div style={{ width: 9, height: 3, background: GREEN, borderRadius: 2, opacity: 0.5 }} />
                  </div>
                  <p style={{ color: NAVY, fontWeight: 900, fontSize: 30, letterSpacing: 4, lineHeight: 1 }}>INVOICE</p>
                  <div style={{ display: "flex", gap: 2 }}>
                    <div style={{ width: 9, height: 3, background: GREEN, borderRadius: 2, opacity: 0.5 }} />
                    <div style={{ width: 28, height: 3, background: GREEN, borderRadius: 2 }} />
                  </div>
                </div>
              </div>

              {/* INVOICE NO / DATE / DUE DATE */}
              <div style={{ margin: "8px 18px", border: `1.5px solid ${NAVY}30`, borderRadius: 6, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
                  {[
                    { label: "Invoice No.",   value: invNo,                        color: GREEN },
                    { label: "Invoice Date",  value: fmt(openedAt),                color: NAVY },
                    { label: "Time",          value: fmtTime(openedAt),            color: GREEN },
                  ].map(({ label, value, color }, i) => (
                    <div key={label} style={{ padding: "6px 12px", borderRight: i < 2 ? `1px solid ${NAVY}15` : undefined, textAlign: "center" }}>
                      <p style={{ fontSize: 9, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</p>
                      <p style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* BILL TO */}
              <div style={{ margin: "0 18px 8px", border: `1.5px solid ${NAVY}20`, borderRadius: 6, overflow: "hidden", position: "relative" }}>
                <div style={{ background: NAVY, padding: "5px 12px" }}>
                  <p style={{ color: "#fff", fontWeight: 800, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>BILL TO</p>
                </div>
                <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-20%)", width: 110, height: 110, opacity: 0.05, pointerEvents: "none" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.jpeg" alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
                <div style={{ padding: "8px 12px 6px" }}>
                  {[
                    { label: "Client Name", value: booking.name },
                    { label: "Mobile No.",  value: booking.phone },
                    { label: "Email",       value: "" },
                    { label: "Address",     value: booking.address ?? "" },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: "flex", alignItems: "flex-end", marginBottom: 7 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#1e293b", minWidth: 72 }}>{label}</span>
                      <span style={{ fontSize: 10, color: "#475569", marginRight: 3 }}>:</span>
                      <div style={{ ...dotLine }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#0f172a" }}>{value}</span>
                      </div>
                    </div>
                  ))}
                  <div style={{ borderBottom: "1px dotted #94a3b8", marginTop: 2 }} />
                </div>
              </div>

              {/* SERVICE TABLE */}
              <div style={{ margin: "0 18px 8px", border: `1.5px solid ${NAVY}20`, borderRadius: 6, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: NAVY }}>
                      <th style={{ padding: "7px 8px", fontSize: 9, fontWeight: 700, color: "#fff", textAlign: "center", width: 24 }}>SL.</th>
                      <th style={{ padding: "7px 8px", fontSize: 9, fontWeight: 700, color: "#fff", textAlign: "left" }}>DESCRIPTION OF SERVICE</th>
                      <th style={{ padding: "7px 8px", fontSize: 9, fontWeight: 700, color: "#fff", textAlign: "center", width: 90 }}>PACKAGE</th>
                      <th style={{ padding: "7px 8px", fontSize: 9, fontWeight: 700, color: "#fff", textAlign: "right", width: 88 }}>RATE (BDT)</th>
                      <th style={{ padding: "7px 8px", fontSize: 9, fontWeight: 700, color: "#fff", textAlign: "center", width: 110 }}>DAYS / Week / Month </th>
                      <th style={{ padding: "7px 8px", fontSize: 9, fontWeight: 700, color: "#fff", textAlign: "right", width: 88 }}>AMOUNT (BDT)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SERVICE_ROWS.map((label, i) => {
                      const isMatch = matchRow(label);
                      return (
                        <tr key={label} style={{ borderBottom: "1px solid #f1f5f9", background: isMatch ? "#e8f5ee" : i % 2 === 1 ? "#fafafa" : "#fff" }}>
                          <td style={{ padding: "7px 8px", textAlign: "center", fontSize: 10, color: isMatch ? GREEN : "#475569", fontWeight: 600 }}>{String(i + 1).padStart(2, "0")}</td>
                          <td style={{ padding: "7px 8px", fontSize: 11, fontWeight: isMatch ? 700 : 500, color: isMatch ? "#0f172a" : "#475569" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                              {isMatch && (
                                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 14, height: 14, borderRadius: "50%", background: GREEN, flexShrink: 0 }}>
                                  <span style={{ color: "#fff", fontSize: 8, fontWeight: 900, lineHeight: 1 }}>✓</span>
                                </span>
                              )}
                              <span>
                                {label}
                                {isMatch && booking.dutyType && (
                                  <span style={{ fontSize: 9, color: GREEN, fontWeight: 600, marginLeft: 4 }}>
                                    ({booking.dutyType === "day" ? "8 hrs" : booking.dutyType === "night" ? "12 hrs" : booking.dutyType === "live-in" ? "24 hrs" : booking.dutyType})
                                  </span>
                                )}
                              </span>
                            </span>
                          </td>
                          <td style={{ padding: "7px 8px", textAlign: "center", fontSize: 9, color: isMatch ? "#0f172a" : "#94a3b8" }}>
                            {isMatch && booking.packageName ? booking.packageName : "—"}
                          </td>
                          <td style={{ padding: "7px 8px", textAlign: "right", fontSize: 10, color: isMatch ? "#0f172a" : "#94a3b8", fontWeight: isMatch ? 600 : 400 }}>
                            {isMatch && unitRate > 0
                              ? <span>{unitRate.toLocaleString(undefined, { maximumFractionDigits: 0 })}<span style={{ fontSize: 8, color: GREEN, fontWeight: 700, marginLeft: 2 }}>{rateLabel}</span></span>
                              : "—"}
                          </td>
                          <td style={{ padding: "7px 8px", textAlign: "center", fontSize: 10, fontWeight: isMatch ? 700 : 400, color: isMatch ? "#0f172a" : "#94a3b8" }}>
                            {isMatch && booking.serviceDays
                              ? <span style={{ whiteSpace: "nowrap" }}>
                                  {period === "daily"  ? `${booking.serviceDays} Days`
                                  : period === "weekly" ? `${Math.ceil((booking.serviceDays ?? 1) / 7)} Weeks`
                                  : `${Math.ceil((booking.serviceDays ?? 1) / 30)} Months`}
                                </span>
                              : "—"}
                          </td>
                          <td style={{ padding: "7px 8px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#0f172a" }}>
                            {isMatch ? amount.toFixed(2) : "0.00"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Totals */}
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1.5px solid ${NAVY}20` }}>
                  {/* Amount in words - left side */}
                  <div style={{ flex: 1, padding: "8px 12px", display: "flex", flexDirection: "column", justifyContent: "center", borderRight: `1px solid ${NAVY}15` }}>
                    <p style={{ fontSize: 8, fontWeight: 700, color: GREEN, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Amount in Words</p>
                    <p style={{ fontSize: 10, fontWeight: 800, color: "#0f172a", lineHeight: 1.4 }}>{booking.amount && booking.amount > 0 ? (() => { const n = Math.floor(booking.amount); const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"]; const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"]; const chunk = (x: number): string => { if (x === 0) return ""; if (x < 20) return ones[x] + " "; if (x < 100) return tens[Math.floor(x/10)] + (x%10 ? " "+ones[x%10] : "") + " "; return ones[Math.floor(x/100)] + " Hundred " + chunk(x%100); }; let r = ""; if (n >= 10000000) { r += chunk(Math.floor(n/10000000)) + "Crore "; } if (n >= 100000) { r += chunk(Math.floor((n%10000000)/100000)) + "Lakh "; } if (n >= 1000) { r += chunk(Math.floor((n%100000)/1000)) + "Thousand "; } r += chunk(n%1000); return r.trim() + " Taka Only"; })() : "Zero Taka Only"}</p>
                  </div>
                  <div style={{ width: "46%" }}>
                    {[
                      { label: "Total Amount", value: `BDT  ${amount.toFixed(2)}`, bg: "#f8fafc", bold: false, tc: "#475569", vc: "#0f172a" },
                      { label: "Discount",     value: "BDT  0.00",                  bg: "#fff",    bold: false, tc: GREEN,     vc: GREEN },
                      { label: "NET PAYABLE",  value: `BDT  ${amount.toFixed(2)}`,  bg: NAVY,      bold: true,  tc: "#fff",    vc: "#fff" },
                    ].map(({ label, value, bg, bold, tc, vc }) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 12px", background: bg, borderTop: "1px solid #f1f5f9" }}>
                        <span style={{ fontSize: bold ? 11 : 10, fontWeight: bold ? 800 : 600, color: tc }}>{label}</span>
                        <span style={{ fontSize: bold ? 12 : 11, fontWeight: bold ? 900 : 700, color: vc }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* PAYMENT METHOD + NOTES */}
              <div style={{ margin: "0 18px 8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>

                {/* Payment Method — horizontal flex */}
                <div style={{ border: `1.5px solid ${GREEN}50`, borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ background: GREEN, padding: "5px 9px" }}>
                    <p style={{ color: "#fff", fontWeight: 800, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5 }}>PAYMENT METHOD</p>
                  </div>
                  <div style={{ padding: "6px 9px", display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
                    {PAYMENT_METHODS.map(({ key, label, emoji }) => {
                      const checked = checkedPm(key);
                      return (
                        <div key={key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 11 }}>{emoji}</span>
                          <div style={box(checked)}>
                            {checked && <span style={{ color: "#fff", fontSize: 7, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                          </div>
                          <span style={{ fontSize: 9, fontWeight: checked ? 700 : 400, color: checked ? GREEN : "#475569" }}>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div style={{ border: `1.5px solid ${GREEN}50`, borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ background: GREEN, padding: "5px 9px" }}>
                    <p style={{ color: "#fff", fontWeight: 800, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5 }}>NOTES</p>
                  </div>
                  <div style={{ padding: "6px 9px", position: "relative" }}>
                    <span style={{ fontSize: 20, color: NAVY, fontWeight: 900, lineHeight: 1, opacity: 0.25, position: "absolute", top: 2, left: 5 }}>&ldquo;</span>
                    <p style={{ fontSize: 9, color: "#475569", lineHeight: 1.5, paddingLeft: 11 }}>
                      {booking.notes ?? "Thank you for choosing Nexivio Care. We appreciate your trust in our professional caregiving services."}
                    </p>
                    <span style={{ fontSize: 20, color: NAVY, fontWeight: 900, lineHeight: 1, opacity: 0.25, position: "absolute", bottom: 1, right: 5 }}>&rdquo;</span>
                  </div>
                </div>
              </div>

              {/* SIGNATURE ROW */}
              <div style={{ margin: "0 18px 10px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>

                {/* Customer Signature */}
                <div style={{ border: `1.5px solid ${GREEN}50`, borderRadius: 6, padding: "9px 12px", background: "#e8f5ee" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                    <span style={{ fontSize: 13 }}>👤</span>
                    <p style={{ fontSize: 10, fontWeight: 800, color: GREEN }}>Customer Signature</p>
                  </div>
                  <div style={{ borderBottom: "1px dotted #94a3b8", marginTop: 22, marginBottom: 5 }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5 }}>
                    <span style={{ fontSize: 9, color: "#475569" }}>Date:</span>
                    <span style={{ fontSize: 9, color: "#94a3b8" }}>__ / __ / ______</span>
                  </div>
                </div>

                {/* Company Seal */}
                <div style={{ border: `1.5px solid ${GREEN}50`, borderRadius: 6, padding: "9px 12px", background: "#e8f5ee", textAlign: "center" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 5 }}>Company Seal</p>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div style={{ width: 62, height: 62, borderRadius: "50%", overflow: "hidden", border: `2.5px solid ${GREEN}` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/logo.jpeg" alt="Nexivio Care" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  </div>
                  <p style={{ fontSize: 9, fontWeight: 700, color: NAVY, marginTop: 4 }}>Nexivio Care</p>
                  <p style={{ fontSize: 7.5, color: "#64748b", fontStyle: "italic" }}>Care you can trust</p>
                </div>

                {/* Authorized Signature */}
                <div style={{ border: `1.5px solid ${GREEN}50`, borderRadius: 6, padding: "9px 12px", background: "#e8f5ee" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                    <span style={{ fontSize: 13 }}>✏️</span>
                    <p style={{ fontSize: 10, fontWeight: 800, color: GREEN }}>Authorized Signature</p>
                  </div>
                  <div style={{ borderBottom: "1px dotted #94a3b8", marginTop: 22, marginBottom: 5 }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5 }}>
                    <span style={{ fontSize: 9, color: "#475569" }}>Date:</span>
                    <span style={{ fontSize: 9, color: "#94a3b8" }}>__ / __ / ______</span>
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div style={{ background: NAVY, padding: "8px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 10, fontStyle: "italic" }}>
                  ♡ &nbsp;Thank you for choosing Nexivio Care.
                </p>
                <div style={{ display: "flex", gap: 12 }}>
                  {["🌐 www.nexiviocare.com", "✉️ nexiviocare@gmail.com", "📞 01700-938055 | 01923-905499"].map((t) => (
                    <p key={t} style={{ color: "rgba(255,255,255,0.6)", fontSize: 8 }}>{t}</p>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
