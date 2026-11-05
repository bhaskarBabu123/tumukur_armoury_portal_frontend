import React, { useState, useEffect } from 'react';
import { armouryAPI } from '../utils/api';
import { toast } from 'react-toastify';

import {
  Plus,
  Search,
  Trash2,
  Eye,
  Shield,
  Package,
  Activity,
  X,
  Hash,
  Box,
  MapPin,
  AlertTriangle,
  FileText,
  Warehouse,
  Calendar,
  Layers,
} from 'lucide-react';

/* =========================================================
   HELPER FUNCTION
   Converts strings, numbers, arrays and objects into
   safe React display values.
========================================================= */

const formatDisplayValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'UNSPECIFIED';
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return 'UNSPECIFIED';

    return value.map(formatDisplayValue).join(', ');
  }

  if (typeof value === 'object') {
    // Handles objects such as:
    // { text, addedBy, _id, date }
    if ('text' in value) {
      return formatDisplayValue(value.text);
    }

    // Prevents React from attempting to render an object.
    try {
      return JSON.stringify(value);
    } catch {
      return 'UNSPECIFIED';
    }
  }

  return 'UNSPECIFIED';
};

/* =========================================================
   MAIN ARMS COMPONENT
========================================================= */

const Arms = () => {
  const [arms, setArms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedArm, setSelectedArm] = useState(null);

  const [formData, setFormData] = useState({
    registerNumber: '',
    buttNumber: '',
    barcode: '',
    type: '',
    companyName: '',
    storageRackNo: '',
    receivedByUnit: '',
    condition: 'good',
    remarks: '',
  });

  /* Fetch inventory when the component loads */
  useEffect(() => {
    fetchArms();
  }, []);

  /* =======================================================
     FETCH ARMS
  ======================================================= */

  const fetchArms = async () => {
    try {
      const response = await armouryAPI.getAll();

      const receivedArms = response?.data?.data;

      setArms(Array.isArray(receivedArms) ? receivedArms : []);
    } catch (error) {
      console.error('Failed to fetch arms:', error);
      toast.error('Inventory Sync Failed');
      setArms([]);
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     FORM INPUT CHANGE
  ======================================================= */

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =======================================================
     RESET FORM
  ======================================================= */

  const resetForm = () => {
    setFormData({
      registerNumber: '',
      buttNumber: '',
      barcode: '',
      type: '',
      companyName: '',
      storageRackNo: '',
      receivedByUnit: '',
      condition: 'good',
      remarks: '',
    });
  };

  /* =======================================================
     SUBMIT NEW ARM
  ======================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await armouryAPI.create(formData);

      toast.success('Weapon Registered');

      setShowAddModal(false);
      resetForm();

      await fetchArms();
    } catch (error) {
      console.error('Failed to register arm:', error);

      toast.error(
        error.response?.data?.message || 'Registry Rejected'
      );
    }
  };

  /* =======================================================
     DELETE ARM
  ======================================================= */

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Permanent removal of this Arms from registry?'
    );

    if (!confirmed) return;

    try {
      await armouryAPI.delete(id);

      toast.success('Arms Purged');

      await fetchArms();
    } catch (error) {
      console.error('Failed to delete arm:', error);
      toast.error('Access Denied');
    }
  };

  /* =======================================================
     STATUS COLOR
  ======================================================= */

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';

      case 'issued':
        return 'bg-blue-100 text-blue-800 border-blue-200';

      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';

      default:
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  /* =======================================================
     SEARCH FILTER
  ======================================================= */

  const filteredArms = arms.filter((arm) => {
    const search = searchTerm.toLowerCase();

    return (
      formatDisplayValue(arm.registerNumber)
        .toLowerCase()
        .includes(search) ||
      formatDisplayValue(arm.buttNumber)
        .toLowerCase()
        .includes(search) ||
      formatDisplayValue(arm.type)
        .toLowerCase()
        .includes(search)
    );
  });

  /* =======================================================
     OPEN DETAILS MODAL
  ======================================================= */

  const handleViewArm = (arm) => {
    setSelectedArm(arm);
    setShowViewModal(true);
  };

  /* =======================================================
     LOADING SCREEN
  ======================================================= */

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#F1F5F9] flex items-center justify-center font-black text-slate-400 text-[10px] tracking-[0.4em]">
        SYNCING ARMOURY DATABASE...
      </div>
    );
  }

  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] flex flex-col font-sans">

      {/* TOP HEADER */}

      <header className="w-full bg-[#F1F5F9] border-b border-gray-300 px-4 py-4 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

          <div className="flex items-center gap-4">
            <div className="bg-slate-900 p-2.5 shadow-lg">
              <Package className="h-6 w-6 text-red-500" />
            </div>

            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">
                Armoury Inventory
              </h1>

              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                Arms Count: {arms.length} Units Detected
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="w-full md:w-auto bg-slate-900 hover:bg-red-700 text-white px-8 py-3 flex items-center justify-center gap-3 transition-all border-l-4 border-red-500 shadow-sm"
          >
            <Plus size={18} />

            <span className="text-[10px] font-black uppercase tracking-widest">
              Register New Arms
            </span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}

      <main className="flex-1 w-full p-4 lg:p-8 space-y-6">

        {/* SEARCH BAR */}

        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />

          <input
            type="text"
            placeholder="FILTER BY REGISTER NO, BUTT NO, OR WEAPON TYPE..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-300 py-4 pl-12 pr-4 text-xs font-black uppercase tracking-[0.1em] placeholder:text-gray-300 focus:border-slate-900 outline-none shadow-sm"
          />
        </div>

        {/* INVENTORY TABLE */}

        <div className="bg-white border border-gray-300 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">

              <thead>
                <tr className="bg-[#F1F5F9] border-b border-gray-300 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="px-8 py-5">Weapon Identification</th>
                  <th className="px-8 py-5">Arms Type</th>
                  <th className="px-8 py-5">Storage Location</th>
                  <th className="px-8 py-5">Current Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">

                {filteredArms.length > 0 ? (
                  filteredArms.map((arm) => (
                    <tr
                      key={arm._id}
                      className="hover:bg-blue-50/40 transition-colors group italic"
                    >

                      {/* IDENTIFICATION */}

                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">

                          <div className="h-10 w-10 bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-red-500 transition-colors">
                            <Shield size={20} />
                          </div>

                          <div>
                            <p className="text-xs font-black text-slate-900 uppercase tracking-tight">
                              REG_{formatDisplayValue(arm.registerNumber)}
                            </p>

                            <p className="text-[10px] font-bold text-red-600 uppercase tracking-tighter">
                              BUTT NO: {formatDisplayValue(arm.buttNumber)}
                            </p>
                          </div>

                        </div>
                      </td>

                      {/* TYPE */}

                      <td className="px-8 py-4">
                        <p className="text-[11px] font-black text-slate-700 uppercase">
                          {formatDisplayValue(arm.type)}
                        </p>

                        <p className="text-[9px] font-mono text-slate-400">
                          {formatDisplayValue(arm.barcode)}
                        </p>
                      </td>

                      {/* STORAGE LOCATION */}

                      <td className="px-8 py-4">
                        <div className="flex items-center gap-2">
                          <Warehouse size={14} className="text-slate-400" />

                          <span className="text-[11px] font-bold text-slate-600 uppercase">
                            Rack {formatDisplayValue(arm.storageRackNo)}
                          </span>
                        </div>
                      </td>

                      {/* STATUS */}

                      <td className="px-8 py-4">
                        <span
                          className={`px-3 py-1 text-[9px] font-black uppercase border ${getStatusColor(
                            formatDisplayValue(arm.status)
                          )}`}
                        >
                          {formatDisplayValue(arm.status)}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td className="px-8 py-4 text-right">
                        <div className="flex justify-end gap-2">

                          <button
                            type="button"
                            onClick={() => handleViewArm(arm)}
                            title="View Details"
                            className="p-2.5 bg-white border border-gray-200 text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all shadow-sm"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(arm._id)}
                            title="Delete Arms"
                            className="p-2.5 bg-white border border-gray-200 text-slate-400 hover:text-red-600 hover:border-red-600 transition-all shadow-sm"
                          >
                            <Trash2 size={16} />
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-8 py-12 text-center text-xs font-bold uppercase tracking-widest text-slate-400"
                    >
                      {searchTerm
                        ? 'No matching arms found.'
                        : 'No arms registered.'}
                    </td>
                  </tr>
                )}

              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* =====================================================
          VIEW DETAILS MODAL
      ===================================================== */}

      {showViewModal && selectedArm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">

          <div className="bg-white w-full max-w-2xl shadow-2xl relative flex flex-col border border-slate-300">

            {/* MODAL HEADER */}

            <div className="bg-[#F1F5F9] p-6 flex justify-between items-center border-b-2 border-slate-900">

              <div className="flex items-center gap-4">
                <div className="bg-slate-900 p-2 text-white">
                  <Box size={20} />
                </div>

                <div>
                  <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">
                    Weapon Specifications
                  </h2>

                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
                    Serial Index: {formatDisplayValue(selectedArm.registerNumber)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                aria-label="Close details"
                className="text-slate-400 hover:text-slate-900"
              >
                <X size={24} />
              </button>

            </div>

            {/* MODAL BODY */}

            <div className="p-8 lg:p-12 overflow-y-auto max-h-[70vh]">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">

                <DataPoint
                  icon={<Hash size={14} />}
                  label="Register Number"
                  value={selectedArm.registerNumber}
                />

                <DataPoint
                  icon={<Layers size={14} />}
                  label="Butt Number"
                  value={selectedArm.buttNumber}
                />

                <DataPoint
                  icon={<Shield size={14} />}
                  label="Arms Type"
                  value={selectedArm.type}
                />

                <DataPoint
                  icon={<Warehouse size={14} />}
                  label="Storage Rack"
                  value={selectedArm.storageRackNo}
                />

                <DataPoint
                  icon={<MapPin size={14} />}
                  label="Holding Unit"
                  value={selectedArm.receivedByUnit}
                />

                <DataPoint
                  icon={<Calendar size={14} />}
                  label="Registry Date"
                  value={selectedArm.createdAt
                    ? new Date(selectedArm.createdAt).toLocaleDateString()
                    : 'UNSPECIFIED'}
                />

              </div>

              {/* TECHNICAL REMARKS */}

              <div className="mt-10 pt-10 border-t border-gray-100">
                <div className="bg-slate-50 p-5 border-l-4 border-slate-900">

                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <FileText size={12} />
                    Technical Remarks
                  </p>

                  {/* FIX: Never render selectedArm.remarks directly.
                      It may be an object rather than a string. */}

                  <p className="text-xs font-bold text-slate-700 leading-relaxed italic">
                    {selectedArm.remarks
                      ? formatDisplayValue(selectedArm.remarks)
                      : 'No administrative notes recorded for these arms.'}
                  </p>

                </div>
              </div>

            </div>

            {/* MODAL FOOTER */}

            <div className="p-6 bg-[#F8FAFC] border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="px-10 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest"
              >
                Acknowledge
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =====================================================
          ADD ARMS MODAL
      ===================================================== */}

      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">

          <div className="bg-white w-full max-w-4xl shadow-2xl relative flex flex-col border border-slate-300 max-h-[95vh]">

            {/* HEADER */}

            <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Package size={24} className="text-red-500" />

                <h2 className="text-lg font-black uppercase italic tracking-tighter">
                  Arms Registry Terminal
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-white/50 hover:text-white"
                aria-label="Close registration form"
              >
                <X size={24} />
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="flex flex-col overflow-hidden"
            >

              <div className="overflow-y-auto p-8 lg:p-12 space-y-10">

                {/* IDENTIFICATION */}

                <div>
                  <h4 className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <Hash size={14} />
                    01. Identification Codes
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    <FormInput
                      label="Register Number"
                      name="registerNumber"
                      value={formData.registerNumber}
                      onChange={handleInputChange}
                      required
                    />

                    <FormInput
                      label="Butt Number"
                      name="buttNumber"
                      value={formData.buttNumber}
                      onChange={handleInputChange}
                      required
                    />

                    <FormInput
                      label="Barcode Index"
                      name="barcode"
                      value={formData.barcode}
                      onChange={handleInputChange}
                    />

                  </div>
                </div>

                {/* SPECIFICATIONS */}

                <div>
                  <h4 className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <Shield size={14} />
                    02. Arms Specifications
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <FormSelect
                      label="Weapon Type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                      options={[
                        'AK-47 Rifle',
                        'INSAS Rifle',
                        'SLR Rifle',
                        '.303 Rifle',
                        'Carbine',
                        '9mm Pistol',
                        'Shotgun',
                        'Tear Gas Gun',
                      ]}
                    />

                    <FormInput
                      label="Manufacturer / Company"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                    />

                  </div>
                </div>

                {/* STORAGE AND ASSIGNMENT */}

                <div>
                  <h4 className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <Warehouse size={14} />
                    03. Storage & Assignment
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    <FormInput
                      label="Rack Number"
                      name="storageRackNo"
                      value={formData.storageRackNo}
                      onChange={handleInputChange}
                    />

                    <FormInput
                      label="Receiving Unit"
                      name="receivedByUnit"
                      value={formData.receivedByUnit}
                      onChange={handleInputChange}
                    />

                    <FormSelect
                      label="Arms Condition"
                      name="condition"
                      value={formData.condition}
                      onChange={handleInputChange}
                      options={[
                        'good',
                        'needs_repair',
                        'damaged',
                      ]}
                    />

                  </div>
                </div>

                {/* TECHNICAL REMARKS */}

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] flex items-center gap-2">
                    <FileText size={14} />
                    04. Technical Notes
                  </h4>

                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    placeholder="ENTER ANY TECHNICAL OR SERVICE REMARKS..."
                    className="w-full border border-gray-300 p-4 h-24 text-xs font-black uppercase outline-none focus:border-slate-900 transition-all"
                  />
                </div>

              </div>

              {/* FORM FOOTER */}

              <div className="p-6 bg-[#F8FAFC] border-t border-gray-200 flex justify-end items-center gap-6">

                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="text-[10px] font-black uppercase text-gray-400 hover:text-slate-900 transition-colors"
                >
                  Abort Registry
                </button>

                <button
                  type="submit"
                  className="bg-slate-900 text-white px-10 py-4 text-[10px] font-black uppercase tracking-widest border-l-4 border-red-600 shadow-xl hover:bg-red-700 transition-all"
                >
                  Save Registry
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}

      <footer className="bg-white border-t border-gray-300 px-8 py-4 flex justify-between items-center">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 italic">
          <Activity size={12} className="text-red-500" />
          Armoury_Level: Secure_Access // Log_V1.02
        </p>

        <AlertTriangle size={14} className="text-slate-300" />
      </footer>

    </div>
  );
};

/* =========================================================
   SHARED FORM INPUT COMPONENT
========================================================= */

const FormInput = ({ label, ...props }) => {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">
        {label}
      </label>

      <input
        {...props}
        className="w-full bg-white border border-gray-300 px-4 py-3 text-xs font-bold text-slate-800 focus:border-slate-900 outline-none shadow-sm transition-all"
      />
    </div>
  );
};

/* =========================================================
   SHARED FORM SELECT COMPONENT
========================================================= */

const FormSelect = ({ label, options, ...props }) => {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">
        {label}
      </label>

      <select
        {...props}
        className="w-full bg-white border border-gray-300 px-4 py-3 text-xs font-bold text-slate-800 focus:border-slate-900 outline-none shadow-sm appearance-none"
      >
        <option value="">
          SELECT_{label.toUpperCase()}...
        </option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
};

/* =========================================================
   DETAILS MODAL DATA POINT
========================================================= */

const DataPoint = ({ icon, label, value }) => {
  return (
    <div className="space-y-1">

      <div className="flex items-center gap-2 text-slate-400">
        {icon}

        <span className="text-[9px] font-black uppercase tracking-widest">
          {label}
        </span>
      </div>

      {/* Always convert the value to a safe display string */}
      <p className="text-sm font-black text-slate-800 uppercase italic ml-6 leading-relaxed break-words">
        {formatDisplayValue(value)}
      </p>

    </div>
  );
};

export default Arms;