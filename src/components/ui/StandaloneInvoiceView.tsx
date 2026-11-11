"use client";

import { useRef, useEffect, useState } from "react";
import { usePdfExport, PdfToolbar } from "@/components/ui/PdfToolbar";
import { numberToWords, assetUrl } from "@/lib/utils";

export interface InvoiceItem {
  service: string;
  package?: string;
  serviceStart?: string;
  serviceEnd?: string;
  rate: number;
  qty?: number;
  /** Billable days. Derived from the service period when both dates are set. */
  days?: number;
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
  /** Authorized signature image from site settings. */
  signatureUrl?: string | null;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "01 – 31 May 2026", collapsing the month/year when the range shares them. */
export function formatServicePeriod(start?: string, end?: string): string {
  const part = (s: string) => {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : { d: String(d.getDate()).padStart(2, "0"), m: MONTHS[d.getMonth()], y: d.getFullYear() };
  };
  const a = start ? part(start) : null;
  const b = end ? part(end) : null;
  if (!a && !b) return "";
  if (a && !b) return `${a.d} ${a.m} ${a.y}`;
  if (!a && b) return `${b!.d} ${b!.m} ${b!.y}`;
  if (a!.y === b!.y && a!.m === b!.m) return `${a!.d} – ${b!.d} ${b!.m} ${b!.y}`;
  if (a!.y === b!.y) return `${a!.d} ${a!.m} – ${b!.d} ${b!.m} ${b!.y}`;
  return `${a!.d} ${a!.m} ${a!.y} – ${b!.d} ${b!.m} ${b!.y}`;
}

/** Inclusive day count between two dates, so 01–31 May is 31 days. */
export function periodDays(start?: string, end?: string): number {
  if (!start || !end) return 0;
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  const days = Math.floor((b - a) / 86_400_000) + 1;
  return days > 0 ? days : 0;
}

/**
 * Billable days for a row: derived from the service period when both dates are
 * set, else the stored value (legacy invoices carry `days` with no dates).
 */
export const itemDays = (item: InvoiceItem): number =>
  periodDays(item.serviceStart, item.serviceEnd) || (item.days && item.days > 0 ? item.days : 1);

export const itemQty = (item: InvoiceItem): number => item.qty ?? 1;

/** Amount = days x rate x caregiver qty. */
export const itemAmount = (item: InvoiceItem): number =>
  itemDays(item) * (Number(item.rate) || 0) * itemQty(item);

const NAVY = "#16417e";
const BLUE = "#1c6fb5";
const SKY = "#e9f1fb";
const GREEN = "#27a04b";
const MINT = "#eaf7ef";
const MUTED = "#64748b";
const LINE = "#d7e3f2";

const BANK = [
  ["Account Name", "Nexivio Care"],
  ["Bank", "NCC Bank PLC"],
  ["Branch", "Malibagh Branch"],
  ["Account No.", "00130210021569"],
  ["Routing No.", "160273948"],
  ["SWIFT", "NCCLBDDHMBB"],
];

const TERMS = [
  "Service will be provided according to the agreed service terms.",
  "Additional hours or special requirements may incur additional charges.",
  "Service continuation is subject to timely payment.",
  "Please retain this invoice for your records.",
];

/* ── Inline icons (circular, like the reference) ───────────────────────────── */

function Dot({ children, size = 17, bg = BLUE }: { children: React.ReactNode; size?: number; bg?: string }) {
  return (
    <span style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {children}
    </span>
  );
}

const Ico = ({ d, s = 9, c = "#fff" }: { d: string; s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill={c}><path d={d} /></svg>
);

const P = {
  whatsapp: "M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm5.2 14.2c-.2.6-1.2 1.2-1.7 1.2-.4 0-1 .1-3.2-.9-2.7-1.2-4.4-4-4.5-4.2-.1-.2-1-1.4-1-2.6s.6-1.8.9-2.1c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2 0 .4-.1.5l-.3.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.2.1.4.1.5-.1l.7-.9c.2-.2.3-.2.6-.1l1.9.9c.3.1.4.2.5.3 0 .2 0 .8-.2 1.2z",
  phone: "M6.6 10.8a15 15 0 006.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.2.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 013 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1l-2.3 2.2z",
  mail: "M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
  globe: "M12 2a10 10 0 100 20 10 10 0 000-20zm6.9 6h-2.9a15 15 0 00-1.3-3.4A8 8 0 0118.9 8zM12 4a13 13 0 011.6 4h-3.2A13 13 0 0112 4zM4.3 14a8 8 0 010-4h3.3a17 17 0 000 4H4.3zm.8 2h2.9a15 15 0 001.3 3.4A8 8 0 015.1 16zm2.9-8H5.1a8 8 0 014.2-3.4A15 15 0 008 8zm4 12a13 13 0 01-1.6-4h3.2A13 13 0 0112 20zm2.1-6H9.9a15 15 0 010-4h4.2a15 15 0 010 4zm.6 5.4a15 15 0 001.3-3.4h2.9a8 8 0 01-4.2 3.4zM16.4 14a17 17 0 000-4h3.3a8 8 0 010 4h-3.3z",
  pin: "M12 2a7 7 0 00-7 7c0 5.3 7 13 7 13s7-7.7 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z",
  user: "M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4 0-9 2-9 5v3h18v-3c0-3-5-5-9-5z",
  bank: "M12 2L2 7v2h20V7L12 2zM4 11v7H2v3h20v-3h-2v-7h-3v7h-2v-7h-2v7H9v-7H4z",
  doc: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
  money: "M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm-8 13a5 5 0 110-10 5 5 0 010 10z",
  mobile: "M17 1H7a2 2 0 00-2 2v18a2 2 0 002 2h10a2 2 0 002-2V3a2 2 0 00-2-2zm-5 21a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm5-5H7V4h10v13z",
  info: "M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z",
  heart: "M12 21s-8-5.2-8-10.4A4.6 4.6 0 0112 8a4.6 4.6 0 018 2.6C20 15.8 12 21 12 21z",
};

export default function StandaloneInvoiceView({ invoice, onClose, signatureUrl }: Props) {
  const { printRef, getPdfBlob, handleDownload, handlePrint } = usePdfExport(`Invoice-${invoice.invoiceNumber}`, 794);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [docHeight, setDocHeight] = useState(0);

  useEffect(() => {
    const compute = () => {
      if (!wrapRef.current) return;
      setScale(Math.min(1, (wrapRef.current.clientWidth - 32) / 794));
      if (printRef.current) setDocHeight(printRef.current.offsetHeight);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [printRef]);

  const fmtDate = (s: string) => {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? "—" : `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  };

  // Overall service window spans every dated row.
  const starts = invoice.items.map((i) => i.serviceStart).filter(Boolean).sort() as string[];
  const ends = invoice.items.map((i) => i.serviceEnd).filter(Boolean).sort() as string[];
  const overallPeriod = formatServicePeriod(starts[0], ends[ends.length - 1]);
  const serviceTypes = [...new Set(invoice.items.map((i) => i.service.trim()).filter(Boolean))].join(", ");
  const duration = invoice.items.find((i) => i.package?.trim())?.package?.trim();
  const due = invoice.total - invoice.paidAmount;

  const meta: [string, string][] = [
    ["Invoice No.", invoice.invoiceNumber],
    ["Invoice Date", fmtDate(invoice.invoiceDate)],
    ["Payment Status", invoice.paymentStatus.toUpperCase()],
  ];

  const billTo: [string, string][] = [
    ["Client Name", invoice.clientName],
    ["Phone", invoice.phone],
    ["Email", invoice.email || "—"],
    ["Address", invoice.address],
  ];

  const serviceInfo: [string, string][] = [
    ["Service Location", "Same as above"],
    ["Service Type", serviceTypes || "—"],
    ["Service Period", overallPeriod || "—"],
    ["Duration", duration || "—"],
  ];

  const totals: { label: string; value: string; accent?: boolean }[] = [
    { label: "Subtotal", value: `৳ ${invoice.subtotal.toLocaleString()}` },
    { label: "Discount", value: `৳ ${invoice.discount.toLocaleString()}` },
    ...(invoice.paidAmount > 0 ? [{ label: "Paid Amount", value: `৳ ${invoice.paidAmount.toLocaleString()}`, accent: true }] : []),
  ];

  /** Label : value row used by the Bill To / Service panels. */
  const Row = ({ k, v, w = 92 }: { k: string; v: string; w?: number }) => (
    <div style={{ display: "flex", alignItems: "baseline", marginBottom: 6 }}>
      <span style={{ fontSize: 9.5, color: "#334155", minWidth: w, flexShrink: 0 }}>{k}</span>
      <span style={{ fontSize: 9.5, color: MUTED, marginRight: 6 }}>:</span>
      <span style={{ fontSize: 9.5, fontWeight: 600, color: "#0f172a", lineHeight: 1.35 }}>{v}</span>
    </div>
  );

  const PanelHead = ({ icon, title }: { icon: string; title: string }) => (
    <div style={{ background: SKY, borderRadius: 5, padding: "5px 10px", display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
      <Dot><Ico d={icon} /></Dot>
      <span style={{ fontSize: 10, fontWeight: 800, color: NAVY, letterSpacing: 0.6 }}>{title}</span>
    </div>
  );

  const th: React.CSSProperties = { padding: "8px 8px", fontSize: 9, fontWeight: 700, color: "#fff", letterSpacing: 0.3 };
  const td: React.CSSProperties = { padding: "9px 8px", fontSize: 10, color: "#0f172a", borderBottom: `1px solid ${LINE}` };

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
        <div ref={wrapRef} className="flex-1 bg-slate-100 overflow-y-auto overflow-x-hidden flex flex-col items-center py-4">
          <div style={{ transform: `scale(${scale})`, transformOrigin: "top center", width: 794, marginBottom: docHeight ? docHeight * scale - docHeight : 0 }}>
            <div ref={printRef} style={{ background: "#fff", fontFamily: "NexivioDoc, 'Segoe UI', Arial, sans-serif", color: "#1f2937", width: 794, position: "relative", overflow: "hidden" }}>

              {/* ── Corner swoosh ── */}
              <svg viewBox="0 0 300 160" style={{ position: "absolute", top: 0, right: 0, width: 300, height: 160 }}>
                <path d="M300,0 L120,0 C190,40 240,90 262,160 L300,160 Z" fill={BLUE} opacity="0.92" />
                <path d="M300,0 L185,0 C235,45 272,100 290,160 L300,160 Z" fill={GREEN} opacity="0.85" />
              </svg>

              {/* ── HEADER ── */}
              <div style={{ position: "relative", padding: "16px 26px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                {/* Logo */}
                <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 196 }}>
                  <div style={{ width: 62, height: 62, borderRadius: "50%", overflow: "hidden", border: `2.5px solid ${NAVY}`, flexShrink: 0 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo.jpeg" alt="Nexivio Care" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div>
                    <p style={{ color: NAVY, fontWeight: 900, fontSize: 21, lineHeight: 1.05 }}>Nexivio</p>
                    <p style={{ color: GREEN, fontWeight: 900, fontSize: 21, lineHeight: 1.05 }}>Care</p>
                    <p style={{ color: MUTED, fontSize: 8.5, fontStyle: "italic", marginTop: 2 }}>Care You Can Trust</p>
                  </div>
                </div>

                {/* Contact */}
                <div style={{ flex: 1, padding: "2px 0 0 18px" }}>
                  {[
                    [P.whatsapp, "01700-938055 (WhatsApp)"],
                    [P.phone, "01923-905499 (Call)"],
                    [P.mail, "nexiviocare@gmail.com"],
                    [P.globe, "www.nexiviocare.com"],
                  ].map(([icon, text]) => (
                    <div key={text} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                      <Dot><Ico d={icon} /></Dot>
                      <span style={{ fontSize: 9.5, color: "#1f2937" }}>{text}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
                    <Dot><Ico d={P.pin} /></Dot>
                    <span style={{ fontSize: 9, color: "#1f2937", lineHeight: 1.45 }}>
                      ডি আই টি রোড, পশ্চিম রামপুরা, ডিবিটি সেন্টার সংলগ্ন ফুট ওভার ব্রিজের পশ্চিম পার্শ্বে, দ্বিতীয় তলা।
                    </span>
                  </div>
                </div>

                {/* INVOICE */}
                <div style={{ textAlign: "right", minWidth: 188, position: "relative", zIndex: 1 }}>
                  <p style={{ fontFamily: "NexivioDocSerif, Georgia, serif", fontStyle: "italic", fontWeight: 700, fontSize: 15, color: NAVY, marginBottom: 2 }}>Care You Can Trust</p>
                  <svg viewBox="0 0 150 10" style={{ width: 150, height: 10, marginLeft: "auto", display: "block" }}>
                    <path d="M2,7 Q60,0 140,4" stroke={GREEN} strokeWidth="2" fill="none" strokeLinecap="round" />
                    <path d="M140,4 q7,-5 9,1 q-6,4 -9,-1z" fill={GREEN} />
                  </svg>
                  <p style={{ color: NAVY, fontWeight: 900, fontSize: 40, letterSpacing: 1, lineHeight: 1.05, marginTop: 2 }}>INVOICE</p>
                </div>
              </div>

              {/* Divider + meta */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 14, padding: "10px 26px 0" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 5, borderRadius: 3, background: `linear-gradient(90deg, ${NAVY} 0%, ${NAVY} 45%, ${GREEN} 100%)` }} />
                </div>
                <div style={{ width: 290, background: SKY, borderRadius: 5, padding: "7px 12px" }}>
                  {meta.map(([k, v]) => (
                    <div key={k} style={{ display: "flex", alignItems: "baseline", marginBottom: 2 }}>
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: NAVY, minWidth: 86 }}>{k}</span>
                      <span style={{ fontSize: 9.5, color: MUTED, marginRight: 6 }}>:</span>
                      <span style={{ fontSize: 10, fontWeight: 800, color: "#0f172a" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── BILL TO / SERVICE ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: "14px 26px 0" }}>
                <div>
                  <PanelHead icon={P.user} title="BILL TO" />
                  <div style={{ paddingLeft: 2 }}>
                    {billTo.map(([k, v]) => <Row key={k} k={k} v={v} />)}
                  </div>
                </div>
                <div>
                  <PanelHead icon={P.pin} title="SERVICE LOCATION" />
                  <div style={{ paddingLeft: 2 }}>
                    {serviceInfo.map(([k, v]) => <Row key={k} k={k} v={v} w={96} />)}
                  </div>
                </div>
              </div>

              {/* ── ITEMS ── */}
              <div style={{ margin: "12px 26px 0", border: `1px solid ${LINE}`, borderRadius: 6, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: NAVY }}>
                      <th style={{ ...th, textAlign: "center", width: 34 }}>#</th>
                      <th style={{ ...th, textAlign: "left" }}>Description</th>
                      <th style={{ ...th, textAlign: "center", width: 132 }}>Service Period</th>
                      <th style={{ ...th, textAlign: "right", width: 86 }}>Rate (৳)</th>
                      <th style={{ ...th, textAlign: "center", width: 52 }}>Qty</th>
                      <th style={{ ...th, textAlign: "right", width: 96 }}>Amount (৳)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, i) => {
                      const period = formatServicePeriod(item.serviceStart, item.serviceEnd);
                      const days = itemDays(item);
                      return (
                        <tr key={i}>
                          <td style={{ ...td, textAlign: "center", color: MUTED }}>{i + 1}</td>
                          <td style={td}>
                            <div style={{ fontWeight: 600 }}>{item.service || "—"}</div>
                            {item.package && <div style={{ fontSize: 8.5, color: MUTED, marginTop: 1 }}>({item.package})</div>}
                          </td>
                          <td style={{ ...td, textAlign: "center", fontSize: 9 }}>
                            {period || "—"}
                            {period && <div style={{ fontSize: 8, color: GREEN, fontWeight: 700, marginTop: 1 }}>{days} {days === 1 ? "day" : "days"}</div>}
                          </td>
                          <td style={{ ...td, textAlign: "right" }}>{item.rate > 0 ? item.rate.toLocaleString() : "–"}</td>
                          <td style={{ ...td, textAlign: "center" }}>{itemQty(item) || "–"}</td>
                          <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{item.amount.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── WORDS + TOTALS ── */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "12px 26px 0" }}>
                <div style={{ flex: 1, background: MINT, borderRadius: 7, padding: "11px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <Dot size={26} bg={GREEN}><Ico d={P.money} s={14} /></Dot>
                  <div>
                    <p style={{ fontSize: 9.5, fontWeight: 700, color: "#15803d" }}>Amount in Words</p>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#14532d", marginTop: 2, lineHeight: 1.3 }}>{numberToWords(invoice.total)}</p>
                  </div>
                </div>
                <div style={{ width: 322, border: `1px solid ${LINE}`, borderRadius: 6, overflow: "hidden" }}>
                  {totals.map(({ label, value, accent }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 13px", borderBottom: `1px solid ${LINE}`, background: accent ? MINT : "#fff" }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: accent ? "#15803d" : "#334155" }}>{label}</span>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: accent ? "#15803d" : "#0f172a" }}>{value}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 13px", background: GREEN }}>
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: "#fff", letterSpacing: 0.4 }}>TOTAL DUE</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>৳ {(due > 0 ? due : invoice.total).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* ── PAYMENT INFORMATION ── */}
              <div style={{ margin: "14px 26px 0", border: `1px solid ${LINE}`, borderRadius: 7, overflow: "hidden" }}>
                <div style={{ background: SKY, padding: "6px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                  <Dot size={19}><Ico d={P.bank} s={10} /></Dot>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: NAVY, letterSpacing: 0.6 }}>PAYMENT INFORMATION</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr" }}>
                  <div style={{ padding: "10px 14px", borderRight: `1px solid ${LINE}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                      <Ico d={P.bank} s={12} c={BLUE} />
                      <span style={{ fontSize: 10, fontWeight: 800, color: NAVY }}>Bank Transfer <span style={{ fontWeight: 500, color: MUTED }}>(NCC Bank PLC)</span></span>
                    </div>
                    {BANK.map(([k, v]) => (
                      <div key={k} style={{ display: "flex", alignItems: "baseline", marginBottom: 4 }}>
                        <span style={{ fontSize: 9, color: "#334155", minWidth: 82 }}>{k}</span>
                        <span style={{ fontSize: 9, color: MUTED, marginRight: 6 }}>:</span>
                        <span style={{ fontSize: 9, fontWeight: 600, color: BLUE }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
                      <Ico d={P.mobile} s={12} c={BLUE} />
                      <span style={{ fontSize: 10, fontWeight: 800, color: NAVY }}>Mobile Payment</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, textAlign: "center" }}>
                      {[{ n: "bKash", src: "/bkash.jpg", no: "01700-938055" }, { n: "Nagad", src: "/nagad.webp", no: "01700-938055" }].map(({ n, src, no }) => (
                        <div key={n}>
                          <div style={{ height: 30, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 3 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt={n} style={{ maxHeight: 30, maxWidth: 96, objectFit: "contain" }} />
                          </div>
                          <p style={{ fontSize: 9.5, fontWeight: 800, color: "#0f172a" }}>{n}</p>
                          <p style={{ fontSize: 9.5, fontWeight: 700, color: "#0f172a" }}>{no}</p>
                        </div>
                      ))}
                    </div>
                    {invoice.transactionRef && (
                      <p style={{ fontSize: 8.5, color: MUTED, marginTop: 7, textAlign: "center" }}>
                        Ref: <span style={{ fontWeight: 700, color: "#0f172a", fontFamily: "monospace" }}>{invoice.transactionRef}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div style={{ background: SKY, padding: "7px 13px", display: "flex", alignItems: "flex-start", gap: 8, borderTop: `1px solid ${LINE}` }}>
                  <Dot size={16}><Ico d={P.info} s={9} /></Dot>
                  <span style={{ fontSize: 9, color: "#334155", lineHeight: 1.45 }}>
                    Please mention the Invoice Number when making payment and share the transaction ID / payment confirmation with Nexivio Care.
                  </span>
                </div>
              </div>

              {/* ── TERMS + SIGNATURES ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.05fr", gap: 14, padding: "13px 26px 0" }}>
                <div>
                  <PanelHead icon={P.doc} title="NOTES & TERMS" />
                  <ol style={{ margin: 0, paddingLeft: 16 }}>
                    {(invoice.notes?.trim() ? [invoice.notes.trim(), ...TERMS] : TERMS).map((t, i) => (
                      <li key={i} style={{ fontSize: 8.5, color: "#334155", lineHeight: 1.6, marginBottom: 1 }}>{t}</li>
                    ))}
                  </ol>
                </div>
                <div style={{ border: `1px solid ${LINE}`, borderRadius: 7, display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                  <div style={{ padding: "9px 12px", borderRight: `1px solid ${LINE}` }}>
                    <p style={{ fontSize: 9.5, fontWeight: 800, color: NAVY, marginBottom: 10 }}>Client / Authorized Person</p>
                    {["Signature", "Name", "Date"].map((l) => (
                      <div key={l} style={{ display: "flex", alignItems: "flex-end", marginBottom: 9 }}>
                        <span style={{ fontSize: 9, color: "#334155", minWidth: 50 }}>{l}</span>
                        <span style={{ fontSize: 9, color: MUTED, marginRight: 4 }}>:</span>
                        <div style={{ flex: 1, borderBottom: "1px solid #94a3b8", height: 11 }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "9px 12px", textAlign: "center" }}>
                    <p style={{ fontSize: 9.5, fontWeight: 800, color: NAVY, marginBottom: 3 }}>For Nexivio Care</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 44 }}>
                      {signatureUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={assetUrl(signatureUrl)} alt="Authorized signature" style={{ maxHeight: 42, maxWidth: 104, objectFit: "contain" }} />
                      ) : (
                        <span style={{ width: 104 }} />
                      )}
                      <div style={{ width: 42, height: 42, borderRadius: "50%", overflow: "hidden", border: `2px solid ${NAVY}`, flexShrink: 0 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo.jpeg" alt="Seal" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    </div>
                    <div style={{ borderBottom: "1px solid #94a3b8", margin: "2px 6px 4px" }} />
                    <p style={{ fontSize: 8.5, color: "#334155" }}>Authorized Signature</p>
                    <p style={{ fontSize: 8, color: MUTED }}>(Nexivio Care)</p>
                  </div>
                </div>
              </div>

              {/* ── FOOTER ── */}
              <div style={{ marginTop: 14, position: "relative", height: 74 }}>
                <svg viewBox="0 0 794 74" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
                  <path d="M0,34 C150,6 330,6 480,22 C620,37 720,30 794,16 L794,74 L0,74 Z" fill={GREEN} opacity="0.85" />
                  <path d="M0,48 C170,20 340,24 500,38 C640,50 730,46 794,34 L794,74 L0,74 Z" fill={NAVY} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 26px 11px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Ico d={P.heart} s={11} c="#ffffff" />
                    <span style={{ fontSize: 9.5, color: "#fff", fontStyle: "italic" }}>Professional Care &nbsp;|&nbsp; Trusted Service &nbsp;|&nbsp; Healthier Tomorrow</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontFamily: "NexivioDocSerif, Georgia, serif", fontStyle: "italic", fontSize: 19, fontWeight: 700, color: "#fff", lineHeight: 1 }}>Thank You</p>
                    <p style={{ fontSize: 8.5, color: "rgba(255,255,255,0.85)" }}>for Choosing Nexivio Care</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
