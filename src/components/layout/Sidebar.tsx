"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Calendar,
  Users,
  Bell,
  Star,
  ImageIcon,
  Megaphone,
  BookOpen,
  MessageSquare,
  LogOut,
  X,
  Settings,
  UserCircle,
  Plus,
  GraduationCap,
  Smartphone,
  Car,
  Truck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
    ],
  },
  {
    label: "Care Services",
    items: [
      { href: "/dashboard/services", label: "Main Services", Icon: Briefcase },
      { href: "/dashboard/other-services", label: "Additional Services", Icon: Plus },
      { href: "/dashboard/bookings", label: "Service Bookings", Icon: Calendar },
    ],
  },
  {
    label: "Transport",
    items: [
      { href: "/dashboard/vehicle-registrations", label: "Vehicle Registrations", Icon: Car },
      { href: "/dashboard/transport-bookings", label: "Transport Bookings", Icon: Truck },
    ],
  },
  {
    label: "Training",
    items: [
      { href: "/dashboard/training", label: "Training Programs", Icon: BookOpen },
      { href: "/dashboard/enrollments", label: "Enrollments", Icon: GraduationCap },
    ],
  },
  {
    label: "HR & Team",
    items: [
      { href: "/dashboard/applications", label: "Job Applications", Icon: Users },
      { href: "/dashboard/staff", label: "Service Staffs", Icon: Users },
      { href: "/dashboard/team", label: "Management Team", Icon: UserCircle },
    ],
  },
  {
    label: "Engage",
    items: [
      { href: "/dashboard/notices", label: "Notices", Icon: Bell },
      { href: "/dashboard/sms", label: "Send SMS", Icon: Smartphone },
      { href: "/dashboard/contacts", label: "Contacts", Icon: MessageSquare },
      { href: "/dashboard/reviews", label: "Reviews", Icon: Star },
    ],
  },
  {
    label: "Media",
    items: [
      { href: "/dashboard/gallery", label: "Gallery", Icon: ImageIcon },
      { href: "/dashboard/banners", label: "Banners", Icon: Megaphone },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/dashboard/settings", label: "Site Settings", Icon: Settings },
    ],
  },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ open = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-30 h-full w-64 bg-navy-950 flex flex-col transition-transform duration-300",
          "lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-700">
              <svg viewBox="0 0 40 40" width="20" height="20" fill="none">
                <path
                  d="M20 4 C12 4 6 10 6 17 C6 28 20 36 20 36 C20 36 34 28 34 17 C34 10 28 4 20 4Z"
                  fill="white"
                  opacity="0.9"
                />
                <path
                  d="M17 18 L17 13 L23 13 L23 18 L28 18 L28 24 L23 24 L23 29 L17 29 L17 24 L12 24 L12 18 Z"
                  fill="#2e7d32"
                />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">
                Nexivio Care
              </p>
              <p className="text-white/50 text-xs">Admin Panel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-white/50 hover:text-white"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {navGroups.map(({ label, items }, i) => (
            <div key={label}>
              <p className={cn(
                "px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30",
                i !== 0 && "border-t border-white/10 pt-3"
              )}>
                {label}
              </p>
              {items.map(({ href, label: itemLabel, Icon }) => {
                const isActive =
                  href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-colors",
                      isActive
                        ? "bg-primary-700 text-white"
                        : "text-white/70 hover:bg-navy-800 hover:text-white",
                    )}
                  >
                    <Icon size={18} />
                    {itemLabel}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-navy-800">
          {user && (
            <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-700 text-white text-sm font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {user.name}
                </p>
                <p className="text-white/40 text-xs truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors"
          >
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
}
