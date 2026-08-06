"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar, Users, Star, MessageSquare, Bell, Briefcase,
  BookOpen, Megaphone, TrendingUp, Clock, CheckCircle,
  AlertCircle, ArrowRight, GraduationCap, Plus, Smartphone,
  Activity, BarChart3, Zap, Car, Truck,
} from "lucide-react";
import { api } from "@/lib/api";

interface Stats {
  totalBookings: number;
  pendingBookings: number;
  totalApplications: number;
  pendingApplications: number;
  totalReviews: number;
  pendingReviews: number;
  totalContacts: number;
  activeServices: number;
  activeTraining: number;
  activeBanners: number;
  totalVehicleRegistrations?: number;
  pendingVehicleRegistrations?: number;
  totalTransportBookings?: number;
  pendingTransportBookings?: number;
}

const defaultStats: Stats = {
  totalBookings: 0, pendingBookings: 0,
  totalApplications: 0, pendingApplications: 0,
  totalReviews: 0, pendingReviews: 0,
  totalContacts: 0, activeServices: 0,
  activeTraining: 0, activeBanners: 0,
  totalVehicleRegistrations: 0, pendingVehicleRegistrations: 0,
  totalTransportBookings: 0, pendingTransportBookings: 0,
};

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="h-11 w-11 rounded-xl bg-slate-100" />
        <div className="h-5 w-16 rounded-full bg-slate-100" />
      </div>
      <div className="h-7 w-20 rounded bg-slate-100 mb-2" />
      <div className="h-4 w-28 rounded bg-slate-100" />
    </div>
  );
}

function StatCard({
  title, value, icon: Icon, gradient, badge, badgeColor, href, trend,
}: {
  title: string; value: number | string; icon: React.ElementType;
  gradient: string; badge?: string; badgeColor?: string; href: string; trend?: string;
}) {
  return (
    <Link href={href} className="group bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 block">
      <div className="flex items-start justify-between mb-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${gradient}`}>
          <Icon size={20} className="text-white" />
        </div>
        {badge && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-800 mb-1">{value}</p>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>
        {trend && <p className="text-xs text-emerald-600 font-medium">{trend}</p>}
      </div>
      <div className="mt-3 flex items-center gap-1 text-xs text-primary-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        <span>বিস্তারিত দেখুন</span>
        <ArrowRight size={12} />
      </div>
    </Link>
  );
}

function QuickAction({ href, icon: Icon, label, color }: { href: string; icon: React.ElementType; label: string; color: string }) {
  return (
    <Link href={href} className={`flex flex-col items-center gap-2 p-4 rounded-xl ${color} hover:opacity-90 transition-all hover:scale-105 duration-200`}>
      <Icon size={22} className="text-white" />
      <span className="text-xs font-semibold text-white text-center leading-tight">{label}</span>
    </Link>
  );
}

function PendingItem({ icon: Icon, label, count, color, href }: { icon: React.ElementType; label: string; count: number; color: string; href: string }) {
  if (count === 0) return null;
  return (
    <Link href={href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
        <Icon size={16} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-xs text-slate-400">{count}টি অপেক্ষায় আছে</p>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600 text-xs font-bold">{count}</span>
        <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>(defaultStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: Stats }>("/admin/stats")
      .then((r) => setStats(r.data))
      .catch(() => {});
    // Fetch transport stats separately
    Promise.all([
      api.get<{ data: { id: string; status: string }[] }>("/vehicle-registrations").catch(() => ({ data: [] })),
      api.get<{ data: { id: string; status: string }[] }>("/transport-bookings").catch(() => ({ data: [] })),
    ]).then(([vr, tb]) => {
      setStats((prev) => ({
        ...prev,
        totalVehicleRegistrations: vr.data.length,
        pendingVehicleRegistrations: vr.data.filter((r) => r.status === "pending").length,
        totalTransportBookings: tb.data.length,
        pendingTransportBookings: tb.data.filter((b) => b.status === "pending").length,
      }));
    }).finally(() => setLoading(false));
  }, []);

  const totalPending = stats.pendingBookings + stats.pendingApplications + stats.pendingReviews
    + (stats.pendingVehicleRegistrations ?? 0) + (stats.pendingTransportBookings ?? 0);
  const now = new Date();
  const timeStr = now.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("bn-BD", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="space-y-6">

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-primary-800 rounded-2xl p-6 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-primary-400 translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-white/60 font-medium">সিস্টেম সক্রিয়</span>
            </div>
            <h2 className="text-2xl font-bold">স্বাগতম, অ্যাডমিন! 👋</h2>
            <p className="text-white/60 text-sm mt-1">{dateStr}</p>
          </div>
          <div className="flex items-center gap-4">
            {totalPending > 0 && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/20">
                <AlertCircle size={16} className="text-amber-400" />
                <div>
                  <p className="text-xs text-white/60">মুলতুবি কাজ</p>
                  <p className="text-lg font-bold text-amber-400">{totalPending}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/20">
              <Clock size={16} className="text-white/60" />
              <div>
                <p className="text-xs text-white/60">বর্তমান সময়</p>
                <p className="text-lg font-bold">{timeStr}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">পরিসংখ্যান</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard title="গাড়ি নিবন্ধন" value={stats.totalVehicleRegistrations ?? 0} icon={Car}
                gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                badge={(stats.pendingVehicleRegistrations ?? 0) > 0 ? `${stats.pendingVehicleRegistrations} নতুন` : undefined}
                badgeColor="bg-emerald-50 text-emerald-600" href="/dashboard/vehicle-registrations" />
              <StatCard title="ট্রান্সপোর্ট বুকিং" value={stats.totalTransportBookings ?? 0} icon={Truck}
                gradient="bg-gradient-to-br from-cyan-500 to-blue-600"
                badge={(stats.pendingTransportBookings ?? 0) > 0 ? `${stats.pendingTransportBookings} নতুন` : undefined}
                badgeColor="bg-cyan-50 text-cyan-600" href="/dashboard/transport-bookings" />
              <StatCard title="মোট বুকিং" value={stats.totalBookings} icon={Calendar}
                gradient="bg-gradient-to-br from-blue-500 to-blue-600"
                badge={stats.pendingBookings > 0 ? `${stats.pendingBookings} নতুন` : undefined}
                badgeColor="bg-blue-50 text-blue-600" href="/dashboard/bookings" />
              <StatCard title="চাকরি আবেদন" value={stats.totalApplications} icon={Users}
                gradient="bg-gradient-to-br from-violet-500 to-purple-600"
                badge={stats.pendingApplications > 0 ? `${stats.pendingApplications} নতুন` : undefined}
                badgeColor="bg-violet-50 text-violet-600" href="/dashboard/applications" />
              <StatCard title="রিভিউসমূহ" value={stats.totalReviews} icon={Star}
                gradient="bg-gradient-to-br from-amber-400 to-orange-500"
                badge={stats.pendingReviews > 0 ? `${stats.pendingReviews} বাকি` : undefined}
                badgeColor="bg-amber-50 text-amber-600" href="/dashboard/reviews" />
              <StatCard title="যোগাযোগ বার্তা" value={stats.totalContacts} icon={MessageSquare}
                gradient="bg-gradient-to-br from-rose-500 to-pink-600"
                href="/dashboard/contacts" />
              <StatCard title="সক্রিয় সেবা" value={stats.activeServices} icon={Briefcase}
                gradient="bg-gradient-to-br from-primary-600 to-primary-700"
                href="/dashboard/services" trend="সক্রিয়" />
              <StatCard title="প্রশিক্ষণ প্রোগ্রাম" value={stats.activeTraining} icon={BookOpen}
                gradient="bg-gradient-to-br from-teal-500 to-cyan-600"
                href="/dashboard/training" trend="চলমান" />
              <StatCard title="সক্রিয় ব্যানার" value={stats.activeBanners} icon={Megaphone}
                gradient="bg-gradient-to-br from-orange-500 to-red-500"
                href="/dashboard/banners" />
              <StatCard title="নোটিস" value="—" icon={Bell}
                gradient="bg-gradient-to-br from-navy-800 to-navy-950"
                href="/dashboard/notices" />
            </>
          )}
        </div>
      </div>

      {/* Bottom Row: Quick Actions + Pending Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-700">দ্রুত অ্যাকশন</h3>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            <QuickAction href="/dashboard/vehicle-registrations" icon={Car} label="গাড়ি নিবন্ধন" color="bg-gradient-to-br from-emerald-500 to-teal-600" />
            <QuickAction href="/dashboard/transport-bookings" icon={Truck} label="ট্রান্সপোর্ট" color="bg-gradient-to-br from-cyan-500 to-blue-600" />
            <QuickAction href="/dashboard/bookings" icon={Calendar} label="বুকিং" color="bg-gradient-to-br from-blue-500 to-blue-600" />
            <QuickAction href="/dashboard/applications" icon={Users} label="আবেদন" color="bg-gradient-to-br from-violet-500 to-purple-600" />
            <QuickAction href="/dashboard/notices" icon={Bell} label="নোটিস" color="bg-gradient-to-br from-navy-800 to-navy-950" />
            <QuickAction href="/dashboard/enrollments" icon={GraduationCap} label="ভর্তি" color="bg-gradient-to-br from-teal-500 to-cyan-600" />
            <QuickAction href="/dashboard/sms" icon={Smartphone} label="SMS" color="bg-gradient-to-br from-emerald-500 to-green-600" />
            <QuickAction href="/dashboard/gallery" icon={Plus} label="গ্যালারি" color="bg-gradient-to-br from-orange-500 to-red-500" />
          </div>

          {/* System Health */}
          <div className="mt-5 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={14} className="text-slate-400" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">সিস্টেম স্ট্যাটাস</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "API সার্ভার", ok: true },
                { label: "ডেটাবেজ", ok: true },
                { label: "স্টোরেজ", ok: true },
              ].map(({ label, ok }) => (
                <div key={label} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                  <CheckCircle size={13} className={ok ? "text-emerald-500" : "text-red-500"} />
                  <span className="text-xs text-slate-600 font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending Alerts */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-700">মুলতুবি কাজ</h3>
            </div>
            {totalPending > 0 && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                {totalPending}
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : totalPending === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 mb-3">
                <CheckCircle size={24} className="text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-slate-700">সব ঠিকঠাক!</p>
              <p className="text-xs text-slate-400 mt-1">কোনো মুলতুবি কাজ নেই</p>
            </div>
          ) : (
            <div className="space-y-1">
              <PendingItem icon={Car} label="গাড়ি নিবন্ধন" count={stats.pendingVehicleRegistrations ?? 0}
                color="bg-gradient-to-br from-emerald-500 to-teal-600" href="/dashboard/vehicle-registrations" />
              <PendingItem icon={Truck} label="ট্রান্সপোর্ট বুকিং" count={stats.pendingTransportBookings ?? 0}
                color="bg-gradient-to-br from-cyan-500 to-blue-600" href="/dashboard/transport-bookings" />
              <PendingItem icon={Calendar} label="বুকিং অনুমোদন" count={stats.pendingBookings}
                color="bg-gradient-to-br from-blue-500 to-blue-600" href="/dashboard/bookings" />
              <PendingItem icon={Users} label="চাকরি আবেদন" count={stats.pendingApplications}
                color="bg-gradient-to-br from-violet-500 to-purple-600" href="/dashboard/applications" />
              <PendingItem icon={Star} label="রিভিউ অনুমোদন" count={stats.pendingReviews}
                color="bg-gradient-to-br from-amber-400 to-orange-500" href="/dashboard/reviews" />
            </div>
          )}

          {/* Overview bar */}
          {!loading && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500">সামগ্রিক কার্যক্রম</p>
                <p className="text-xs font-semibold text-primary-600">
                  {stats.totalBookings + stats.totalApplications + stats.totalReviews} মোট
                </p>
              </div>
              <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-slate-100">
                {stats.totalBookings > 0 && (
                  <div className="bg-blue-500 rounded-full" style={{ flex: stats.totalBookings }} />
                )}
                {stats.totalApplications > 0 && (
                  <div className="bg-violet-500 rounded-full" style={{ flex: stats.totalApplications }} />
                )}
                {stats.totalReviews > 0 && (
                  <div className="bg-amber-400 rounded-full" style={{ flex: stats.totalReviews }} />
                )}
              </div>
              <div className="flex gap-3 mt-2">
                {[
                  { color: "bg-blue-500", label: "বুকিং" },
                  { color: "bg-violet-500", label: "আবেদন" },
                  { color: "bg-amber-400", label: "রিভিউ" },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1">
                    <div className={`h-2 w-2 rounded-full ${color}`} />
                    <span className="text-xs text-slate-400">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer note */}
      <div className="flex items-center justify-center gap-2 py-2">
        <TrendingUp size={13} className="text-slate-300" />
        <p className="text-xs text-slate-300">Nexivio Care Admin Panel — সর্বশেষ আপডেট: এইমাত্র</p>
      </div>
    </div>
  );
}
