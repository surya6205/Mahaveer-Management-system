import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, MapPin, X, Navigation } from 'lucide-react';
import { LocationRate } from '../types';

interface LocationRateMasterProps {
  locationRates?: LocationRate[];
  rates?: LocationRate[];
  onSaveRate: (rate: LocationRate) => void;
  onDeleteRate: (rateId: string) => void;
}

export const LocationRateMaster: React.FC<LocationRateMasterProps> = ({
  locationRates,
  rates,
  onSaveRate,
  onDeleteRate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<LocationRate | null>(null);

  // Form State: Strictly Destination & Rate
  const [toLocation, setToLocation] = useState('');
  const [ratePerKg, setRatePerKg] = useState<number | ''>(6.0);

  const effectiveRates = locationRates || rates || [];

  const filteredRates = effectiveRates.filter(
    (r) =>
      r &&
      ((r.toLocation && r.toLocation.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.fromLocation && r.fromLocation.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const handleOpenModal = (rate?: LocationRate) => {
    if (rate) {
      setEditingRate(rate);
      setToLocation(rate.toLocation);
      setRatePerKg(rate.ratePerKg);
    } else {
      setEditingRate(null);
      setToLocation('');
      setRatePerKg(6.0);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toLocation.trim()) return;

    const rateData: LocationRate = {
      id: editingRate ? editingRate.id : `rate-${Date.now()}`,
      fromLocation: editingRate?.fromLocation || 'Jaipur',
      toLocation: toLocation.trim(),
      ratePerKg: Number(ratePerKg) || 0,
      minWeight: 35,
      docketCharge: 100, // Fixed ₹100
      fscPercent: 8, // 8% FSC
      fovPercent: 1, // 1% FOV (min ₹100)
      odaCharge: 0,
      appointmentCharge: 0,
      remarks: 'Destination Rate'
    };

    onSaveRate(rateData);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-orange-400" />
            <h2 className="text-xl font-bold text-white tracking-wide">Destination-Wise Rate Master</h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Destination city & per-Kg freight rates (Docket Charge: ₹100 fixed, FOV: 1% min ₹100, FSC: 8% auto-applied in LR).
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          <span>Add Destination Rate</span>
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search destination city (e.g. Jhajjar, Pune)..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
          />
        </div>
        <span className="text-xs text-slate-400 font-medium">
          Total Destinations: <strong className="text-orange-400">{effectiveRates.length}</strong>
        </span>
      </div>

      {/* Destination Rates Clean Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-300 font-bold uppercase tracking-wider border-b border-slate-700">
              <tr>
                <th className="p-3.5 w-16 text-center">#</th>
                <th className="p-3.5">Destination City (To Location)</th>
                <th className="p-3.5 text-right">Freight Rate / Kg (₹)</th>
                <th className="p-3.5 text-right w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
              {filteredRates.length > 0 ? (
                filteredRates.map((rate, index) => (
                  <tr key={rate.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 text-center text-slate-500 font-mono font-bold">
                      {index + 1}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-amber-400 shrink-0" />
                        <span className="font-extrabold text-amber-300 text-sm uppercase tracking-wide">
                          {rate.toLocation}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 text-right font-mono font-extrabold text-emerald-400 text-sm">
                      ₹{Number(rate.ratePerKg).toFixed(2)} / Kg
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => handleOpenModal(rate)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                        title="Edit Destination Rate"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Are you sure you want to delete destination rate for ${rate.toLocation}?`
                            )
                          ) {
                            onDeleteRate(rate.id);
                          }
                        }}
                        className="p-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-lg border border-rose-800/60 transition-colors cursor-pointer"
                        title="Delete Destination Rate"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500 font-semibold italic">
                    No destination rates found. Click &quot;Add Destination Rate&quot; to add your destination cities and rates.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Rate Modal: Only Destination & Rate */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-400" />
                <span>{editingRate ? 'Edit Destination Rate' : 'Add Destination Rate'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1.5 text-xs">
                  Destination City (To City) *
                </label>
                <input
                  type="text"
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                  required
                  autoFocus
                  placeholder="e.g. JHAJJAR, PUNE, LUCKNOW, BANGALORE"
                  className="w-full bg-slate-800 border border-slate-700 text-amber-300 uppercase rounded-xl p-3 text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-orange-500 tracking-wide"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5 text-xs">
                  Rate / Kg (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    value={ratePerKg}
                    onChange={(e) =>
                      setRatePerKg(e.target.value === '' ? '' : parseFloat(e.target.value))
                    }
                    required
                    placeholder="e.g. 6.00"
                    className="w-full bg-slate-800 border border-slate-700 text-emerald-400 rounded-xl pl-8 pr-3 py-3 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 text-[11px] text-slate-400 space-y-1">
                <div className="text-slate-300 font-semibold">Standard Auto-Applied Surcharges:</div>
                <div className="flex justify-between">
                  <span>• Fixed Docket Charge:</span>
                  <span className="font-mono text-slate-200 font-bold">₹100</span>
                </div>
                <div className="flex justify-between">
                  <span>• FOV Charge:</span>
                  <span className="font-mono text-slate-200 font-bold">1% (Min ₹100)</span>
                </div>
                <div className="flex justify-between">
                  <span>• FSC Surcharge:</span>
                  <span className="font-mono text-slate-200 font-bold">8% of Basic Freight</span>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-extrabold rounded-xl shadow-lg cursor-pointer"
                >
                  Save Destination Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
