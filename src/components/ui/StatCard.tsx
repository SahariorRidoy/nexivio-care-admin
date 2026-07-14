import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  Icon: LucideIcon;
  iconBg?: string;
  change?: string;
}

export default function StatCard({ title, value, Icon, iconBg = "bg-primary-100 text-primary-700", change }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
      <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", iconBg)}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        {change && <p className="text-xs text-primary-600 mt-0.5">{change}</p>}
      </div>
    </div>
  );
}
