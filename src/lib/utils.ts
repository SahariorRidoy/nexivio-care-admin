import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("bn-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Dhaka",
  });
}

export function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("bn-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dhaka",
  });
}

export function assetUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ?? "http://localhost:5000";
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
  "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];

function chunk(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ones[n] + " ";
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "") + " ";
  return ones[Math.floor(n / 100)] + " Hundred " + chunk(n % 100);
}

export function numberToWords(n: number): string {
  if (n === 0) return "Zero Taka Only";
  const int = Math.floor(Math.abs(n));
  let result = "";
  if (int >= 10000000) { result += chunk(Math.floor(int / 10000000)) + "Crore "; }
  if (int >= 100000)   { result += chunk(Math.floor((int % 10000000) / 100000)) + "Lakh "; }
  if (int >= 1000)     { result += chunk(Math.floor((int % 100000) / 1000)) + "Thousand "; }
  result += chunk(int % 1000);
  return result.trim() + " Taka Only";
}

export async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, "_blank");
  }
}
