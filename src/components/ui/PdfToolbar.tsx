"use client";

import { useRef, useState } from "react";
import { X, Download, Printer, Share2, MessageCircle, Mail, Copy, Check } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export function usePdfExport(filename: string) {
  const printRef = useRef<HTMLDivElement>(null);

  const getCanvas = async () => {
    if (!printRef.current) return null;
    return html2canvas(printRef.current, { scale: 2, useCORS: true, allowTaint: true });
  };

  const getPdfBlob = async (): Promise<Blob | null> => {
    const canvas = await getCanvas();
    if (!canvas) return null;
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width / 2, canvas.height / 2] });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
    return pdf.output("blob");
  };

  const handleDownload = async () => {
    const blob = await getPdfBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${filename}.pdf`; a.click();
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
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${filename}</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#fff;}img{width:100%;display:block;}@media print{@page{margin:0;size:A4;}body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}</style></head><body><img src="${imgData}"/></body></html>`);
    doc.close();
    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
  };

  return { printRef, getPdfBlob, handleDownload, handlePrint };
}

interface PdfToolbarProps {
  filename: string;
  title: string;
  onClose: () => void;
  getPdfBlob: () => Promise<Blob | null>;
  handleDownload: () => void;
  handlePrint: () => void;
}

export function PdfToolbar({ filename, title, onClose, getPdfBlob, handleDownload, handlePrint }: PdfToolbarProps) {
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareFile = async () => {
    const blob = await getPdfBlob();
    if (!blob) return;
    const file = new File([blob], `${filename}.pdf`, { type: "application/pdf" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: filename });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${filename}.pdf`; a.click();
      URL.revokeObjectURL(url);
    }
    setShowShare(false);
  };

  const shareEmail = async () => {
    const blob = await getPdfBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${filename}.pdf`; a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => window.open(`mailto:?subject=${encodeURIComponent(filename)}&body=Please find the attached document.`, "_self"), 300);
    setShowShare(false);
  };

  const savePdf = async () => {
    await handleDownload();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowShare(false);
  };

  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <div className="flex items-center gap-2">
        <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors">
          <Printer size={13} /> Print
        </button>
        <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          <Download size={13} /> Download PDF
        </button>
        <div className="relative">
          <button onClick={() => setShowShare((v) => !v)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            <Share2 size={13} /> Share
          </button>
          {showShare && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowShare(false)} />
              <div className="absolute right-0 top-9 z-20 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 overflow-hidden">
                <button onClick={shareFile} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                  <MessageCircle size={14} className="text-green-500" /> WhatsApp / Share
                </button>
                <button onClick={shareEmail} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                  <Mail size={14} className="text-blue-500" /> Email
                </button>
                <button onClick={savePdf} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-slate-400" />}
                  {copied ? "Saved!" : "Save PDF"}
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
  );
}
