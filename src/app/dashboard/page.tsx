"use client";

import { useEffect, useState } from "react";
import { Calendar, Users, Star, MessageSquare, Bell, Briefcase, BookOpen, Megaphone } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
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
}

const defaultStats: Stats = {
  totalBookings: 0,
  pendingBookings: 0,
  totalApplications: 0,
  pendingApplications: 0,
  totalReviews: 0,
  pendingReviews: 0,
  totalContacts: 0,
  activeServices: 0,
  activeTraining: 0,
  activeBanners: 0,
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>(defaultStats);

  useEffect(() => {
    api.get<{ data: Stats }>("/admin/stats")
      .then((r) => setStats(r.data))
      .catch(() => {}); // silently fail — stats will show 0
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">স্বাগতম, অ্যাডমিন!</h2>
        <p className="text-sm text-slate-500 mt-1">আজকের সারসংক্ষেপ দেখুন</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="মোট বুকিং"
          value={stats.totalBookings}
          Icon={Calendar}
          iconBg="bg-blue-100 text-blue-700"
          change={`${stats.pendingBookings} বিচারাধীন`}
        />
        <StatCard
          title="চাকরি আবেদন"
          value={stats.totalApplications}
          Icon={Users}
          iconBg="bg-purple-100 text-purple-700"
          change={`${stats.pendingApplications} নতুন`}
        />
        <StatCard
          title="রিভিউসমূহ"
          value={stats.totalReviews}
          Icon={Star}
          iconBg="bg-amber-100 text-amber-700"
          change={`${stats.pendingReviews} অনুমোদন বাকি`}
        />
        <StatCard
          title="যোগাযোগ বার্তা"
          value={stats.totalContacts}
          Icon={MessageSquare}
          iconBg="bg-rose-100 text-rose-700"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="সক্রিয় সেবা"
          value={stats.activeServices}
          Icon={Briefcase}
          iconBg="bg-primary-100 text-primary-700"
        />
        <StatCard
          title="প্রশিক্ষণ প্রোগ্রাম"
          value={stats.activeTraining}
          Icon={BookOpen}
          iconBg="bg-teal-100 text-teal-700"
        />
        <StatCard
          title="সক্রিয় ব্যানার"
          value={stats.activeBanners}
          Icon={Megaphone}
          iconBg="bg-orange-100 text-orange-700"
        />
        <StatCard
          title="নোটিস"
          value="—"
          Icon={Bell}
          iconBg="bg-navy-100 text-navy-800"
        />
      </div>
    </div>
  );
}
