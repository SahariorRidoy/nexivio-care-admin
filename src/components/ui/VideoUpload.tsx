"use client";

import { useRef, useState } from "react";
import { Video, X, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { assetUrl } from "@/lib/utils";

interface VideoUploadProps {
  value?: string;
  onChange: (url: string, publicId: string) => void;
  onClear?: () => void;
}

export default function VideoUpload({ value, onChange, onClear }: VideoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    setError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("video", file);
      const res = await api.upload<{ data: { url: string; publicId: string } }>("/uploads/video", form);
      onChange(res.data.url, res.data.publicId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "আপলোড ব্যর্থ হয়েছে");
    } finally {
      setUploading(false);
    }
  };

  const preview = value ? assetUrl(value) : null;

  return (
    <div>
      {preview ? (
        <div className="relative inline-block w-full max-w-xs">
          <video src={preview} controls className="h-32 w-full rounded-xl border border-slate-200 object-cover" />
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
            >
              <X size={12} />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex flex-col items-center justify-center gap-2 w-full h-32 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 hover:border-primary-400 hover:text-primary-600 transition-colors disabled:opacity-60"
        >
          {uploading ? <Loader2 size={22} className="animate-spin" /> : <Video size={22} />}
          <span className="text-sm">{uploading ? "আপলোড হচ্ছে..." : "ভিডিও আপলোড করুন"}</span>
          <span className="text-xs text-slate-400">mp4, webm, mov — সর্বোচ্চ 200MB</span>
        </button>
      )}
      {!preview && (
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/x-matroska"
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
        />
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
