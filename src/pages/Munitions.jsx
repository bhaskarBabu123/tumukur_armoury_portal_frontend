import React, { useState, useEffect } from 'react'
import { munitionAPI } from '../utils/api'
import { toast } from 'react-toastify'
import { 
  Plus, Search, Trash2, Eye, Zap, 
  Hash, Calendar, Archive, AlertCircle, 
  Box, X, Truck, DollarSign, ShieldCheck, 
  ShieldAlert, Info, Factory, MapPin, 
  History, Activity
} from 'lucide-react'

const Munitions = () => {
  // --- STATE MANAGEMENT ---
  const [munitions, setMunitions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedMunition, setSelectedMunition] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  
  const [formData, setFormData] = useState({
    name: '', type: 'Explosive', category: 'Grenade', batchNumber: '',
    manufacturer: '', totalCount: '', availableCount: '', unitPrice: '',
    manufacturingDate: '', expiryDate: '', dangerClass: '1.4',
    storageLocation: '', minimumStockLevel: 10, reorderLevel: 25, remarks: ''
  })

  useEffect(() => { fetchMunitions() }, [])

  // --- API ACTIONS ---
  const fetchMunitions = async () => {
    try {
      const response = await munitionAPI.getAll()
      setMunitions(response.data.data)
    } catch (error) {
      toast.error('System Sync Failure')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Backend handles "Update if name+batch exists, else Create"
      const response = await munitionAPI.create(formData)
      
      if (response.data.isUpdate) {
        toast.info(`STOCK MERGED: ${formData.totalCount} units added to Batch ${formData.batchNumber.toUpperCase()}`)
      } else {
        toast.success('NEW BATCH REGISTERED SUCCESSFULLY')
      }

      setShowAddModal(false)
      resetForm()
      fetchMunitions()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registry Error')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('WARNING: PERMANENTLY DE-REGISTER THIS MUNITION BATCH?')) {
      try {
        await munitionAPI.delete(id)
        toast.success('Batch Purged from Records')
        fetchMunitions()
      } catch (error) {
        toast.error(error.response?.data?.message || 'Access Denied')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '', type: 'Explosive', category: 'Grenade', batchNumber: '',
      manufacturer: '', totalCount: '', availableCount: '', unitPrice: '',
      manufacturingDate: '', expiryDate: '', dangerClass: '1.4',
      storageLocation: '', minimumStockLevel: 10, reorderLevel: 25, remarks: ''
    })
  }

  // --- FILTERING ---
  const filteredMunitions = munitions.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center">
      <Activity className="text-red-600 animate-pulse mb-4" size={48} />
      <span className="text-[10px] font-black text-white uppercase tracking-[0.5em]">Syncing Armory Ledger...</span>
    </div>
  )

  return (
    <div className="w-full min-h-screen bg-[#F1F5F9] flex flex-col font-sans">
      
      {/* 1. TOP NAV / HEADER */}
      <header className="w-full bg-white border-b-2 border-slate-200 px-8 py-5 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-5">
          <div className="bg-slate-900 p-3 shadow-xl border-b-4 border-red-600">
            <Zap className="h-6 w-6 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Munition Inventory</h1>
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Status: {munitions.length} Batches Registered</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="bg-slate-900 hover:bg-red-700 text-white px-8 py-4 flex items-center gap-3 transition-all border-l-4 border-red-600 shadow-xl active:scale-95"
        >
          <Plus size={18} /> <span className="text-[11px] font-black uppercase tracking-widest">Register New Munition</span>
        </button>
      </header>

      <main className="flex-1 p-8 space-y-6">
        
        {/* 2. SEARCH AND FILTER TOOLS */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="SEARCH BY NOMENCLATURE OR BATCH ID..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border-2 border-slate-200 py-4 pl-12 pr-4 text-xs font-black uppercase tracking-widest focus:border-slate-900 outline-none shadow-sm transition-all" 
            />
          </div>
          <div className="bg-slate-900 border border-slate-800 flex items-center justify-between px-6 py-4 shadow-inner">
            <div className="flex items-center gap-3 font-black text-[10px] text-slate-400 uppercase">
              <ShieldCheck size={18} className="text-green-500" /> System: Encrypted
            </div>
          </div>
        </div>

        {/* 3. MAIN DATA TABLE */}
        <div className="bg-white border-2 border-slate-200 overflow-hidden rounded-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-[0.15em]">
                  <th className="px-8 py-6">Classification</th>
                  <th className="px-8 py-6">Batch Tracking</th>
                  <th className="px-8 py-6">Hazmat Class</th>
                  <th className="px-8 py-6">Inventory Level</th>
                  <th className="px-8 py-6 text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMunitions.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-5">
                      <p className="text-sm font-black text-slate-900 uppercase group-hover:text-red-700 transition-colors">{m.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase italic">{m.category} // {m.type}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2 py-1 border border-slate-200">
                        {m.batchNumber}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 text-[10px] font-black rounded border-l-4 ${
                        m.dangerClass.startsWith('1.1') ? 'bg-orange-100 text-orange-700 border-orange-600' : 'bg-blue-100 text-blue-700 border-blue-600'
                      }`}>
                        CLASS {m.dangerClass}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div 
                            className={`h-full transition-all duration-1000 ${
                              m.availableCount <= m.minimumStockLevel ? 'bg-red-600' : 'bg-slate-900'
                            }`} 
                            style={{ width: `${(m.availableCount / m.totalCount) * 100}%` }} 
                          />
                        </div>
                        <span className={`text-xs font-black ${m.availableCount <= m.minimumStockLevel ? 'text-red-600' : 'text-slate-900'}`}>
                          {m.availableCount} / {m.totalCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right flex justify-end gap-3">
                      <button 
                        onClick={() => { setSelectedMunition(m); setShowViewModal(true); }} 
                        className="p-2.5 bg-slate-50 border-2 border-slate-200 text-slate-600 hover:border-slate-900 hover:text-slate-900 transition-all shadow-sm"
                        title="View Dossier"
                      >
                        <Eye size={16}/>
                      </button>
                      <button 
                        onClick={() => handleDelete(m._id)} 
                        className="p-2.5 bg-slate-50 border-2 border-slate-200 text-slate-400 hover:border-red-600 hover:text-red-600 transition-all shadow-sm"
                        title="Delete Batch"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 4. DOSSIER VIEW MODAL */}
      {showViewModal && selectedMunition && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-md">
          <div className="bg-white w-full max-w-5xl shadow-2xl relative flex flex-col border-t-8 border-red-600 h-[85vh]">
            <div className="bg-[#F8FAFC] p-8 flex justify-between items-center border-b-2">
              <div className="flex items-center gap-5">
                <div className="bg-slate-900 p-3 text-white shadow-lg"><Archive size={24} /></div>
                <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter">Batch Dossier: {selectedMunition.name}</h2>
                  <p className="text-[10px] font-bold text-slate-400 tracking-[0.3em]">SERIAL REF: {selectedMunition._id}</p>
                </div>
              </div>
              <button onClick={() => setShowViewModal(false)} className="hover:rotate-90 transition-transform"><X size={32}/></button>
            </div>

            <div className="flex bg-slate-100 px-8 border-b">
              {['overview', 'logistics', 'technical'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)} 
                  className={`px-10 py-4 text-[11px] font-black uppercase tracking-widest transition-all ${
                    activeTab === tab ? 'bg-white border-t-4 border-red-600 text-slate-900' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-10">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  <DossierItem icon={<Hash className="text-red-600"/>} label="Batch Tracking ID" value={selectedMunition.batchNumber} />
                  <DossierItem icon={<Factory className="text-red-600"/>} label="Manufacturer" value={selectedMunition.manufacturer} />
                  <DossierItem icon={<Calendar className="text-red-600"/>} label="Expiry/Safe Use" value={new Date(selectedMunition.expiryDate).toLocaleDateString()} />
                  <DossierItem icon={<DollarSign className="text-red-600"/>} label="Financial Value" value={`$${selectedMunition.totalValue?.toLocaleString()}`} />
                  <DossierItem icon={<MapPin className="text-red-600"/>} label="Storage Sector" value={selectedMunition.storageLocation} />
                  <DossierItem icon={<ShieldAlert className="text-red-600"/>} label="Hazard Class" value={selectedMunition.dangerClass} />
                </div>
              )}
              {activeTab === 'logistics' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                   <LogCard label="Total Usable Stock" val={selectedMunition.totalCount} color="slate" />
                   <LogCard label="Current Available" val={selectedMunition.availableCount} color="blue" />
                   <LogCard label="Currently Issued" val={selectedMunition.issuedCount} color="orange" />
                   <LogCard label="Consumed" val={selectedMunition.consumedCount || 0} color="red" />
                   <LogCard label="Empty Cases Stored" val={selectedMunition.emptyCasesCount || 0} color="slate" />
                   <LogCard label="Damaged" val={selectedMunition.damagedCount || 0} color="red" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. ADD / RESTOCK MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl shadow-2xl border-t-8 border-slate-900 flex flex-col">
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Box size={20} className="text-red-500" />
                <h2 className="text-sm font-black uppercase italic tracking-widest">Inventory Entry System</h2>
              </div>
              <button onClick={() => setShowAddModal(false)}><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="col-span-3 bg-blue-50 border-l-4 border-blue-600 p-4 flex items-start gap-3">
                <Info size={18} className="text-blue-600 mt-0.5" />
                <p className="text-[11px] font-bold text-blue-800 leading-relaxed uppercase">
                  Note: If the Nomenclature and Batch Number match an existing record, the quantities will be added together to prevent duplicates.
                </p>
              </div>

              <FormSelect 
                label="Nomenclature" name="name" value={formData.name} onChange={handleInputChange} required 
                options={['Hand Grenades', 'Tear Gas Shells', 'Smoke Grenades', 'Flash Bangs', 'Breaching Charges', 'Rubber Bullets']} 
              />
              <FormInput label="Batch Number" name="batchNumber" value={formData.batchNumber} onChange={handleInputChange} required placeholder="EX: LOT-2024-01" />
              <FormInput label="Manufacturer" name="manufacturer" value={formData.manufacturer} onChange={handleInputChange} placeholder="EX: ORDNANCE FACTORY" />
              
              <FormInput label="Total Units Received" name="totalCount" type="number" value={formData.totalCount} onChange={handleInputChange} required />
              <FormInput label="Available Units" name="availableCount" type="number" value={formData.availableCount} onChange={handleInputChange} required />
              <FormInput label="Unit Price ($)" name="unitPrice" type="number" value={formData.unitPrice} onChange={handleInputChange} />
              
              <FormInput label="Manufacturing Date" name="manufacturingDate" type="date" value={formData.manufacturingDate} onChange={handleInputChange} />
              <FormInput label="Expiry Date" name="expiryDate" type="date" value={formData.expiryDate} onChange={handleInputChange} />
              <FormSelect label="Hazard Class" name="dangerClass" value={formData.dangerClass} onChange={handleInputChange} options={['1.1', '1.2', '1.3', '1.4', '1.5', '1.6']} />

              <div className="md:col-span-3 bg-slate-50 p-8 flex justify-end gap-6 border-t mt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="text-[11px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors">Abort</button>
                <button type="submit" className="bg-slate-900 hover:bg-red-700 text-white px-12 py-4 text-[11px] font-black uppercase border-l-4 border-red-600 shadow-xl transition-all">Commit to Armory Ledger</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// --- SUB-COMPONENTS FOR CLEANER CODE ---

const FormInput = ({ label, ...props }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">{label}</label>
    <input {...props} className="w-full bg-slate-50 border-2 border-slate-200 px-4 py-3 text-xs font-bold text-slate-900 focus:border-slate-900 outline-none transition-all placeholder:text-slate-300" />
  </div>
)

const FormSelect = ({ label, options, ...props }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">{label}</label>
    <select {...props} className="w-full bg-slate-50 border-2 border-slate-200 px-4 py-3 text-xs font-bold text-slate-900 focus:border-slate-900 outline-none cursor-pointer">
      <option value="">SELECT CLASSIFICATION</option>
      {options.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
    </select>
  </div>
)

const DossierItem = ({ icon, label, value }) => (
  <div className="space-y-2 group">
    <div className="flex items-center gap-3 text-slate-400 group-hover:text-red-600 transition-colors">
      {icon}
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
    </div>
    <p className="text-lg font-black text-slate-800 uppercase italic ml-8 border-l-2 border-slate-100 pl-4">{value || 'N/A'}</p>
  </div>
)

const LogCard = ({ label, val, color }) => {
  const colors = {
    slate: 'bg-slate-50 border-slate-200 text-slate-900',
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
    red: 'bg-red-50 border-red-200 text-red-900'
  }
  return (
    <div className={`p-6 border-2 text-center shadow-sm ${colors[color]}`}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{label}</p>
      <p className="text-3xl font-black">{val || 0}</p>
    </div>
  )
}

export default Munitions