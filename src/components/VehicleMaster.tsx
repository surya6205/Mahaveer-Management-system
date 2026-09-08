import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  Calendar,
  ShieldAlert,
  Phone,
  Edit,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Vehicle } from '../types';

interface VehicleMasterProps {
  vehicles: Vehicle[];
  onSaveVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  searchTerm?: string;
}

export const VehicleMaster: React.FC<VehicleMasterProps> = ({
  vehicles = [],
  onSaveVehicle,
  onDeleteVehicle,
  searchTerm = ''
}) => {
  const [localSearch, setLocalSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form State
  const [vehicleNo, setVehicleNo] = useState('');
  const [vehicleType, setVehicleType] = useState<Vehicle['vehicleType']>('Container');
  const [capacityTons, setCapacityTons] = useState(18);
  const [ownerType, setOwnerType] = useState<Vehicle['ownerType']>('Owned');
  const [ownerName, setOwnerName] = useState('');
  const [ownerMobile, setOwnerMobile] = useState('');
  const [pucExpiry, setPucExpiry] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [fitnessExpiry, setFitnessExpiry] = useState('');
  const [status, setStatus] = useState<Vehicle['status']>('Available');

  const effectiveSearch = (searchTerm || localSearch).toLowerCase();

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.vehicleNo.toLowerCase().includes(effectiveSearch) ||
      v.vehicleType.toLowerCase().includes(effectiveSearch) ||
      v.ownerName.toLowerCase().includes(effectiveSearch) ||
      v.ownerMobile.includes(effectiveSearch)
  );

  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const handleOpenNewModal = () => {
    setEditingVehicle(null);
    setVehicleNo('');
    setVehicleType('Container');
    setCapacityTons(18);
    setOwnerType('Owned');
    setOwnerName('Mahavir Transport Services');
    setOwnerMobile('9876543210');
    setPucExpiry('');
    setInsuranceExpiry('');
    setFitnessExpiry('');
    setStatus('Available');
    setIsModalOpen(true);
  };

  const handleEditModal = (v: Vehicle) => {
    setEditingVehicle(v);
    setVehicleNo(v.vehicleNo);
    setVehicleType(v.vehicleType);
    setCapacityTons(v.capacityTons);
    setOwnerType(v.ownerType);
    setOwnerName(v.ownerName);
    setOwnerMobile(v.ownerMobile);
    setPucExpiry(v.pucExpiry);
    setInsuranceExpiry(v.insuranceExpiry);
    setFitnessExpiry(v.fitnessExpiry);
    setStatus(v.status);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNo.trim()) return;

    const newVehicle: Vehicle = {
      id: editingVehicle ? editingVehicle.id : `veh-${Date.now()}`,
      vehicleNo: vehicleNo.trim().toUpperCase(),
      vehicleType,
      capacityTons: Number(capacityTons) || 0,
      ownerType,
      ownerName: ownerName.trim(),
      ownerMobile: ownerMobile.trim(),
      pucExpiry,
      insuranceExpiry,
      fitnessExpiry,
      status
    };

    onSaveVehicle(newVehicle);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-orange-400" />
            <h1 className="text-xl font-bold text-white">Vehicle Fleet Master</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track trucks, capacity, insurance/fitness validity, & market vehicle attachments
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Filter Vehicle No, Type, Owner..."
              className="w-full bg-slate-800 text-white placeholder-slate-400 text-xs rounded-lg pl-9 pr-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            onClick={handleOpenNewModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-md shrink-0 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add New Vehicle</span>
          </button>
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVehicles.map((v) => {
          const isInsExpired = v.insuranceExpiry && v.insuranceExpiry <= thirtyDaysLater;
          const isFitExpired = v.fitnessExpiry && v.fitnessExpiry <= thirtyDaysLater;

          const statusBadge =
            v.status === 'In Transit'
              ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
              : v.status === 'Available'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border-rose-500/30';

          return (
            <div
              key={v.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      {v.ownerType} Vehicle
                    </span>
                    <h2 className="text-lg font-black text-amber-400 font-mono tracking-wide">
                      {v.vehicleNo}
                    </h2>
                    <p className="text-xs text-slate-300 font-medium">
                      {v.vehicleType} • {v.capacityTons} Tons Capacity
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditModal(v)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteVehicle(v.id)}
                      className="p-1 text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${statusBadge}`}>
                      {v.status}
                    </span>
                  </div>

                  <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-800 space-y-1.5 text-slate-300">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Insurance Expiry:</span>
                      <span
                        className={`font-mono font-bold ${
                          isInsExpired ? 'text-rose-400' : 'text-slate-200'
                        }`}
                      >
                        {v.insuranceExpiry || 'Not Set'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Fitness Expiry:</span>
                      <span
                        className={`font-mono font-bold ${
                          isFitExpired ? 'text-rose-400' : 'text-slate-200'
                        }`}
                      >
                        {v.fitnessExpiry || 'Not Set'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">PUC Expiry:</span>
                      <span className="font-mono text-slate-200">{v.pucExpiry || 'Not Set'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase">Owner Name</span>
                  <span className="font-medium text-slate-200">{v.ownerName}</span>
                </div>
                {v.ownerMobile && (
                  <a
                    href={`tel:${v.ownerMobile}`}
                    className="flex items-center gap-1 text-orange-400 font-semibold text-xs hover:underline"
                  >
                    <Phone className="h-3 w-3" />
                    <span>{v.ownerMobile}</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-orange-400" />
                <h3 className="font-bold text-white text-base">
                  {editingVehicle ? 'Edit Vehicle Master' : 'Add New Vehicle'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Vehicle Number (RTO) *
                  </label>
                  <input
                    type="text"
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value)}
                    placeholder="e.g. MH 12 AB 1234"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-amber-400 font-mono font-bold uppercase focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Vehicle Body Type
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="Container">Container</option>
                    <option value="Open Body">Open Body</option>
                    <option value="Trailer">Trailer</option>
                    <option value="Tanker">Tanker</option>
                    <option value="Tipper">Tipper</option>
                    <option value="Bolero Pickup">Bolero Pickup / LCV</option>
                    <option value="Other">Other Heavy Vehicle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Capacity (Tons)
                  </label>
                  <input
                    type="number"
                    value={capacityTons}
                    onChange={(e) => setCapacityTons(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ownership Type
                  </label>
                  <select
                    value={ownerType}
                    onChange={(e) => setOwnerType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="Owned">Company Owned</option>
                    <option value="Market Truck">Market / Attached Truck</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Insurance Expiry Date
                  </label>
                  <input
                    type="date"
                    value={insuranceExpiry}
                    onChange={(e) => setInsuranceExpiry(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Fitness Certificate Expiry
                  </label>
                  <input
                    type="date"
                    value={fitnessExpiry}
                    onChange={(e) => setFitnessExpiry(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    PUC Certificate Expiry
                  </label>
                  <input
                    type="date"
                    value={pucExpiry}
                    onChange={(e) => setPucExpiry(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Vehicle Current Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="Available">Available for Load</option>
                    <option value="In Transit">In Transit (Loaded)</option>
                    <option value="Under Maintenance">Under Repair / Maintenance</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Owner Name & Phone
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Owner / Transport Name"
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                    />
                    <input
                      type="text"
                      value={ownerMobile}
                      onChange={(e) => setOwnerMobile(e.target.value)}
                      placeholder="Owner Mobile"
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-md"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
