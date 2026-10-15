"use client";

import { useRef, useEffect, useState } from "react";
import { usePdfExport, PdfToolbar } from "@/components/ui/PdfToolbar";
import { numberToWords } from "@/lib/utils";

export interface InvoiceItem {
  service: string;
  package?: string;
  rate: number;
  days: number;
  amount: number;
}

export interface StandaloneInvoiceData {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  clientName: string;
  phone: string;
  email?: string | null;
  address: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  paymentStatus: string;
  paymentMethod?: string | null;
  transactionRef?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  invoice: StandaloneInvoiceData;
  onClose: () => void;
}

const NAVY = "#0d2d6b";
const GREEN = "#1a7a3c";

const PAYMENT_METHODS = [
  { key: "bank", label: "Bank Transfer", emoji: "🏛" },
  { key: "bkash", label: "bKash", emoji: "🦋" },
  { key: "nagad", label: "Nagad", emoji: "🔴" },
  { key: "cash", label: "Cash", emoji: "💵" },
  { key: "cheque", label: "Cheque", emoji: "✏️" },
  { key: "other", label: "Other", emoji: "···" },
];

export default function StandaloneInvoiceView({ invoice, onClose }: Props) {
  const { printRef, getPdfBlob, handleDownload, handlePrint } = usePdfExport(`Invoice-${invoice.invoiceNumber}`);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const compute = () => {
      if (!wrapRef.current) return;
      setScale((wrapRef.current.clientWidth - 32) / 794);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const pm = (invoice.paymentMethod ?? "").toLowerCase();
  const checkedPm = (key: string) => {
    if (key === "cash") return pm.includes("cash");
    if (key === "bank") return pm.includes("bank");
    if (key === "bkash") return pm.includes("bkash");
    if (key === "nagad") return pm.includes("nagad");
    if (key === "cheque") return pm.includes("cheque");
    return false;
  };

  const fmt = (s: string) => {
    const d = new Date(s);
    return `${String(d.getDate()).padStart(2,"0")} / ${String(d.getMonth()+1).padStart(2,"0")} / ${d.getFullYear()}`;
  };

  const due = invoice.total - invoice.paidAmount;

  const box = (checked: boolean): React.CSSProperties => ({
    width: 11, height: 11, border: `2px solid ${checked ? GREEN : "#94a3b8"}`, borderRadius: 2,
    background: checked ? GREEN : "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  });

  const dotLine: React.CSSProperties = { flex: 1, borderBottom: "1px dotted #94a3b8", marginLeft: 3, marginBottom: 1 };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col" style={{ height: "95vh" }}>
        <PdfToolbar
          filename={`Invoice-${invoice.invoiceNumber}`}
          title="Invoice Preview"
          onClose={onClose}
          getPdfBlob={getPdfBlob}
          handleDownload={handleDownload}
          handlePrint={handlePrint}
        />
        <div ref={wrapRef} className="flex-1 bg-slate-100 overflow-y-auto flex flex-col items-center py-4">
          <div style={{ transform: `scale(${scale})`, transformOrigin: "top center", width: 794, marginBottom: `${(1123 * scale) - 1123}px` }}>
            <div ref={printRef} style={{ background: "#fff", fontFamily: "'Segoe UI', Arial, sans-serif", color: "#1e293b", width: 794, display: "flex", flexDirection: "column", overflow: "hidden" }}>

              {/* HEADER */}
              <div style={{ position: "relative", overflow: "hidden" }}>
                <div style={{ background: NAVY, height: 6 }} />
                <div style={{ position: "absolute", top: 0, right: 0, width: 220, height: 120, background: GREEN, clipPath: "polygon(55% 0,100% 0,100% 100%,15% 100%)", opacity: 0.15 }} />
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "10px 20px 8px" }}>
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
                  <div style={{ textAlign: "center", flex: 1, padding: "0 8px" }}>
                    <p style={{ color: NAVY, fontWeight: 900, fontSize: 26, lineHeight: 1, letterSpacing: -0.5 }}>Nexivio <span style={{ color: GREEN }}>Care</span></p>
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
                  <div style={{ textAlign: "right", minWidth: 155 }}>
                    {[{ icon: "📞", text: "01700-938055" }, { icon: "📞", text: "01923-905499" }, { icon: "✉️", text: "nexiviocare@gmail.com" }, { icon: "🌐", text: "www.nexiviocare.com" }, { icon: "📍", text: "DIT Road, 2nd Floor, West Rampura\n(West Side of BTV Center), Rampura, Dhaka." }].map(({ icon, text }) => (
                      <p key={text} style={{ fontSize: 9, color: "#1e293b", marginBottom: 2.5, fontWeight: 500, whiteSpace: "pre-line" }}>{icon} {text}</p>
                    ))}
                  </div>
                </div>
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

              {/* INVOICE NO / DATE */}
              <div style={{ margin: "8px 18px", border: `1.5px solid ${NAVY}30`, borderRadius: 6, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
                  {[{ label: "Invoice No.", value: invoice.invoiceNumber, color: GREEN }, { label: "Invoice Date", value: fmt(invoice.invoiceDate), color: NAVY }, { label: "Payment Status", value: invoice.paymentStatus.toUpperCase(), color: invoice.paymentStatus === "paid" ? GREEN : invoice.paymentStatus === "partial" ? "#d97706" : "#dc2626" }].map(({ label, value, color }, i) => (
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
                <div style={{ padding: "8px 12px 6px" }}>
                  {[{ label: "Client Name", value: invoice.clientName }, { label: "Mobile No.", value: invoice.phone }, { label: "Email", value: invoice.email ?? "" }, { label: "Address", value: invoice.address }].map(({ label, value }) => (
                    <div key={label} style={{ display: "flex", alignItems: "flex-end", marginBottom: 7 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#1e293b", minWidth: 72 }}>{label}</span>
                      <span style={{ fontSize: 10, color: "#475569", marginRight: 3 }}>:</span>
                      <div style={{ ...dotLine }}><span style={{ fontSize: 10, fontWeight: 600, color: "#0f172a" }}>{value}</span></div>
                    </div>
                  ))}
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
                      <th style={{ padding: "7px 8px", fontSize: 9, fontWeight: 700, color: "#fff", textAlign: "center", width: 80 }}>DAYS</th>
                      <th style={{ padding: "7px 8px", fontSize: 9, fontWeight: 700, color: "#fff", textAlign: "right", width: 88 }}>AMOUNT (BDT)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 1 ? "#fafafa" : "#fff" }}>
                        <td style={{ padding: "7px 8px", textAlign: "center", fontSize: 10, color: GREEN, fontWeight: 600 }}>{String(i + 1).padStart(2, "0")}</td>
                        <td style={{ padding: "7px 8px", fontSize: 11, fontWeight: 600, color: "#0f172a" }}>{item.service}</td>
                        <td style={{ padding: "7px 8px", textAlign: "center", fontSize: 9, color: "#475569" }}>{item.package || "—"}</td>
                        <td style={{ padding: "7px 8px", textAlign: "right", fontSize: 10, color: "#0f172a", fontWeight: 600 }}>{item.rate > 0 ? item.rate.toLocaleString() : "—"}</td>
                        <td style={{ padding: "7px 8px", textAlign: "center", fontSize: 10, fontWeight: 600, color: "#0f172a" }}>{item.days > 0 ? item.days : "—"}</td>
                        <td style={{ padding: "7px 8px", textAlign: "right", fontSize: 11, fontWeight: 700, color: "#0f172a" }}>{item.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1.5px solid ${NAVY}20` }}>
                  <div style={{ flex: 1, padding: "8px 12px", display: "flex", flexDirection: "column", justifyContent: "center", borderRight: `1px solid ${NAVY}15` }}>
                    <p style={{ fontSize: 8, fontWeight: 700, color: GREEN, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Amount in Words</p>
                    <p style={{ fontSize: 10, fontWeight: 800, color: "#0f172a", lineHeight: 1.4 }}>{numberToWords(invoice.total)}</p>
                  </div>
                  <div style={{ width: "46%" }}>
                    {[
                      { label: "Subtotal", value: `BDT  ${invoice.subtotal.toFixed(2)}`, bg: "#f8fafc", bold: false, tc: "#475569", vc: "#0f172a" },
                      { label: "Discount", value: `BDT  ${invoice.discount.toFixed(2)}`, bg: "#fff", bold: false, tc: GREEN, vc: GREEN },
                      { label: "NET PAYABLE", value: `BDT  ${invoice.total.toFixed(2)}`, bg: NAVY, bold: true, tc: "#fff", vc: "#fff" },
                      ...(invoice.paymentStatus !== "paid" ? [{ label: "Paid Amount", value: `BDT  ${invoice.paidAmount.toFixed(2)}`, bg: "#f0fdf4", bold: false, tc: GREEN, vc: GREEN }, { label: "DUE AMOUNT", value: `BDT  ${due.toFixed(2)}`, bg: "#fff7ed", bold: true, tc: "#c2410c", vc: "#c2410c" }] : []),
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
                          <div style={box(checked)}>{checked && <span style={{ color: "#fff", fontSize: 7, fontWeight: 900, lineHeight: 1 }}>✓</span>}</div>
                          <span style={{ fontSize: 9, fontWeight: checked ? 700 : 400, color: checked ? GREEN : "#475569" }}>{label}</span>
                        </div>
                      );
                    })}
                    {invoice.transactionRef && (
                      <div style={{ width: "100%", marginTop: 4, fontSize: 9, color: "#475569" }}>
                        Ref: <span style={{ fontWeight: 700, color: "#0f172a", fontFamily: "monospace" }}>{invoice.transactionRef}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ border: `1.5px solid ${GREEN}50`, borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ background: GREEN, padding: "5px 9px" }}>
                    <p style={{ color: "#fff", fontWeight: 800, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5 }}>NOTES</p>
                  </div>
                  <div style={{ padding: "6px 9px", position: "relative" }}>
                    <span style={{ fontSize: 20, color: NAVY, fontWeight: 900, lineHeight: 1, opacity: 0.25, position: "absolute", top: 2, left: 5 }}>&ldquo;</span>
                    <p style={{ fontSize: 9, color: "#475569", lineHeight: 1.5, paddingLeft: 11 }}>
                      {invoice.notes ?? "Thank you for choosing Nexivio Care. We appreciate your trust in our professional caregiving services."}
                    </p>
                    <span style={{ fontSize: 20, color: NAVY, fontWeight: 900, lineHeight: 1, opacity: 0.25, position: "absolute", bottom: 1, right: 5 }}>&rdquo;</span>
                  </div>
                </div>
              </div>

              {/* SIGNATURE ROW */}
              <div style={{ margin: "0 18px 10px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[{ title: "Customer Signature", icon: "👤" }, { title: "Company Seal", seal: true }, { title: "Authorized Signature", icon: "✏️" }].map(({ title, icon, seal }) => (
                  <div key={title} style={{ border: `1.5px solid ${GREEN}50`, borderRadius: 6, padding: "9px 12px", background: "#e8f5ee", textAlign: seal ? "center" : "left" }}>
                    {seal ? (
                      <>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 5 }}>Company Seal</p>
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <div style={{ width: 62, height: 62, borderRadius: "50%", overflow: "hidden", border: `2.5px solid ${GREEN}` }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/logo.jpeg" alt="Nexivio Care" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        </div>
                        <p style={{ fontSize: 9, fontWeight: 700, color: NAVY, marginTop: 4 }}>Nexivio Care</p>
                        <p style={{ fontSize: 7.5, color: "#64748b", fontStyle: "italic" }}>Care you can trust</p>
                      </>
                    ) : (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                          <span style={{ fontSize: 13 }}>{icon}</span>
                          <p style={{ fontSize: 10, fontWeight: 800, color: GREEN }}>{title}</p>
                        </div>
                        <div style={{ borderBottom: "1px dotted #94a3b8", marginTop: 22, marginBottom: 5 }} />
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5 }}>
                          <span style={{ fontSize: 9, color: "#475569" }}>Date:</span>
                          <span style={{ fontSize: 9, color: "#94a3b8" }}>__ / __ / ______</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* FOOTER */}
              <div style={{ background: NAVY, padding: "8px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 10, fontStyle: "italic" }}>♡ &nbsp;Thank you for choosing Nexivio Care.</p>
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
