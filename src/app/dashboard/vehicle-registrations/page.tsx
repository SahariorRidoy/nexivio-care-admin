"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, X, Car } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import AdminTable, { type Column } from "@/components/ui/AdminTable";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface VehicleReg {
  id: string;
  ownerName: string;
  ownerPhone: string;
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
  "rent-a-car":      "🚖 Rent-a-Car",
  "pickup":          "🚚 Pickup",
  "truck":           "🚛 Truck",
  "covered-van":     "📦 Covered Van",
  "goods-transport": "📦 Goods Transport",
  "intercity":       "🛣️ Intercity",
};

function DetailModal({ reg, onClose, onStatusChange, updating }: {
  reg: VehicleReg;
  onClose: () => void;
  onStatusChange: (id: string, status: "approved" | "rejected") => void;
  updating: boolean;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-br from-primary-600 to-primary-400 px-6 pt-5 pb-8 shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white">
            <X size={16} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-2xl">
              {VEHICLE_LABELS[reg.vehicleType]?.split(" ")[0] ?? "🚗"}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{reg.ownerName}</h3>
              <p className="text-primary-100 text-sm">{reg.ownerPhone}</p>
              <p className="text-primary-200 text-xs mt-0.5">{VEHICLE_LABELS[reg.vehicleType] ?? reg.vehicleType}</p>
            </div>
          </div>
        </div>

        <div className="mx-6 -mt-4 mb-2 z-10 relative">
          <div className="bg-white rounded-xl shadow-md border border-slate-100 px-4 py-3 flex items-center justify-between">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusClass[reg.status] ?? "bg-slate-100 text-slate-600"}`}>
              {reg.status.toUpperCase()}
            </span>
            {reg.status === "pending" && (
              <div className="flex gap-2">
                <button
                  disabled={updating}
                  onClick={() => onStatusChange(reg.id, "approved")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle size={13} /> Approve
                </button>
                <button
                  disabled={updating}
                  onClick={() => onStatusChange(reg.id, "rejected")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  <XCircle size={13} /> Reject
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-4 flex-1">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: "Owner Email",      value: reg.ownerEmail },
              { label: "Owner Address",    value: reg.ownerAddress },
              { label: "Brand",            value: reg.vehicleBrand },
              { label: "Model",            value: reg.vehicleModel },
              { label: "Year",             value: reg.vehicleYear },
              { label: "Reg. No.",         value: reg.registrationNo },
              { label: "Seating Capacity", value: reg.seatingCapacity },
              { label: "AC Available",     value: reg.acAvailable ? "Yes" : "No" },
              { label: "Driver Included",  value: reg.driverIncluded ? "Yes" : "No" },
              { label: "Daily Rate",       value: reg.dailyRate ? `৳${reg.dailyRate}` : undefined },
              { label: "Per KM Rate",      value: reg.perKmRate ? `৳${reg.perKmRate}` : undefined },
              { label: "Registered On",    value: formatDate(reg.createdAt) },
            ].filter(f => f.value !== undefined && f.value !== null && f.value !== "").map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3">
                <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
                <p className="font-semibold text-slate-800">{String(value)}</p>
              </div>
            ))}
          </div>
          {reg.description && (
            <div className="mt-3 bg-slate-50 rounded-xl p-4">
              <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-slate-700">{reg.description}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-100 shrink-0 flex justify-end bg-slate-50">
          <button onClick={onClose} className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-4 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VehicleRegistrationsPage() {
  const [data, setData] = useState<VehicleReg[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
  const [viewReg, setViewReg] = useState<VehicleReg | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    api.get<{ data: VehicleReg[] }>("/vehicle-registrations")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((r) => {
      const matchStatus = filterStatus === "all" || r.status === filterStatus;
      const matchSearch = !q || r.ownerName.toLowerCase().includes(q) || r.ownerPhone.includes(q) || r.vehicleType.includes(q);
      return matchStatus && matchSearch;
    });
  }, [data, search, filterStatus]);

  const handleStatusChange = async (id: string, status: "approved" | "rejected") => {
    setUpdating(true);
    try {
      await api.patch(`/vehicle-registrations/${id}/status`, { status });
      setData((prev) => prev.map((r) => r.id === id ? { ...r, status, isActive: status === "approved" } : r));
      if (viewReg?.id === id) setViewReg((prev) => prev ? { ...prev, status } : prev);
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
    if (viewReg?.id === deleteId) setViewReg(null);
    setDeleteId(null);
    toast.success("Deleted successfully");
  };

  const columns: Column<VehicleReg>[] = [
    {
      key: "ownerName", label: "Owner",
      render: (r) => (
        <div>
          <div className="font-medium text-slate-800">{r.ownerName}</div>
          <div className="text-xs text-slate-400">{r.ownerPhone}</div>
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
      key: "dailyRate", label: "Rate",
      render: (r) => (
        <span className="text-slate-600 text-sm">
          {r.dailyRate ? `৳${r.dailyRate}/day` : r.perKmRate ? `৳${r.perKmRate}/km` : "—"}
        </span>
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
        <button
          onClick={() => setViewReg(r)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
        >
          <Eye size={13} /> View
        </button>
      ),
    },
  ];

  const pending = data.filter((r) => r.status === "pending").length;

  return (
    <div>
      <ConfirmModal open={!!deleteId} onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} message="Delete this vehicle registration permanently?" />
      {viewReg && (
        <DetailModal reg={viewReg} onClose={() => setViewReg(null)} onStatusChange={handleStatusChange} updating={updating} />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Car size={20} className="text-primary-600" /> Vehicle Registrations
          </h2>
          <p className="text-sm text-slate-500">
            {filtered.length} registrations
            {pending > 0 && <span className="ml-2 text-amber-600 font-semibold">· {pending} pending review</span>}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by owner name, phone or vehicle type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as StatusFilter)}
            className="pl-8 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
          >
            {STATUS_OPTS.map((s) => (
              <option key={s} value={s}>{s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Pending highlight cards */}
      {filterStatus === "all" && pending > 0 && (
        <div className="mb-4 flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <Clock size={16} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">
            <strong>{pending}</strong> vehicle registration{pending > 1 ? "s" : ""} awaiting your review.
          </p>
        </div>
      )}

      <AdminTable
        columns={columns}
        data={filtered}
        loading={loading}
        onDelete={(id) => setDeleteId(id)}
        emptyMessage="No vehicle registrations found."
      />
    </div>
  );
}
