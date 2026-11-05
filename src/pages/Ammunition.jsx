import React, { useState, useEffect } from 'react';
import { ammunitionAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { 
  Plus, Search, Trash2, Eye, Package, Shield, 
  Activity, Hash, SlidersHorizontal, FileText,
  Calendar, Archive, AlertCircle, Info,
  TrendingDown, Box, X, ClipboardCheck, Edit3, History,
  Layers, Crosshair
} from 'lucide-react';

const Ammunition = () => {
  const [ammunition, setAmmunition] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAmmo, setSelectedAmmo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'Live',
    caliber: '',
    batchNumber: '',
    totalCount: '',
    availableCount: '',
    receivedByUnit: '',
    receivedDate: '',
    about: '',
    remarks: ''
  });

  useEffect(() => { fetchInventory() }, []);

  const fetchInventory = async () => {
    try {
      const response = await ammunitionAPI.getAll();
      setAmmunition(response.data.data);
    } catch (error) {
      toast.error('Inventory Sync Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await ammunitionAPI.update(selectedAmmo._id, formData);
        toast.success('Asset Record Modified');
      } else {
        await ammunitionAPI.create(formData);
        toast.success('Inventory Entry Committed');
      }
      setShowFormModal(false);
      resetForm();
      fetchInventory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registry Error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'Live',
      caliber: '',
      batchNumber: '',
      totalCount: '',
      availableCount: '',
      receivedByUnit: '',
      receivedDate: '',
      about: '',
      remarks: ''
    });
    setIsEditing(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('PERMANENT DELETION: Are you sure you want to purge this record?')) {
      try {
        await ammunitionAPI.delete(id);
        toast.success('Record Purged');
        fetchInventory();
      } catch (error) {
        toast.error('Action Denied');
      }
    }
  };

  const getStatus = (available, total) => {
    const ratio = available / total;
    if (ratio <= 0.15) return { label: 'CRITICAL', color: 'text-red-600 bg-red-50', icon: <TrendingDown size={12}/> };
    if (ratio <= 0.4) return { label: 'REPLENISH', color: 'text-amber-600 bg-amber-50', icon: <AlertCircle size={12}/> };
    return { label: 'OPTIMAL', color: 'text-green-600 bg-green-50', icon: <ClipboardCheck size={12}/> };
  };

  const filteredAmmo = ammunition.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.receivedByUnit && a.receivedByUnit.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (a.batchNumber && a.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return (
    <div className="fixed inset-0 bg-[#F1F5F9] flex items-center justify-center font-black text-slate-400 text-[10px] tracking-[0.4em]">
      SYNCHRONIZING ARMORY...
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      
      {/* 1. HEADER */}
      <header className="w-full bg-[#F1F5F9] border-b border-gray-300 px-4 py-4 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 p-2.5 shadow-lg border-b-2 border-red-600">
              <Archive className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Ammunition Inventory</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Stock: {ammunition.length} Categories | Status: Encrypted</p>
            </div>
          </div>
          
          <button
            onClick={() => { resetForm(); setShowFormModal(true); }}
            className="w-full md:w-auto bg-slate-900 hover:bg-red-700 text-white px-8 py-3 flex items-center justify-center gap-3 transition-all border-l-4 border-red-500 shadow-sm"
          >
            <Plus size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Regitster New Ammunition</span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full p-4 lg:p-8 space-y-6">
        
        {/* 2. SEARCH & CONTROLS */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="SEARCH BY NOMENCLATURE, BATCH ID, OR UNIT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-300 py-4 pl-12 pr-4 text-xs font-black uppercase tracking-[0.1em] placeholder:text-gray-300 focus:border-slate-900 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="bg-white border border-gray-300 flex items-center justify-between px-6 py-4 shadow-sm">
            <div className="flex items-center gap-3 font-black text-[10px] text-slate-500 uppercase">
              <Shield size={16} className="text-red-500" />
              Auth: Armory_Officer
            </div>
            <Activity size={16} className="text-green-500 animate-pulse" />
          </div>
        </div>

        {/* 3. TABLE */}
        <div className="bg-white border border-gray-300 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-[#F1F5F9] border-b border-gray-300 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="px-8 py-5">Asset Identification</th>
                  <th className="px-8 py-5">Caliber/Type</th>
                  <th className="px-8 py-5">Stock Level</th>
                  <th className="px-8 py-5">Unit Allocation</th>
                  <th className="px-8 py-5 text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAmmo.map((item) => {
                  const status = getStatus(item.availableCount, item.totalCount);
                  return (
                    <tr key={item._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-slate-900 flex items-center justify-center text-white">
                            <Box size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{item.name}</p>
                            <p className="text-[9px] font-bold text-red-600 uppercase italic">Batch: {item.batchNumber || 'NO_BATCH'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black text-slate-700 uppercase">{item.caliber}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 w-fit rounded">{item.type}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="space-y-2">
                          <div className={`inline-flex items-center gap-2 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${status.color}`}>
                            {status.icon} {status.label}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${status.label === 'CRITICAL' ? 'bg-red-600' : 'bg-slate-900'}`} 
                                style={{ width: `${(item.availableCount/item.totalCount)*100}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-black text-slate-800">{item.availableCount}/{item.totalCount}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <p className="text-[11px] font-black text-slate-700 uppercase">{item.receivedByUnit || 'CENTRAL_RES'}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase italic">{item.receivedDate ? new Date(item.receivedDate).toLocaleDateString() : '---'}</p>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setSelectedAmmo(item); setShowViewModal(true); }} className="p-2 bg-white border border-gray-200 text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all"><Eye size={16}/></button>
                          <button onClick={() => { setSelectedAmmo(item); setFormData({...item, receivedDate: item.receivedDate?.split('T')[0]}); setIsEditing(true); setShowFormModal(true); }} className="p-2 bg-white border border-gray-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all"><Edit3 size={16}/></button>
                          <button onClick={() => handleDelete(item._id)} className="p-2 bg-white border border-gray-200 text-slate-400 hover:text-red-600 hover:border-red-600 transition-all"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 4. DOSSIER VIEW MODAL */}
      {showViewModal && selectedAmmo && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-4xl shadow-2xl relative overflow-hidden flex flex-col border border-slate-300 max-h-[90vh]">
            <div className="bg-[#F1F5F9] p-6 flex justify-between items-center border-b border-gray-300">
              <div className="flex items-center gap-4">
                <div className="bg-slate-900 p-2 text-white"><Package size={20} /></div>
                <div>
                  <h2 className="text-xl font-black uppercase italic tracking-tighter">Asset Specification Sheet</h2>
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">{selectedAmmo.name}</p>
                </div>
              </div>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><X size={24}/></button>
            </div>

            <div className="p-8 lg:p-12 overflow-y-auto">
              {/* PRIMARY STATS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 border-b border-gray-100 pb-12">
                <DossierItem icon={<Crosshair size={14}/>} label="Caliber" value={selectedAmmo.caliber || 'NOT_SET'} />
                <DossierItem icon={<Layers size={14}/>} label="Category" value={selectedAmmo.type || 'LIVE'} />
                <DossierItem icon={<Hash size={14}/>} label="Batch ID" value={selectedAmmo.batchNumber || 'NONE'} />
                <DossierItem icon={<Activity size={14}/>} label="Total Qty" value={`${selectedAmmo.totalCount} RNDS`} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <DossierItem icon={<Package size={14}/>} label="Available" value={selectedAmmo.availableCount || 0} />
                <DossierItem icon={<Activity size={14}/>} label="Currently Issued" value={selectedAmmo.issuedCount || 0} />
                <DossierItem icon={<AlertCircle size={14}/>} label="Consumed" value={selectedAmmo.consumedCount || 0} />
                <DossierItem icon={<FileText size={14}/>} label="Empty Cases Stored" value={selectedAmmo.emptyCasesCount || 0} />
              </div>

              {/* LOGS */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                  <History size={14} className="text-red-500" /> Audit History Logs
                </h3>
                <div className="border border-gray-200 divide-y divide-gray-100 bg-gray-50/50 rounded-sm">
                  {selectedAmmo.remarks && selectedAmmo.remarks.length > 0 ? (
                    [...selectedAmmo.remarks].reverse().map((log, index) => (
                      <div key={index} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold text-slate-700 uppercase leading-relaxed">{log.text}</p>
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black text-slate-400 uppercase italic">Op: {log.addedBy?.name || 'System'}</span>
                            <span className="h-1 w-1 bg-gray-300 rounded-full"></span>
                            <span className="text-[9px] font-black text-slate-400 uppercase">{new Date(log.date).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-[10px] font-bold text-gray-400 uppercase italic">No transaction records present.</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-[#F8FAFC] border-t border-gray-200 flex justify-end">
              <button onClick={() => setShowViewModal(false)} className="px-8 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-red-700 transition-all">Close Dossier</button>
            </div>
          </div>
        </div>
      )}

      {/* 5. FORM MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-4xl shadow-2xl relative flex flex-col border border-slate-300 max-h-[90vh]">
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Plus size={24} className="text-red-500" />
                <h2 className="text-lg font-black uppercase italic tracking-tighter">
                  {isEditing ? 'Modify Ammunition Inventory' : 'Ammunition Registry Terminal'}
                </h2>
              </div>
              <button onClick={() => setShowFormModal(false)} className="text-white/50 hover:text-white transition-colors"><X size={24}/></button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
              <div className="overflow-y-auto p-8 lg:p-12 space-y-10">
                {/* 01. CLASSIFICATION */}
                <div>
                  <h4 className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <FileText size={14}/> 01. Classification
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormSelect 
                      label="Nomenclature" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleInputChange} 
                      required 
                      disabled={isEditing}
                      options={[
                        '7.62mm AK-47 Rounds', '5.56mm INSAS Rounds', '7.62mm SLR Rounds',
                        '.303 Rounds', '9mm Pistol Rounds', 'Shotgun Cartridges', 'Rubber Bullets'
                      ]} 
                    />
                    <FormSelect 
                      label="Caliber" 
                      name="caliber" 
                      value={formData.caliber} 
                      onChange={handleInputChange} 
                      options={['7.62mm', '5.56mm', '.303', '9mm', '12 Gauge']} 
                    />
                    <FormSelect 
                      label="Category" 
                      name="type" 
                      value={formData.type} 
                      onChange={handleInputChange} 
                      options={['Live', 'Blank', 'Rubber', 'Training', 'Special']} 
                    />
                  </div>
                </div>

                {/* 02. METRICS */}
                <div>
                  <h4 className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <Activity size={14}/> 02. Volume & Logistics
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <FormInput label="Batch Number" name="batchNumber" value={formData.batchNumber} onChange={handleInputChange} placeholder="LOT_2024_01" />
                    <FormInput label="Total Quantity" name="totalCount" type="number" value={formData.totalCount} onChange={handleInputChange} required />
                    <FormInput label="Available Now" name="availableCount" type="number" value={formData.availableCount} onChange={handleInputChange} required />
                    <FormInput label="Log Date" name="receivedDate" type="date" value={formData.receivedDate} onChange={handleInputChange} />
                  </div>
                </div>

                {/* 03. REMARKS */}
                <div>
                  <h4 className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <Info size={14}/> 03. Officer Notes
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <textarea 
                      name="about" 
                      value={formData.about} 
                      onChange={handleInputChange} 
                      placeholder="TECHNICAL SPECIFICATIONS..." 
                      className="w-full border border-gray-300 p-4 h-24 text-xs font-black uppercase outline-none focus:border-slate-900"
                    ></textarea>
                    <textarea 
                      name="remarks" 
                      value={formData.remarks} 
                      onChange={handleInputChange} 
                      placeholder="LOG ENTRY DETAILS (E.G. RECEIVED FROM DEPOT X)..." 
                      className="w-full border border-gray-300 p-4 h-24 text-xs font-black uppercase outline-none focus:border-slate-900"
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-[#F8FAFC] border-t border-gray-200 flex justify-end items-center gap-6">
                <button type="button" onClick={() => setShowFormModal(false)} className="text-[10px] font-black uppercase text-gray-400 hover:text-slate-900 transition-colors">Abort Registry</button>
                <button type="submit" className="bg-slate-900 text-white px-10 py-4 text-[10px] font-black uppercase tracking-widest border-l-4 border-red-600 shadow-xl hover:bg-red-700 transition-all">
                  {isEditing ? 'Update Record' : 'Commit Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- SHARED COMPONENTS ---
const FormInput = ({ label, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">{label}</label>
    <input {...props} className="w-full bg-white border border-gray-300 px-4 py-3 text-xs font-bold text-slate-800 focus:border-slate-900 outline-none shadow-sm transition-all" />
  </div>
);

const FormSelect = ({ label, options, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">{label}</label>
    <select {...props} className="w-full bg-white border border-gray-300 px-4 py-3 text-xs font-bold text-slate-800 focus:border-slate-900 outline-none shadow-sm appearance-none disabled:bg-gray-100 cursor-pointer">
      <option value="">SELECT...</option>
      {options.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
    </select>
  </div>
);

const DossierItem = ({ icon, label, value }) => (
  <div className="space-y-1 border-l-2 border-slate-100 pl-4">
    <div className="flex items-center gap-2 text-slate-400">
      {icon}
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <p className="text-xs font-black text-slate-800 uppercase italic">{value}</p>
  </div>
);

export default Ammunition;