"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, X, Car, Users, ChevronDown, ChevronRight, Pencil, ChevronLeft, ChevronRight as ChevronRightIcon, ChevronsLeft, ChevronsRight, Copy, CheckCheck } from "lucide-react";

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1 rounded text-slate-400 hover:text-primary-600 transition-colors shrink-0"
    >
      {copied ? <CheckCheck size={13} className="text-green-500" /> : <Copy size={13} />}
    </button>
  );
}
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import AdminTable, { type Column } from "@/components/ui/AdminTable";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface VehicleReg {
  id: string;
  ownerName: string;
  ownerPhone: string;
  ownerNid?: string;
  ownerNidImageUrl?: string;
  ownerEmail?: string;
  ownerAddress?: string;
  vehicleType: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  registrationNo?: string;
  seatingCapacity?: number;
  acAvailable: boolean;
  driverIncluded: boolean;
  serviceAreas: string[];
  dailyRate?: number;
  perKmRate?: number;
  description?: string;
  imageUrl?: string;
  status: string;
  isActive: boolean;
  createdAt: string;
}

interface OwnerGroup {
  ownerName: string;
  ownerPhone: string;
  ownerEmail?: string | null;
  ownerAddress?: string | null;
  ownerNidImageUrl?: string | null;
  vehicles: VehicleReg[];
}

const STATUS_OPTS = ["all", "pending", "approved", "rejected"] as const;
type StatusFilter = (typeof STATUS_OPTS)[number];

const statusClass: Record<string, string> = {
  pending:  "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const VEHICLE_LABELS: Record<string, string> = {
  "ambulance":       "🚑 Ambulance",
  "private-car":     "🚗 Private Car",
  "noah-hiace":      "🚐 Noah & Hiace",
  "microbus":        "🚌 Microbus",
  "suv-jeep":        "🚙 SUV / Jeep",
  "pickup":          "🚚 Pickup",
  "truck":           "🚛 Truck",
  "covered-van":     "📦 Covered Van",
  "goods-transport": "📦 Goods Transport",
};

const PAGE_SIZE = 10;

function DetailModal({ reg, onClose, onStatusChange, onUpdate, updating, initialMode = "view" }: {
  reg: VehicleReg;
  onClose: () => void;
  onStatusChange: (id: string, status: "approved" | "rejected") => void;
  onUpdate: (updated: VehicleReg) => void;
  updating: boolean;
  initialMode?: "view" | "edit";
}) {
  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const [form, setForm] = useState({ ...reg });
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm({ ...reg }); }, [reg]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const set = (k: keyof VehicleReg, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const { id, createdAt, serviceAreas, imageUrl, ownerNidImageUrl, isActive, status, ...rest } = form;
      await api.patch(`/vehicle-registrations/${id}`, rest);
      onUpdate(form);
      toast.success("Updated successfully!");
      setMode("view");
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20";
  const labelCls = "text-[11px] text-slate-400 uppercase tracking-wide mb-0.5 block";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-br from-primary-600 to-primary-400 px-6 pt-5 pb-8 shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white">
            <X size={16} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-2xl">
              {VEHICLE_LABELS[form.vehicleType]?.split(" ")[0] ?? "🚗"}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{form.ownerName}</h3>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-white text-xl font-extrabold tracking-wide">{form.ownerPhone}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(form.ownerPhone)}
                  className="p-1.5 rounded-lg bg-white/25 hover:bg-white/40 text-white transition-colors"
                >
                  <Copy size={14} />
                </button>
              </div>
              <p className="text-white text-base font-bold mt-0.5">{VEHICLE_LABELS[form.vehicleType] ?? form.vehicleType}</p>
            </div>
          </div>
        </div>

        {/* Status + actions bar */}
        <div className="mx-6 -mt-4 mb-2 z-10 relative">
          <div className="bg-white rounded-xl shadow-md border border-slate-100 px-4 py-3 flex items-center justify-between">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusClass[form.status] ?? "bg-slate-100 text-slate-600"}`}>
              {form.status.toUpperCase()}
            </span>
            <div className="flex items-center gap-2">
              {form.status === "pending" && mode === "view" && (
                <>
                  <button disabled={updating} onClick={() => onStatusChange(form.id, "approved")}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                    <CheckCircle size={13} /> Approve
                  </button>
                  <button disabled={updating} onClick={() => onStatusChange(form.id, "rejected")}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                    <XCircle size={13} /> Reject
                  </button>
                </>
              )}
              <button
                onClick={() => setMode(mode === "edit" ? "view" : "edit")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  mode === "edit" ? "bg-slate-200 text-slate-700" : "bg-primary-50 text-primary-700 hover:bg-primary-100"
                }`}
              >
                <Pencil size={13} /> {mode === "edit" ? "Cancel" : "Edit"}
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-4 flex-1">
          {mode === "view" ? (
            <>
              {form.imageUrl && (
                <div className="mb-4 rounded-xl overflow-hidden border border-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.imageUrl} alt="Vehicle" className="w-full h-48 object-cover" />
                </div>
              )}
              {form.ownerNidImageUrl && (
                <div className="mb-4">
                  <p className={labelCls}>NID Card Image</p>
                  <div className="rounded-xl overflow-hidden border border-amber-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.ownerNidImageUrl} alt="Owner NID" className="w-full h-40 object-cover" />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Owner Email",      value: form.ownerEmail },
                  { label: "Owner Address",    value: form.ownerAddress },
                  { label: "Brand",            value: form.vehicleBrand },
                  { label: "Model",            value: form.vehicleModel },
                  { label: "Year",             value: form.vehicleYear },
                  { label: "Reg. No.",         value: form.registrationNo },
                  { label: "Seating Capacity", value: form.seatingCapacity },
                  { label: "AC Available",     value: form.acAvailable ? "Yes" : "No" },
                  { label: "Driver Included",  value: form.driverIncluded ? "Yes" : "No" },
                  { label: "Registered On",    value: formatDate(form.createdAt) },
                ].filter(f => f.value !== undefined && f.value !== null && f.value !== "").map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3">
                    <p className={labelCls}>{label}</p>
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-bold text-slate-800 text-base">{String(value)}</p>
                      <CopyBtn text={String(value)} />
                    </div>
                  </div>
                ))}
              </div>
              {form.description && (
                <div className="mt-3 bg-slate-50 rounded-xl p-4">
                  <p className={labelCls}>Description</p>
                  <p className="text-sm text-slate-700">{form.description}</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Owner Information</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Owner Name</label><input className={inputCls} value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} /></div>
                <div><label className={labelCls}>Phone</label><input className={inputCls} value={form.ownerPhone} onChange={(e) => set("ownerPhone", e.target.value)} /></div>
                <div><label className={labelCls}>Email</label><input className={inputCls} value={form.ownerEmail ?? ""} onChange={(e) => set("ownerEmail", e.target.value)} /></div>
                <div><label className={labelCls}>Address</label><input className={inputCls} value={form.ownerAddress ?? ""} onChange={(e) => set("ownerAddress", e.target.value)} /></div>
              </div>

              <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Vehicle Information</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Vehicle Type</label>
                  <select className={inputCls} value={form.vehicleType} onChange={(e) => set("vehicleType", e.target.value)}>
                    {Object.entries(VEHICLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Brand</label><input className={inputCls} value={form.vehicleBrand ?? ""} onChange={(e) => set("vehicleBrand", e.target.value)} /></div>
                <div><label className={labelCls}>Model</label><input className={inputCls} value={form.vehicleModel ?? ""} onChange={(e) => set("vehicleModel", e.target.value)} /></div>
                <div><label className={labelCls}>Year</label><input className={inputCls} value={form.vehicleYear ?? ""} onChange={(e) => set("vehicleYear", e.target.value)} /></div>
                <div><label className={labelCls}>Registration No.</label><input className={inputCls} value={form.registrationNo ?? ""} onChange={(e) => set("registrationNo", e.target.value)} /></div>
                <div><label className={labelCls}>Seating Capacity</label><input className={inputCls} type="number" min={1} value={form.seatingCapacity ?? ""} onChange={(e) => set("seatingCapacity", Number(e.target.value))} /></div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.acAvailable} onChange={(e) => set("acAvailable", e.target.checked)} className="w-4 h-4 rounded accent-primary-600" />
                  AC Available
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.driverIncluded} onChange={(e) => set("driverIncluded", e.target.checked)} className="w-4 h-4 rounded accent-primary-600" />
                  Driver Included
                </label>
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20" rows={3} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-100 shrink-0 flex justify-end gap-2 bg-slate-50">
          {mode === "edit" ? (
            <>
              <button onClick={() => { setForm({ ...reg }); setMode("view"); }} className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-4 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          ) : (
            <button onClick={onClose} className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-4 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">Close</button>
          )}
        </div>
      </div>
    </div>
  );
}

function OwnerCard({ group, onView, onStatusChange, updating }: {
  group: OwnerGroup;
  onView: (v: VehicleReg) => void;
  onStatusChange: (id: string, status: "approved" | "rejected") => void;
  updating: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const pending = group.vehicles.filter((v) => v.status === "pending").length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Owner header */}
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
            <Users size={18} className="text-primary-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">{group.ownerName}</p>
            <p className="text-xs text-slate-500">{group.ownerPhone}{group.ownerEmail ? ` · ${group.ownerEmail}` : ""}</p>
            {group.ownerAddress && <p className="text-xs text-slate-400">{group.ownerAddress}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-semibold bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full">
            {group.vehicles.length} vehicle{group.vehicles.length > 1 ? "s" : ""}
          </span>
          {pending > 0 && (
            <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
              {pending} pending
            </span>
          )}
          {expanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
        </div>
      </button>

      {/* NID image strip */}
      {expanded && group.ownerNidImageUrl && (
        <div className="px-5 pb-3">
          <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1.5">Owner NID Card</p>
          <div className="rounded-xl overflow-hidden border border-amber-200 w-48">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={group.ownerNidImageUrl} alt="NID" className="w-full h-28 object-cover" />
          </div>
        </div>
      )}

      {/* Vehicles list */}
      {expanded && (
        <div className="border-t border-slate-100 divide-y divide-slate-100">
          {group.vehicles.map((v) => (
            <div key={v.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
              <div className="flex items-center gap-3">
                {v.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.imageUrl} alt="" className="w-12 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                ) : (
                  <div className="w-12 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-lg shrink-0">
                    {VEHICLE_LABELS[v.vehicleType]?.split(" ")[0] ?? "🚗"}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-slate-800">{VEHICLE_LABELS[v.vehicleType] ?? v.vehicleType}</p>
                  <p className="text-xs text-slate-400">{[v.vehicleBrand, v.vehicleModel, v.vehicleYear].filter(Boolean).join(" · ")}</p>
                  {v.registrationNo && <p className="text-xs text-slate-400">Reg: {v.registrationNo}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusClass[v.status] ?? "bg-slate-100 text-slate-600"}`}>
                  {v.status}
                </span>
                {v.status === "pending" && (
                  <>
                    <button
                      disabled={updating}
                      onClick={() => onStatusChange(v.id, "approved")}
                      className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 disabled:opacity-50"
                      title="Approve"
                    >
                      <CheckCircle size={14} />
                    </button>
                    <button
                      disabled={updating}
                      onClick={() => onStatusChange(v.id, "rejected")}
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-50"
                      title="Reject"
                    >
                      <XCircle size={14} />
                    </button>
                  </>
                )}
                <button
                  onClick={() => onView(v)}
                  className="p-1.5 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-600"
                  title="View / Edit"
                >
                  <Eye size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function VehicleRegistrationsPage() {
  const [data, setData] = useState<VehicleReg[]>([]);
  const [ownerGroups, setOwnerGroups] = useState<OwnerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
  const [filterType, setFilterType] = useState("all");
  const [filterAc, setFilterAc] = useState("all");
  const [page, setPage] = useState(1);
  const [viewReg, setViewReg] = useState<VehicleReg | null>(null);
  const [viewMode, setViewMode] = useState<"view" | "edit">("view");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [tab, setTab] = useState<"vehicles" | "owners">("vehicles");

  useEffect(() => {
    Promise.all([
      api.get<{ data: VehicleReg[] }>("/vehicle-registrations"),
      api.get<{ data: OwnerGroup[] }>("/vehicle-registrations/by-owner"),
    ])
      .then(([vRes, oRes]) => { setData(vRes.data); setOwnerGroups(oRes.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = (id: string, status: string) => {
    setData((prev) => prev.map((r) => r.id === id ? { ...r, status, isActive: status === "approved" } : r));
    setOwnerGroups((prev) => prev.map((g) => ({
      ...g,
      vehicles: g.vehicles.map((v) => v.id === id ? { ...v, status, isActive: status === "approved" } : v),
    })));
    if (viewReg?.id === id) setViewReg((prev) => prev ? { ...prev, status } : prev);
  };

  const handleUpdate = (updated: VehicleReg) => {
    setData((prev) => prev.map((r) => r.id === updated.id ? updated : r));
    setOwnerGroups((prev) => prev.map((g) => ({
      ...g,
      vehicles: g.vehicles.map((v) => v.id === updated.id ? updated : v),
    })));
    setViewReg(updated);
  };

  const handleStatusChange = async (id: string, status: "approved" | "rejected") => {
    setUpdating(true);
    try {
      await api.patch(`/vehicle-registrations/${id}/status`, { status });
      updateStatus(id, status);
      toast.success(`Vehicle registration ${status}!`);
    } catch {
      toast.error("Status update failed");
    } finally {
      setUpdating(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await api.delete(`/vehicle-registrations/${deleteId}`).catch(() => {});
    setData((prev) => prev.filter((r) => r.id !== deleteId));
    setOwnerGroups((prev) => prev.map((g) => ({ ...g, vehicles: g.vehicles.filter((v) => v.id !== deleteId) })).filter((g) => g.vehicles.length > 0));
    if (viewReg?.id === deleteId) setViewReg(null);
    setDeleteId(null);
    toast.success("Deleted successfully");
  };

  const filteredVehicles = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((r) => {
      const matchStatus = filterStatus === "all" || r.status === filterStatus;
      const matchType   = filterType === "all" || r.vehicleType === filterType;
      const matchAc     = filterAc === "all" || (filterAc === "yes" ? r.acAvailable : !r.acAvailable);
      const matchSearch = !q || r.ownerName.toLowerCase().includes(q) || r.ownerPhone.includes(q) || r.vehicleType.includes(q);
      return matchStatus && matchType && matchAc && matchSearch;
    });
  }, [data, search, filterStatus, filterType, filterAc]);

  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedVehicles = filteredVehicles.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // reset page on filter change
  useMemo(() => setPage(1), [search, filterStatus, filterType, filterAc]);

  const filteredOwners = useMemo(() => {
    const q = search.toLowerCase();
    return ownerGroups
      .map((g) => ({
        ...g,
        vehicles: g.vehicles.filter((v) => filterStatus === "all" || v.status === filterStatus),
      }))
      .filter((g) => {
        if (g.vehicles.length === 0) return false;
        if (!q) return true;
        return g.ownerName.toLowerCase().includes(q) || g.ownerPhone.includes(q);
      });
  }, [ownerGroups, search, filterStatus]);

  const columns: Column<VehicleReg>[] = [
    {
      key: "ownerName", label: "Owner",
      render: (r) => (
        <div>
          <div className="font-medium text-slate-800">{r.ownerName}</div>
          <div className="text-xs text-slate-400">{r.ownerPhone}</div>
          {r.ownerAddress && <div className="text-xs text-slate-400">{r.ownerAddress}</div>}
        </div>
      ),
    },
    {
      key: "vehicleType", label: "Vehicle",
      render: (r) => (
        <div>
          <div className="text-slate-700">{VEHICLE_LABELS[r.vehicleType] ?? r.vehicleType}</div>
          {r.vehicleBrand && <div className="text-xs text-slate-400">{r.vehicleBrand} {r.vehicleModel}</div>}
        </div>
      ),
    },
    {
      key: "seatingCapacity", label: "Seats / AC",
      render: (r) => (
        <div>
          {r.seatingCapacity && <div className="text-sm text-slate-700">{r.seatingCapacity} seats</div>}
          <div className={`text-xs font-medium ${r.acAvailable ? "text-green-600" : "text-slate-400"}`}>
            {r.acAvailable ? "✓ AC" : "No AC"}
          </div>
        </div>
      ),
    },
    {
      key: "status", label: "Status",
      render: (r) => (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusClass[r.status] ?? "bg-slate-100 text-slate-600"}`}>
          {r.status}
        </span>
      ),
    },
    {
      key: "createdAt", label: "Submitted",
      render: (r) => <span className="text-slate-500 text-xs">{formatDate(r.createdAt)}</span>,
    },
    {
      key: "_view" as keyof VehicleReg, label: "",
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setViewMode("view"); setViewReg(r); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
          >
            <Eye size={13} /> View
          </button>
          <button
            onClick={() => { setViewMode("edit"); setViewReg(r); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Pencil size={13} /> Edit
          </button>
        </div>
      ),
    },
  ];

  const pending = data.filter((r) => r.status === "pending").length;

  return (
    <div>
      <ConfirmModal open={!!deleteId} onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} message="Delete this vehicle registration permanently?" />
      {viewReg && (
        <DetailModal reg={viewReg} onClose={() => { setViewReg(null); setViewMode("view"); }} onStatusChange={handleStatusChange} onUpdate={handleUpdate} updating={updating} initialMode={viewMode} />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Car size={20} className="text-primary-600" /> Vehicle Registrations
          </h2>
          <p className="text-sm text-slate-500">
            {data.length} vehicles · {ownerGroups.length} owners
            {pending > 0 && <span className="ml-2 text-amber-600 font-semibold">· {pending} pending review</span>}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab("vehicles")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "vehicles" ? "bg-white text-primary-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          <Car size={14} /> All Vehicles
        </button>
        <button
          onClick={() => setTab("owners")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "owners" ? "bg-white text-primary-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          <Users size={14} /> By Owner
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={tab === "owners" ? "Search by owner name or phone..." : "Search by owner, phone or vehicle type..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as StatusFilter)}
            className="pl-8 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white">
            {STATUS_OPTS.map((s) => (
              <option key={s} value={s}>{s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white">
          <option value="all">All Types</option>
          {Object.entries(VEHICLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filterAc} onChange={(e) => setFilterAc(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white">
          <option value="all">AC: All</option>
          <option value="yes">✓ AC</option>
          <option value="no">No AC</option>
        </select>
      </div>

      {filterStatus === "all" && pending > 0 && (
        <div className="mb-4 flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <Clock size={16} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">
            <strong>{pending}</strong> vehicle registration{pending > 1 ? "s" : ""} awaiting your review.
          </p>
        </div>
      )}

      {tab === "vehicles" && (
        <>
          <AdminTable
            columns={columns}
            data={paginatedVehicles}
            loading={loading}
            onDelete={(id) => setDeleteId(id)}
            emptyMessage="No vehicle registrations found."
          />
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <p className="text-sm text-slate-500">
                {filteredVehicles.length === 0 ? "No results" : `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filteredVehicles.length)} of ${filteredVehicles.length}`}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(1)} disabled={safePage === 1} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50"><ChevronsLeft size={15} /></button>
                <button onClick={() => setPage(safePage - 1)} disabled={safePage === 1} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50"><ChevronLeft size={15} /></button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1).map((p, i, arr) => (
                  <>
                    {i > 0 && arr[i - 1] !== p - 1 && <span key={`e${p}`} className="px-1 text-slate-400 text-sm">…</span>}
                    <button key={p} onClick={() => setPage(p)}
                      className={`min-w-[34px] h-[34px] rounded-lg border text-sm font-medium transition-colors ${
                        p === safePage ? "bg-primary-600 text-white border-primary-600" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}>{p}</button>
                  </>
                ))}
                <button onClick={() => setPage(safePage + 1)} disabled={safePage === totalPages} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50"><ChevronRightIcon size={15} /></button>
                <button onClick={() => setPage(totalPages)} disabled={safePage === totalPages} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50"><ChevronsRight size={15} /></button>
              </div>
            </div>
          )}
        </>
      )}

      {tab === "owners" && (
        <div className="flex flex-col gap-3">
          {loading && <p className="text-sm text-slate-400 py-8 text-center">Loading...</p>}
          {!loading && filteredOwners.length === 0 && (
            <p className="text-sm text-slate-400 py-8 text-center">No owners found.</p>
          )}
          {filteredOwners.map((g) => (
            <OwnerCard
              key={g.ownerPhone}
              group={g}
              onView={setViewReg}
              onStatusChange={handleStatusChange}
              updating={updating}
            />
          ))}
        </div>
      )}
    </div>
  );
}
