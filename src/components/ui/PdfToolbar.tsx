"use client";

import { useRef, useState } from "react";
import { X, Download, Printer, Share2, MessageCircle, Mail, Copy, Check } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * ISO A4 in PostScript points — the international standard page size, and the
 * only page size this module ever emits. It is a constant, so a download from a
 * phone in Dhaka and a desktop in Berlin produce the same sheet.
 */
const A4_SHORT = 595.28; // 210mm
const A4_LONG = 841.89; // 297mm

/** Uniform page margin in points (~8mm), so nothing sits in a printer's dead zone. */
const MARGIN = 22;

/**
 * How much taller than one printable page a document may be and still be shrunk
 * onto a single sheet. Invoices and receipts are one-page documents, so this is
 * generous; only a genuinely long itemised invoice should ever paginate.
 */
const MAX_SINGLE_PAGE = 1.45;

/**
 * Pick the A4 orientation whose shape is closest to the artwork's, so a tall
 * invoice prints portrait and a wide money receipt prints landscape. Shared by
 * the PDF and the print sheet so the two can never disagree.
 */
const isLandscape = (aspect: number) =>
  Math.abs(aspect - A4_LONG / A4_SHORT) < Math.abs(aspect - A4_SHORT / A4_LONG);

/**
 * Render quality. The clone is captured at a fixed CSS width (never the
 * device width), so this is the only thing that varies the output resolution.
 */
const SCALE = 2;

/**
 * Make sure the embedded document fonts are actually downloaded and parsed.
 *
 * `document.fonts.ready` only settles for faces the browser has already decided
 * to fetch, so we request each weight/style we use by hand first. Without this a
 * capture can race the font load and lay text out in the fallback metrics.
 */
async function ensureDocFonts() {
  if (!document.fonts) return;
  const faces = [
    "400 12px NexivioDoc",
    "500 12px NexivioDoc",
    "600 12px NexivioDoc",
    "700 12px NexivioDoc",
    "800 12px NexivioDoc",
    "900 12px NexivioDoc",
    "italic 400 12px NexivioDoc",
    "italic 700 12px NexivioDocSerif",
  ];
  await Promise.all([
    ...faces.map((f) => document.fonts.load(f).catch(() => undefined)),
    // The Bengali face is selected by unicode-range, so it only loads when a
    // Bengali codepoint is requested.
    document.fonts.load("400 12px NexivioDoc", "ডি ৳").catch(() => undefined),
    document.fonts.load("700 12px NexivioDoc", "ডি ৳").catch(() => undefined),
  ]);
  await document.fonts.ready;
}

/**
 * Inline every cross-origin image as a data URL.
 *
 * html2canvas draws remote images straight onto the canvas, which taints it and
 * makes `toDataURL` throw. Fetching them ourselves keeps the canvas clean; an
 * image we cannot fetch is dropped so one bad URL can never break the whole PDF.
 */
async function inlineRemoteImages(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute("src") || "";
      if (!src || src.startsWith("data:")) return;
      // Same-origin images are safe to leave alone.
      try {
        if (new URL(src, window.location.href).origin === window.location.origin) return;
      } catch {
        return;
      }
      try {
        const res = await fetch(src, { mode: "cors", credentials: "omit" });
        if (!res.ok) throw new Error(String(res.status));
        const blob = await res.blob();
        img.src = await new Promise<string>((resolve, reject) => {
          const fr = new FileReader();
          fr.onload = () => resolve(fr.result as string);
          fr.onerror = reject;
          fr.readAsDataURL(blob);
        });
      } catch {
        img.style.visibility = "hidden";
      }
    })
  );
}

/** Resolve once every <img> in the subtree has loaded (or failed). */
function imagesSettled(root: HTMLElement) {
  const pending = Array.from(root.querySelectorAll("img")).filter((i) => !i.complete);
  return Promise.all(
    pending.map(
      (img) =>
        new Promise<void>((resolve) => {
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        })
    )
  );
}

/**
 * Export a document node to PDF.
 *
 * @param filename      Base name for the downloaded file.
 * @param captureWidth  The CSS width the document was designed at. The capture
 *                      always happens at this width regardless of the device,
 *                      so a phone and a desktop produce the same PDF.
 */
export function usePdfExport(filename: string, captureWidth = 794) {
  const printRef = useRef<HTMLDivElement>(null);

  /**
   * Capture the document off-screen.
   *
   * The live node is inside a responsive, `transform: scale()`d preview. Capturing
   * it in place made html2canvas lay text out at fractional coordinates (words ran
   * together, Bengali broke) and clipped fluid layouts to the phone's width. So we
   * deep-clone it into a detached host pinned at its design width, with no
   * inherited transform, and capture that instead.
   */
  const getCanvas = async () => {
    if (!printRef.current) return null;

    const host = document.createElement("div");
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = [
      "position:fixed",
      "top:0",
      `left:-${captureWidth + 200}px`,
      `width:${captureWidth}px`,
      "margin:0",
      "padding:0",
      "background:#ffffff",
      "transform:none",
      "zoom:1",
      "pointer-events:none",
      "z-index:-1",
    ].join(";");

    // Mobile browsers inflate text in blocks that are wider than the viewport
    // ("font boosting"). Our capture host is 794–960px wide on a ~360px phone,
    // which is exactly the trigger, and it would silently change every font
    // size. Pin it off for the whole subtree.
    const lock = document.createElement("style");
    lock.textContent = [
      "[data-pdf-capture-host], [data-pdf-capture-host] * {",
      "  -webkit-text-size-adjust: none !important;",
      "  -moz-text-size-adjust: none !important;",
      "  text-size-adjust: none !important;",
      "}",
    ].join("\n");
    host.setAttribute("data-pdf-capture-host", "");

    const clone = printRef.current.cloneNode(true) as HTMLElement;
    clone.style.width = `${captureWidth}px`;
    clone.style.maxWidth = `${captureWidth}px`;
    clone.style.minWidth = `${captureWidth}px`;
    clone.style.margin = "0";
    clone.style.transform = "none";
    host.appendChild(clone);
    document.head.appendChild(lock);
    document.body.appendChild(host);

    try {
      await inlineRemoteImages(clone);
      await imagesSettled(clone);
      // Webfonts must be resolved before html2canvas measures any text.
      await ensureDocFonts();

      return await html2canvas(clone, {
        scale: SCALE,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        // Pin the layout viewport so media queries and viewport units resolve
        // to the design size instead of the real device size.
        width: captureWidth,
        windowWidth: captureWidth,
        windowHeight: Math.max(clone.scrollHeight, 1123),
        scrollX: 0,
        scrollY: 0,
      });
    } finally {
      document.body.removeChild(host);
      document.head.removeChild(lock);
    }
  };

  /**
   * Lay the captured artwork onto fixed A4 pages.
   *
   * The page size is a constant, so the PDF opens identically everywhere. Content
   * that slightly overflows one page is shrunk to fit rather than spilling a
   * near-empty second page; anything genuinely longer is split across pages.
   */
  const canvasToPdf = (canvas: HTMLCanvasElement) => {
    const aspect = canvas.width / canvas.height;

    // Always A4; only the orientation adapts, and it is decided by the
    // document's own proportions — never by the device. We pick whichever
    // orientation is closest in shape to the artwork, so a tall invoice gets
    // portrait and a wide money receipt gets landscape.
    const landscape = isLandscape(aspect);
    const pageW = landscape ? A4_LONG : A4_SHORT;
    const pageH = landscape ? A4_SHORT : A4_LONG;
    const orientation = landscape ? "landscape" : "portrait";

    const pdf = new jsPDF({ orientation, unit: "pt", format: "a4", compress: true });
    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    const printW = pageW - MARGIN * 2;
    const printH = pageH - MARGIN * 2;

    // Height the artwork would occupy if scaled to the full printable width.
    const fullH = printW / aspect;

    // One sheet is the normal case for both invoices and receipts. Scale the
    // artwork to fit *inside* the printable box — contain, not fit-to-width —
    // so a document that is squarer than A4 shrinks to the binding dimension
    // instead of overflowing onto a second page. Only a document far longer
    // than a page (a very long itemised invoice) is actually paginated.
    if (fullH <= printH * MAX_SINGLE_PAGE) {
      const fit = Math.min(printW / canvas.width, printH / canvas.height);
      const w = canvas.width * fit;
      const h = canvas.height * fit;
      pdf.addImage(
        imgData,
        "JPEG",
        MARGIN + (printW - w) / 2,
        MARGIN + (printH - h) / 2,
        w,
        h,
        undefined,
        "FAST"
      );
      return pdf;
    }

    // Genuinely multi-page: slice the artwork into page-height bands. The image
    // is offset upward each page and the margins are repainted white so nothing
    // bleeds into a neighbouring band.
    const pages = Math.ceil(fullH / printH);
    for (let p = 0; p < pages; p++) {
      if (p > 0) pdf.addPage("a4", orientation);
      pdf.addImage(imgData, "JPEG", MARGIN, MARGIN - p * printH, printW, fullH, undefined, "FAST");
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pageW, MARGIN, "F");
      pdf.rect(0, pageH - MARGIN, pageW, MARGIN, "F");
      pdf.rect(0, 0, MARGIN, pageH, "F");
      pdf.rect(pageW - MARGIN, 0, MARGIN, pageH, "F");
    }
    return pdf;
  };

  const getPdfBlob = async (): Promise<Blob | null> => {
    const canvas = await getCanvas();
    if (!canvas) return null;
    return canvasToPdf(canvas).output("blob");
  };

  const handleDownload = async () => {
    const blob = await getPdfBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoking immediately can cancel the download on mobile Safari/Chrome.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  const handlePrint = async () => {
    const canvas = await getCanvas();
    if (!canvas) return;
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;border:0;visibility:hidden;";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc) return;
    // Mirror the PDF exactly: the same A4 sheet and orientation, artwork fitted
    // inside the same margin.
    const landscape = isLandscape(canvas.width / canvas.height);
    const sheetW = landscape ? "297mm" : "210mm";
    const sheetH = landscape ? "210mm" : "297mm";
    const css = `
      *{margin:0;padding:0;box-sizing:border-box;}
      html,body{background:#fff;}
      .sheet{width:${sheetW};height:${sheetH};padding:8mm;display:flex;align-items:center;justify-content:center;overflow:hidden;}
      .sheet img{max-width:100%;max-height:100%;width:auto;height:auto;display:block;}
      @page{margin:0;size:A4 ${landscape ? "landscape" : "portrait"};}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
    `;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${filename}</title><style>${css}</style></head><body><div class="sheet"><img src="${imgData}"/></div></body></html>`);
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
