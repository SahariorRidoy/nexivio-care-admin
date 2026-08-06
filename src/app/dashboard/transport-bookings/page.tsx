"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, Filter, Eye, X, MapPin, Calendar, Clock, Users } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import AdminTable, { type Column } from "@/components/ui/AdminTable";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface TransportBooking {
  id: string;
  passengerName: string;
  passengerPhone: string;
  passengerEmail?: string;
  pickupAddress: string;
  dropAddress: string;
  vehicleType: string;
  serviceCategory?: string;
  tripType: string;
  scheduledDate: string;
  scheduledTime: string;
  passengerCount: number;
  luggageCount: number;
  specialRequirements?: string;
  estimatedFare?: number;
  paymentMethod?: string;
  paymentStatus: string;
  status: string;
  notes?: string;
  createdAt: string;
  vehicleRegistration?: { ownerName: string; ownerPhone: string; vehicleBrand?: string; vehicleModel?: string };
}

const STATUSES = ["pending", "confirmed", "in-progress", "completed", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

const statusClass: Record<string, string> = {
  pending:      "bg-amber-100 text-amber-700",
  confirmed:    "bg-blue-100 text-blue-700",
  "in-progress":"bg-purple-100 text-purple-700",
  completed:    "bg-green-100 text-green-700",
  cancelled:    "bg-red-100 text-red-700",
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

const CATEGORY_LABELS: Record<string, string> = {
  "local-transport":      "🏙️ Local Transport",
  "intercity-transport":  "🛣️ Intercity Transport",
  "corporate-transport":  "🏢 Corporate Transport",
  "airport-transfer":     "✈️ Airport Transfer",
  "ambulance-service":    "🚑 Ambulance Service",
  "goods-transportation": "📦 Goods Transportation",
  "vehicle-rental":       "🚖 Vehicle Rental",
};

function DetailModal({ booking, onClose, onStatusChange, updating }: {
  booking: TransportBooking;
  onClose: () => void;
  onStatusChange: (id: string, status: Status) => void;
  updating: string | null;
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
        <div className="bg-gradient-to-br from-primary-600 to-primary-400 px-6 pt-5 pb-10 shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white">
            <X size={16} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-2xl">
              {VEHICLE_LABELS[booking.vehicleType]?.split(" ")[0] ?? "🚗"}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{booking.passengerName}</h3>
              <p className="text-primary-100 text-sm">{booking.passengerPhone}</p>
              <p className="text-primary-200 text-xs mt-0.5">{VEHICLE_LABELS[booking.vehicleType] ?? booking.vehicleType}</p>
            </div>
          </div>
        </div>

        <div className="mx-6 -mt-5 mb-2 z-10 relative">
          <div className="bg-white rounded-xl shadow-md border border-slate-100 px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{booking.id.slice(0, 12)}…</span>
            <select
              value={booking.status}
              disabled={updating === booking.id}
              onChange={(e) => onStatusChange(booking.id, e.target.value as Status)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-primary-300 ${statusClass[booking.status] ?? "bg-slate-100 text-slate-600"}`}
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-4 flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: "Pickup",          value: booking.pickupAddress, icon: <MapPin size={13} /> },
              { label: "Drop",            value: booking.dropAddress,   icon: <MapPin size={13} /> },
              { label: "Date",            value: formatDate(booking.scheduledDate), icon: <Calendar size={13} /> },
              { label: "Time",            value: booking.scheduledTime, icon: <Clock size={13} /> },
              { label: "Trip Type",       value: booking.tripType },
              { label: "Service Category", value: booking.serviceCategory ? (CATEGORY_LABELS[booking.serviceCategory] ?? booking.serviceCategory) : undefined },
              { label: "Passengers",      value: booking.passengerCount, icon: <Users size={13} /> },
              { label: "Luggage",         value: booking.luggageCount },
              { label: "Payment Method",  value: booking.paymentMethod },
              { label: "Payment Status",  value: booking.paymentStatus },
              { label: "Estimated Fare",  value: booking.estimatedFare ? `৳${booking.estimatedFare}` : undefined },
            ].filter(f => f.value !== undefined && f.value !== null && f.value !== "").map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3">
                <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
                <p className="font-semibold text-slate-800 text-sm">{String(value)}</p>
              </div>
            ))}
          </div>
          {booking.specialRequirements && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1">Special Requirements</p>
              <p className="text-sm text-slate-700">{booking.specialRequirements}</p>
            </div>
          )}
          {booking.vehicleRegistration && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-2">Assigned Vehicle Owner</p>
              <p className="text-sm font-semibold text-slate-800">{booking.vehicleRegistration.ownerName}</p>
              <p className="text-xs text-slate-500">{booking.vehicleRegistration.ownerPhone}</p>
              {booking.vehicleRegistration.vehicleBrand && (
                <p className="text-xs text-slate-500">{booking.vehicleRegistration.vehicleBrand} {booking.vehicleRegistration.vehicleModel}</p>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-100 shrink-0 flex items-center justify-between bg-slate-50">
          <p className="text-xs text-slate-400">Submitted: <span className="font-medium text-slate-500">{formatDate(booking.createdAt)}</span></p>
          <button onClick={onClose} className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-4 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TransportBookingsPage() {
  const [data, setData] = useState<TransportBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [viewBooking, setViewBooking] = useState<TransportBooking | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ data: TransportBooking[] }>("/transport-bookings")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((b) => {
      const matchStatus = filterStatus === "all" || b.status === filterStatus;
      const matchSearch = !q || b.passengerName.toLowerCase().includes(q) || b.passengerPhone.includes(q) || b.vehicleType.includes(q);
      return matchStatus && matchSearch;
    });
  }, [data, search, filterStatus]);

  const handleStatusChange = async (id: string, status: Status) => {
    setUpdatingId(id);
    try {
      await api.patch(`/transport-bookings/${id}`, { status });
      setData((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
      if (viewBooking?.id === id) setViewBooking((prev) => prev ? { ...prev, status } : prev);
      toast.success(`Status updated to "${status}"`);
    } catch {
      toast.error("Status update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await api.delete(`/transport-bookings/${deleteId}`).catch(() => {});
    setData((prev) => prev.filter((b) => b.id !== deleteId));
    if (viewBooking?.id === deleteId) setViewBooking(null);
    setDeleteId(null);
    toast.success("Deleted successfully");
  };

  const columns: Column<TransportBooking>[] = [
    {
      key: "passengerName", label: "Passenger",
      render: (r) => (
        <div>
          <div className="font-medium text-slate-800">{r.passengerName}</div>
          <div className="text-xs text-slate-400">{r.passengerPhone}</div>
        </div>
      ),
    },
    {
      key: "vehicleType", label: "Vehicle / Service",
      render: (r) => (
        <div>
          <div className="text-slate-700 text-sm">{VEHICLE_LABELS[r.vehicleType] ?? r.vehicleType}</div>
          {r.serviceCategory && (
            <div className="text-xs text-primary-600 mt-0.5">{CATEGORY_LABELS[r.serviceCategory] ?? r.serviceCategory}</div>
          )}
        </div>
      ),
    },
    {
      key: "pickupAddress", label: "Route",
      render: (r) => (
        <div className="text-xs text-slate-600 max-w-[160px]">
          <div className="truncate">📍 {r.pickupAddress}</div>
          <div className="truncate text-slate-400">→ {r.dropAddress}</div>
        </div>
      ),
    },
    {
      key: "scheduledDate", label: "Schedule",
      render: (r) => (
        <span className="text-slate-600 text-sm">
          {formatDate(r.scheduledDate)}
          <span className="text-slate-400 text-xs"> · {r.scheduledTime}</span>
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
      key: "_view" as keyof TransportBooking, label: "",
      render: (r) => (
        <button
          onClick={() => setViewBooking(r)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
        >
          <Eye size={13} /> View
        </button>
      ),
    },
  ];

  return (
    <div>
      <ConfirmModal open={!!deleteId} onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} message="Delete this transport booking permanently?" />
      {viewBooking && (
        <DetailModal booking={viewBooking} onClose={() => setViewBooking(null)} onStatusChange={handleStatusChange} updating={updatingId} />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Transport Bookings</h2>
          <p className="text-sm text-slate-500">{filtered.length} bookings (total {data.length})</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone or vehicle type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as Status | "all")}
            className="pl-8 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
          >
            <option value="all">All Status</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={filtered}
        loading={loading}
        onDelete={(id) => setDeleteId(id)}
        emptyMessage="No transport bookings found."
      />
    </div>
  );
}
