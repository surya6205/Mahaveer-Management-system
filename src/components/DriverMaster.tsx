import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Phone,
  CreditCard,
  Building2,
  Calendar,
  AlertCircle,
  Edit,
  Trash2,
  ShieldCheck,
  X,
  User,
  Truck
} from 'lucide-react';
import { Driver, Vehicle } from '../types';

interface DriverMasterProps {
  drivers: Driver[];
  vehicles?: Vehicle[];
  onSaveDriver: (driver: Driver) => void;
  onDeleteDriver: (id: string) => void;
  searchTerm?: string;
}

export const DriverMaster: React.FC<DriverMasterProps> = ({
  drivers = [],
  vehicles = [],
  onSaveDriver,
  onDeleteDriver,
  searchTerm = ''
}) => {
  const [localSearch, setLocalSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [aadhaarNo, setAadhaarNo] = useState('');
  const [licenceNo, setLicenceNo] = useState('');
  const [licenceExpiry, setLicenceExpiry] = useState('');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [assignedVehicleNo, setAssignedVehicleNo] = useState('');
  const [status, setStatus] = useState<Driver['status']>('Available');

  const effectiveSearch = (searchTerm || localSearch).toLowerCase();

  const filteredDrivers = drivers.filter(
    (d) =>
      d.name.toLowerCase().includes(effectiveSearch) ||
      d.mobile.includes(effectiveSearch) ||
      d.licenceNo.toLowerCase().includes(effectiveSearch) ||
      d.aadhaarNo.includes(effectiveSearch) ||
      (d.assignedVehicleNo && d.assignedVehicleNo.toLowerCase().includes(effectiveSearch))
  );

  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const handleOpenNewModal = () => {
    setEditingDriver(null);
    setName('');
    setMobile('');
    setAadhaarNo('');
    setLicenceNo('');
    setLicenceExpiry('');
    setBankAccountNo('');
    setBankIfsc('');
    setBankName('');
    setUpiId('');
    setAddress('');
    setEmergencyContact('');
    setPhotoUrl('');
    setAssignedVehicleNo('');
    setStatus('Available');
    setIsModalOpen(true);
  };

  const handleEditModal = (driver: Driver) => {
    setEditingDriver(driver);
    setName(driver.name);
    setMobile(driver.mobile);
    setAadhaarNo(driver.aadhaarNo);
    setLicenceNo(driver.licenceNo);
    setLicenceExpiry(driver.licenceExpiry);
    setBankAccountNo(driver.bankAccountNo);
    setBankIfsc(driver.bankIfsc);
    setBankName(driver.bankName);
    setUpiId(driver.upiId || '');
    setAddress(driver.address);
    setEmergencyContact(driver.emergencyContact);
    setPhotoUrl(driver.photoUrl || '');
    setAssignedVehicleNo(driver.assignedVehicleNo || '');
    setStatus(driver.status);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newDriver: Driver = {
      id: editingDriver ? editingDriver.id : `drv-${Date.now()}`,
      name: name.trim(),
      mobile: mobile.trim(),
      aadhaarNo: aadhaarNo.trim(),
      licenceNo: licenceNo.trim().toUpperCase(),
      licenceExpiry: licenceExpiry,
      bankAccountNo: bankAccountNo.trim(),
      bankIfsc: bankIfsc.trim().toUpperCase(),
      bankName: bankName.trim(),
      upiId: upiId.trim(),
      address: address.trim(),
      emergencyContact: emergencyContact.trim(),
      photoUrl: photoUrl.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      assignedVehicleNo: assignedVehicleNo,
      status
    };

    onSaveDriver(newDriver);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-orange-400" />
            <h1 className="text-xl font-bold text-white">Driver Master</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Maintain driver profile, licence validity alerts, Aadhaar, bank details, & assigned trucks
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Filter Driver Name, DL, Mobile..."
              className="w-full bg-slate-800 text-white placeholder-slate-400 text-xs rounded-lg pl-9 pr-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            onClick={handleOpenNewModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-md transition-all shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add New Driver</span>
          </button>
        </div>
      </div>

      {/* Driver Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDrivers.map((drv) => {
          const isExpiringSoon = drv.licenceExpiry && drv.licenceExpiry <= thirtyDaysLater;

          const statusBadge =
            drv.status === 'On Trip'
              ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
              : drv.status === 'Available'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-slate-800 text-slate-400 border-slate-700';

          return (
            <div
              key={drv.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between transition-all"
            >
              <div>
                {/* Driver Top Info */}
                <div className="flex items-start gap-3 border-b border-slate-800 pb-3">
                  <img
                    src={
                      drv.photoUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                    }
                    alt={drv.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold text-white truncate">{drv.name}</h2>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditModal(drv)}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteDriver(drv.id)}
                          className="p-1 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusBadge}`}>
                        {drv.status}
                      </span>
                      {drv.assignedVehicleNo && (
                        <span className="text-xs text-orange-400 font-mono flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          {drv.assignedVehicleNo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details list */}
                <div className="mt-3 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-white">{drv.mobile}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-400">DL:</span>
                    <span className="font-mono text-slate-200 font-bold">{drv.licenceNo}</span>
                  </div>

                  <div
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                      isExpiringSoon
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : 'bg-slate-800/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Licence Expiry:</span>
                    </span>
                    <span className="font-mono font-bold">
                      {drv.licenceExpiry || 'Not set'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-400">Aadhaar:</span>
                    <span className="font-mono text-slate-300">{drv.aadhaarNo || 'N/A'}</span>
                  </div>

                  <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-800 space-y-1">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">
                      Bank Account Details
                    </div>
                    <div className="font-mono text-slate-200">
                      {drv.bankName} • {drv.bankAccountNo}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      IFSC: <span className="font-mono text-slate-300">{drv.bankIfsc}</span>
                      {drv.upiId && ` | UPI: ${drv.upiId}`}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                <span className="block truncate">Emergency Contact: {drv.emergencyContact || 'N/A'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Driver Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-orange-400" />
                <h3 className="font-bold text-white text-base">
                  {editingDriver ? 'Edit Driver Record' : 'Add New Driver Master'}
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
                    Driver Full Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Singh"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="10-digit mobile"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Aadhaar Number
                  </label>
                  <input
                    type="text"
                    value={aadhaarNo}
                    onChange={(e) => setAadhaarNo(e.target.value)}
                    placeholder="12-digit Aadhaar"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Driving Licence Number
                  </label>
                  <input
                    type="text"
                    value={licenceNo}
                    onChange={(e) => setLicenceNo(e.target.value)}
                    placeholder="e.g. MH12 2020 0012345"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white uppercase font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Licence Expiry Date
                  </label>
                  <input
                    type="date"
                    value={licenceExpiry}
                    onChange={(e) => setLicenceExpiry(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Assigned Vehicle No
                  </label>
                  <select
                    value={assignedVehicleNo}
                    onChange={(e) => setAssignedVehicleNo(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="">-- Select Vehicle --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.vehicleNo}>
                        {v.vehicleNo} ({v.vehicleType})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    value={bankAccountNo}
                    onChange={(e) => setBankAccountNo(e.target.value)}
                    placeholder="Account Number"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Bank IFSC Code
                  </label>
                  <input
                    type="text"
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value)}
                    placeholder="IFSC Code"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white uppercase font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Bank Name & Branch
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. SBI Nigdi Branch"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    UPI ID / PhonePe
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="driver@upi"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Emergency Contact Person & Phone
                  </label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="e.g. 9876543210 (Wife - Sunita)"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Permanent Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Village, Post, District, State"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
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
                  Save Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
