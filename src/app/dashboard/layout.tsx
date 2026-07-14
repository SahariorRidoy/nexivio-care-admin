"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

const routeTitles: Record<string, string> = {
  "/dashboard": "ড্যাশবোর্ড",
  "/dashboard/services": "সেবাসমূহ",
  "/dashboard/training": "প্রশিক্ষণ",
  "/dashboard/bookings": "বুকিংসমূহ",
  "/dashboard/applications": "চাকরি আবেদন",
  "/dashboard/notices": "নোটিসসমূহ",
  "/dashboard/reviews": "রিভিউসমূহ",
  "/dashboard/gallery": "গ্যালারি",
  "/dashboard/banners": "ব্যানার",
  "/dashboard/contacts": "যোগাযোগ",
  "/dashboard/team": "টিম সদস্য",
  "/dashboard/staff": "কর্মীবৃন্দ",
  "/dashboard/settings": "সাইট সেটিংস",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          <p className="text-sm text-slate-500">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const title = routeTitles[pathname] ?? "অ্যাডমিন";

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
