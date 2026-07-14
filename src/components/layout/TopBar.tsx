"use client";

import { Menu, Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface TopBarProps {
  onMenuClick: () => void;
  title: string;
}

export default function TopBar({ onMenuClick, title }: TopBarProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-slate-100 shadow-sm">
      <div className="flex items-center justify-between px-4 sm:px-6 h-14">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-1.5 rounded-md text-slate-600 hover:bg-slate-100"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          <h1 className="font-semibold text-slate-800 text-base">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative p-2 rounded-md text-slate-500 hover:bg-slate-100 transition-colors">
            <Bell size={18} />
          </button>
          {user && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-700 text-white text-sm font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
