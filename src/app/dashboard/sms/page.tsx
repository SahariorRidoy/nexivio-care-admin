"use client";

import { useCallback, useEffect, useState } from "react";
import { LayoutDashboard, PenSquare, Megaphone, FileText, History, Settings2, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { SmsCampaign, SmsTemplate } from "@/lib/sms";
import OverviewTab, { SmsStats } from "@/components/sms/OverviewTab";
import ComposeTab from "@/components/sms/ComposeTab";
import CampaignsTab from "@/components/sms/CampaignsTab";
import TemplatesTab from "@/components/sms/TemplatesTab";
import HistoryTab from "@/components/sms/HistoryTab";

type Tab = "overview" | "compose" | "campaigns" | "templates" | "history";

const TABS: { key: Tab; label: string; Icon: typeof LayoutDashboard }[] = [
  { key: "compose", label: "SMS পাঠান", Icon: PenSquare },
  { key: "overview", label: "ওভারভিউ", Icon: LayoutDashboard },
  { key: "campaigns", label: "ক্যাম্পেইন", Icon: Megaphone },
  { key: "templates", label: "টেমপ্লেট", Icon: FileText },
  { key: "history", label: "ইতিহাস ও রিপোর্ট", Icon: History },
];

interface SmsSettings { smsProvider: string | null; smsApiKey: string | null; smsSenderId: string | null; smsSignature: string | null }

export default function SmsPage() {
  const [tab, setTab] = useState<Tab>("compose");
  const [stats, setStats] = useState<SmsStats | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [settings, setSettings] = useState<SmsSettings | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [campaignFilter, setCampaignFilter] = useState<{ id: string; name: string } | null>(null);
  const [seed, setSeed] = useState<{ text: string; n: number } | null>(null);

  const configured = !!settings?.smsApiKey;

  const loadStats = useCallback(() => {
    api.get<{ data: SmsStats }>("/sms/stats").then((r) => setStats(r.data)).catch(() => {});
  }, []);
  const loadTemplates = useCallback(() => {
    api.get<{ data: SmsTemplate[] }>("/sms/templates").then((r) => setTemplates(r.data)).catch(() => {});
  }, []);
  const loadBalance = useCallback(() => {
    setBalanceLoading(true);
    api.get<{ data: { balance: string | null } }>("/sms/balance")
      .then((r) => setBalance(r.data.balance)).catch(() => setBalance(null)).finally(() => setBalanceLoading(false));
  }, []);

  useEffect(() => {
    api.get<{ data: SmsSettings }>("/settings/admin").then((r) => {
      setSettings(r.data);
      if (r.data.smsApiKey) loadBalance();
    }).catch(() => {});
    loadStats();
    loadTemplates();
  }, [loadStats, loadTemplates, loadBalance]);

  const onSent = (campaignId?: string) => {
    setRefreshKey((k) => k + 1);
    loadStats();
    if (configured) loadBalance();
    if (campaignId) setTab("campaigns");
  };

  const viewCampaignLogs = (c: SmsCampaign) => {
    setCampaignFilter({ id: c.id, name: c.name });
    setTab("history");
  };

  return (
    <div className="flex flex-col gap-5 max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">SMS সেন্টার</h2>
          <p className="text-sm text-slate-500">একক, বাল্ক ও কাস্টমার-সেগমেন্ট Masking SMS — টেমপ্লেট, ক্যাম্পেইন ও রিপোর্টসহ</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${configured ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            <ShieldCheck size={13} />
            {configured ? `সংযুক্ত · ${settings?.smsSenderId || "No mask"}` : "গেটওয়ে কনফিগার করা নেই"}
          </span>
          <a href="/dashboard/settings" className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
            <Settings2 size={13} /> গেটওয়ে সেটিংস
          </a>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1">
        {TABS.map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === key ? "bg-primary-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
            }`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Compose stays mounted so drafts survive tab switches */}
      <div className={tab === "compose" ? "" : "hidden"}>
        <ComposeTab
          templates={templates}
          senderId={settings?.smsSenderId ?? ""}
          signature={settings?.smsSignature ?? ""}
          configured={configured}
          onSent={onSent}
          seed={seed}
        />
      </div>
      {tab === "overview" && <OverviewTab stats={stats} balance={balance} balanceLoading={balanceLoading} onRefreshBalance={loadBalance} />}
      {tab === "campaigns" && <CampaignsTab refreshKey={refreshKey} onViewLogs={viewCampaignLogs} />}
      {tab === "templates" && (
        <TemplatesTab templates={templates} reload={loadTemplates}
          onUse={(t) => { setSeed({ text: t.body, n: Date.now() }); setTab("compose"); }} />
      )}
      {tab === "history" && <HistoryTab refreshKey={refreshKey} campaignFilter={campaignFilter} clearCampaign={() => setCampaignFilter(null)} />}
    </div>
  );
}
