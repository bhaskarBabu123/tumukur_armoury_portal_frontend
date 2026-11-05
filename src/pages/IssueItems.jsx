import React, { useState, useEffect, useRef } from 'react'
import { officersAPI, armouryAPI, ammunitionAPI, munitionAPI, transactionsAPI } from '../utils/api'
import { toast } from 'react-toastify'
import { 
  Search, ArrowUpCircle, Shield, Package, Zap, Fingerprint, 
  Plus, Minus, X, Scan, CheckCircle2, Info,
  LayoutGrid, AlertCircle, Loader2
} from 'lucide-react'
import { useFingerprint } from '../contexts/FingerprintContext'
import OfficerHistoryModal from '../components/OfficerHistoryModal'

const API_ROOT = (import.meta.env.VITE_API_URL || 'https://tumakur-armoury-portal-backend.onrender.com/api').replace(/\/api\/?$/, '')

const IssueItems = () => {
  const { captureFinger, verifyFinger, isScanning } = useFingerprint()
  
  // Data States
  const [officers, setOfficers] = useState([])
  const [arms, setArms] = useState([])
  const [ammunition, setAmmunition] = useState([])
  const [munitions, setMunitions] = useState([])
  
  // Selection States
  const [selectedOfficer, setSelectedOfficer] = useState(null)
  const [outstandingItems, setOutstandingItems] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [kgidInput, setKgidInput] = useState('')
  const [selectedItems, setSelectedItems] = useState({ arms: [], ammunition: [], munitions: [] })
  const [quantities, setQuantities] = useState({})
  
  // UI States
  const [barcodeInput, setBarcodeInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showKGIDModal, setShowKGIDModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  
  // Search States
  const [ammoSearch, setAmmoSearch] = useState('')
  const [munitionSearch, setMunitionSearch] = useState('')
  const [showAmmoSuggest, setShowAmmoSuggest] = useState(false)
  const [showMunitionSuggest, setShowMunitionSuggest] = useState(false)

  const barcodeRef = useRef(null)

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    if (selectedOfficer && barcodeRef.current) {
      barcodeRef.current.focus()
    }
  }, [selectedOfficer])

  useEffect(() => {
    if (!selectedOfficer?._id) {
      setOutstandingItems([])
      return
    }
    let active = true
    setOutstandingItems([])
    transactionsAPI.getOutstandingByOfficer(selectedOfficer._id)
      .then(response => { if (active) setOutstandingItems(response.data.data || []) })
      .catch(() => { if (active) setOutstandingItems([]) })
    return () => { active = false }
  }, [selectedOfficer?._id])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [o, a, ammo, m] = await Promise.all([
        officersAPI.getAll({ status: 'active', limit: 500 }),
        armouryAPI.getAll(),
        ammunitionAPI.getAll(),
        munitionAPI.getAll()
      ])
      setOfficers(o.data.data)
      setArms(a.data.data.filter(arm => arm.status === 'available'))
      setAmmunition(ammo.data.data.filter(i => i.availableCount > 0))
      setMunitions(m.data.data.filter(i => i.availableCount > 0))
    } catch (error) { 
      toast.error('Ledger Sync Failed') 
    } finally {
      setLoading(false)
    }
  }

  // --- LOGIC HANDLERS ---
  const handleBarcodeSubmit = (e) => {
    if (e) e.preventDefault()
    if (!selectedOfficer) return toast.warning('Authenticate Officer First')
    
    const code = barcodeInput.trim().toUpperCase()
    const arm = arms.find(a => a.barcode === code || a.registerNumber === code)
    
    if (arm) {
      if (selectedItems.arms.some(i => i._id === arm._id)) return toast.info('Weapon already in queue')
      setSelectedItems(p => ({ ...p, arms: [...p.arms, arm] }))
      setBarcodeInput('')
      toast.success(`Weapon Secured: ${arm.registerNumber}`)
    } else {
      toast.error('Invalid Barcode or Weapon Unavailable')
    }
  }

  const handleKGIDSubmit = async () => {
    const officer = officers.find(o => o.kgidNo === kgidInput.trim().toUpperCase())
    if (!officer) return toast.error('KGID Not Found')

    if (!officer.fingerprintData) return toast.error('No fingerprint is registered for this officer. Use manual officer selection.');

    try {
      const result = await captureFinger()
      if (result.success) {
        const verifyResult = await verifyFinger(result.data.template, officer.fingerprintData)
        if (verifyResult.success && verifyResult.matched) {
          setSelectedOfficer(officer)
          setShowKGIDModal(false)
          setKgidInput('')
          toast.success(`Access Granted: ${officer.name}`)
        } else { toast.error('Biometric Mismatch') }
      }
    } catch (error) { toast.error('Biometric Scanner Error') }
  }

const handleFinalIssue = async () => {
  if (!selectedOfficer) return toast.error("Select an Officer First");
  
  setIsSubmitting(true);
  try {
    // 1. Format Ammunition Quantities Mapping
    const ammunitionCounts = {};
    selectedItems.ammunition.forEach(item => {
      // Access the state key e.g., quantities["ammo_696b..."]
      const qty = quantities[`ammo_${item._id}`] || 1;
      ammunitionCounts[item._id] = Number(qty);
    });

    // 2. Format Munition Quantities Mapping
    const munitionCounts = {};
    selectedItems.munitions.forEach(item => {
      const qty = quantities[`munition_${item._id}`] || 1;
      munitionCounts[item._id] = Number(qty);
    });

    // 3. Build the Payload
    const payload = {
      officerId: selectedOfficer._id,
      weaponIds: selectedItems.arms.map(a => a._id),
      ammunitionIds: selectedItems.ammunition.map(a => a._id),
      munitionIds: selectedItems.munitions.map(m => m._id),
      ammunitionCounts, // Sends: { "ID_1": 50, "ID_2": 20 }
      munitionCounts,   // Sends: { "ID_3": 5 }
      purpose: "Duty Assignment",
      location: "Main Armoury",
      expectedReturnDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    // 4. API CALL
    const response = await transactionsAPI.issue(payload);
    
    if (response.data.success) {
      toast.success('TRANSACTION VERIFIED & LOGGED');
      
      // Reset State
      setSelectedOfficer(null);
      setSelectedItems({ arms: [], ammunition: [], munitions: [] });
      setQuantities({});
      setShowConfirmModal(false);
      fetchData(); // Refresh the stock numbers
    }
  } catch (error) {
    console.error("Frontend Error:", error.response?.data);
    toast.error(error.response?.data?.message || 'Transaction Failed');
  } finally {
    setIsSubmitting(false);
  }
};

  const updateQuantity = (key, delta, max) => {
    setQuantities(prev => {
      const current = prev[key] || 1
      const next = current + delta
      if (next < 1) return prev
      if (next > max) {
        toast.warning(`Limit Reached: Only ${max} available`)
        return prev
      }
      return { ...prev, [key]: next }
    })
  }

  const removeItem = (type, id) => {
    setSelectedItems(prev => ({ ...prev, [type]: prev[type].filter(i => i._id !== id) }))
  }

  const SectionHeader = ({ icon: Icon, title, subtitle }) => (
    <div className="flex items-center gap-3 mb-6 border-l-4 border-slate-900 pl-4">
      <div className="p-2 bg-slate-900 text-white"><Icon size={18} /></div>
      <div>
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">{title}</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase">{subtitle}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8 font-sans">
      
      {/* TOP SCANNER BAR */}
      <div className="mb-8 bg-slate-900 shadow-2xl overflow-hidden border-b-4 border-red-600 flex flex-col md:flex-row items-stretch">
        <div className="bg-red-600 px-6 py-4 flex items-center justify-center text-white gap-3">
          <Scan className={selectedOfficer ? "animate-pulse" : ""} size={24} />
          <span className="text-xs font-black uppercase tracking-tighter italic">Scanner Active</span>
        </div>
        <form onSubmit={handleBarcodeSubmit} className="flex-1 flex">
          <input 
            ref={barcodeRef}
            type="text"
            className="w-full bg-slate-800 text-yellow-400 px-6 py-4 font-mono text-lg focus:outline-none placeholder:text-slate-600"
            placeholder={selectedOfficer ? "READY TO SCAN WEAPON BARCODE..." : "AUTHENTICATE OFFICER TO ENABLE SCANNER"}
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            disabled={!selectedOfficer}
          />
          <button type="submit" disabled={!selectedOfficer} className="bg-slate-700 hover:bg-slate-600 px-8 text-[10px] font-black uppercase text-white tracking-widest border-l border-slate-600">
            Manual Enter
          </button>
        </form>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* LEFT COLUMN */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          
          {/* 1. OFFICER AUTH */}
          <div className="bg-white border-2 border-slate-200 shadow-sm overflow-hidden">
            {!selectedOfficer ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-25"></div>
                  <div className="relative bg-slate-900 p-6 rounded-full text-white"><Fingerprint size={48} /></div>
                </div>
                <h2 className="text-xl font-black uppercase italic text-slate-900">Officer Identification Required</h2>
                <p className="text-xs font-bold text-slate-400 mb-8 uppercase tracking-widest">Verify credentials to initiate arms issue</p>
                <div className="w-full max-w-xl space-y-3">
                  <label className="block text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Manual officer selection</label>
                  <select className="w-full border-2 border-slate-200 bg-white p-4 text-sm font-bold" value="" onChange={(e) => {
                    const officer = officers.find(item => item._id === e.target.value);
                    if (officer) { setSelectedOfficer(officer); toast.success(`Selected: ${officer.name}`); }
                  }}>
                    <option value="">Select officer by name / KGID / Metal number</option>
                    {officers.filter(o => o.status === 'active').map(o => <option key={o._id} value={o._id}>{o.name} — {o.kgidNo || 'No KGID'} — {o.metalNo}</option>)}
                  </select>
                  <p className="text-[9px] text-slate-400 uppercase">Manual selection is available now. Fingerprint verification can be used when registered.</p>
                  <button onClick={() => setShowKGIDModal(true)} className="bg-slate-900 text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest border-l-4 border-red-600 hover:bg-red-700 transition-all">
                    Optional fingerprint verification
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 flex flex-col gap-4 bg-white">
                <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <img 
                      src={`${API_ROOT}/uploads/profiles/${selectedOfficer.profilePicture}`} 
                      className="w-20 h-20 rounded-sm object-cover border-2 border-slate-900 shadow-lg" 
                      alt="Profile"
                      onError={(e) => e.target.src = 'https://via.placeholder.com/80?text=OFFICER'} 
                    />
                    <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1 rounded-full"><CheckCircle2 size={16} /></div>
                  </div>
                  <div>
                    <h2 className="text-lg font-black uppercase italic text-slate-900">{selectedOfficer.name}</h2>
                    <p className="text-[10px] font-black text-red-600 uppercase mb-2 tracking-widest">{selectedOfficer.rank} // KGID: {selectedOfficer.kgidNo}</p>
                    <div className="flex gap-2">
                       <span className="text-[9px] font-bold bg-slate-100 px-2 py-0.5 border">METAL: {selectedOfficer.metalNo}</span>
                       <span className="text-[9px] font-bold bg-slate-100 px-2 py-0.5 border">DEPT: ARMED RESERVE</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button onClick={() => setShowHistory(true)} className="px-4 py-2 bg-slate-900 text-white text-[9px] font-black uppercase">View issue / return history</button>
                  <button onClick={() => { setSelectedOfficer(null); setSelectedItems({ arms: [], ammunition: [], munitions: [] }); setQuantities({}); setOutstandingItems([]) }} className="px-4 py-2 text-[9px] font-black uppercase text-slate-500 border hover:text-red-600">Change Officer</button>
                </div>
                </div>
                {outstandingItems.length > 0 && (
                  <div className="border border-red-300 bg-red-50 p-4 text-red-700">
                    <p className="text-xs font-black uppercase">Issue blocked — outstanding items must be returned first</p>
                    <ul className="mt-2 text-[10px] font-bold space-y-1">
                      {outstandingItems.map(item => <li key={item.key}>• {item.name} — {item.itemType} — {item.itemType === 'armoury' ? 'Physical return / approved report pending' : `${item.outstandingCount} quantity pending`}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. SEARCH GRID */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Ammo */}
            <div className="bg-white border-2 border-slate-200 p-6 shadow-sm">
              <SectionHeader icon={Package} title="Ammunition" subtitle="Search by caliber" />
              <div className="relative">
                <Search className="absolute left-3 top-3.5 text-slate-400" size={16} />
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border-2 border-slate-100 py-3 pl-10 pr-4 text-xs font-bold focus:border-slate-900 outline-none"
                  placeholder="SEARCH AMMO..."
                  value={ammoSearch}
                  onChange={(e) => { setAmmoSearch(e.target.value); setShowAmmoSuggest(true); }}
                  onFocus={() => setShowAmmoSuggest(true)}
                  disabled={!selectedOfficer}
                />
                {showAmmoSuggest && ammoSearch && (
                  <div className="absolute z-40 w-full mt-1 bg-white border-2 border-slate-900 shadow-2xl max-h-48 overflow-y-auto">
                    {ammunition.filter(a => a.name.toLowerCase().includes(ammoSearch.toLowerCase())).map(item => (
                      <div 
                        key={item._id}
                        className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b last:border-0"
                        onClick={() => {
                          if (!selectedItems.ammunition.some(i => i._id === item._id)) {
                            setSelectedItems(p => ({ ...p, ammunition: [...p.ammunition, item] }))
                            setQuantities(p => ({ ...p, [`ammo_${item._id}`]: 1 }))
                          }
                          setAmmoSearch(''); setShowAmmoSuggest(false);
                        }}
                      >
                        <span className="text-[10px] font-black uppercase">{item.name}</span>
                        <span className="text-[9px] font-bold text-slate-400 italic">STOCK: {item.availableCount}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Munitions */}
            <div className="bg-white border-2 border-slate-200 p-6 shadow-sm">
              <SectionHeader icon={Zap} title="Munitions" subtitle="Explosives" />
              <div className="relative">
                <Search className="absolute left-3 top-3.5 text-slate-400" size={16} />
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border-2 border-slate-100 py-3 pl-10 pr-4 text-xs font-bold focus:border-slate-900 outline-none"
                  placeholder="SEARCH MUNITIONS..."
                  value={munitionSearch}
                  onChange={(e) => { setMunitionSearch(e.target.value); setShowMunitionSuggest(true); }}
                  onFocus={() => setShowMunitionSuggest(true)}
                  disabled={!selectedOfficer}
                />
                {showMunitionSuggest && munitionSearch && (
                  <div className="absolute z-40 w-full mt-1 bg-white border-2 border-slate-900 shadow-2xl max-h-48 overflow-y-auto">
                    {munitions.filter(m => m.name.toLowerCase().includes(munitionSearch.toLowerCase())).map(item => (
                      <div 
                        key={item._id}
                        className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b last:border-0"
                        onClick={() => {
                          if (!selectedItems.munitions.some(i => i._id === item._id)) {
                            setSelectedItems(p => ({ ...p, munitions: [...p.munitions, item] }))
                            setQuantities(p => ({ ...p, [`munition_${item._id}`]: 1 }))
                          }
                          setMunitionSearch(''); setShowMunitionSuggest(false);
                        }}
                      >
                        <span className="text-[10px] font-black uppercase">{item.name}</span>
                        <span className="text-[9px] font-bold text-slate-400 italic">STOCK: {item.availableCount}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. QUEUE */}
          <div className="bg-white border-2 border-slate-200 shadow-sm p-6">
            <SectionHeader icon={LayoutGrid} title="Issue Queue" subtitle="Verify items" />
            <div className="space-y-4">
              {selectedItems.arms.map(arm => (
                <div key={arm._id} className="flex items-center justify-between bg-slate-50 p-4 border-l-4 border-slate-900">
                  <div className="flex items-center gap-4">
                    <Shield className="text-slate-400" size={18} />
                    <div>
                      <p className="text-xs font-black uppercase">{arm.registerNumber}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{arm.type} // {arm.boreNo}</p>
                    </div>
                  </div>
                  <button onClick={() => removeItem('arms', arm._id)} className="text-slate-300 hover:text-red-600"><X size={18}/></button>
                </div>
              ))}

              {[...selectedItems.ammunition, ...selectedItems.munitions].map(item => {
                const type = selectedItems.ammunition.includes(item) ? 'ammo' : 'munition';
                const key = `${type}_${item._id}`;
                return (
                  <div key={item._id} className="flex items-center justify-between bg-white border-2 border-slate-100 p-4">
                    <div className="flex items-center gap-4">
                      {type === 'ammo' ? <Package className="text-slate-400" size={18} /> : <Zap className="text-slate-400" size={18} />}
                      <span className="text-xs font-black uppercase">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center bg-slate-900 text-white rounded-sm overflow-hidden">
                        <button onClick={() => updateQuantity(key, -1, item.availableCount)} className="p-2 hover:bg-slate-700"><Minus size={14}/></button>
                        <span className="w-12 text-center text-xs font-black">{quantities[key] || 1}</span>
                        <button onClick={() => updateQuantity(key, 1, item.availableCount)} className="p-2 hover:bg-slate-700"><Plus size={14}/></button>
                      </div>
                      <button onClick={() => removeItem(type === 'ammo' ? 'ammunition' : 'munitions', item._id)} className="text-slate-300 hover:text-red-600"><X size={18}/></button>
                    </div>
                  </div>
                )
              })}

              {Object.values(selectedItems).every(arr => arr.length === 0) && (
                <div className="py-12 text-center border-2 border-dashed border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Items in Queue</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN SUMMARY */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-slate-900 text-white p-8 sticky top-28 shadow-2xl border-b-8 border-red-600">
            <h3 className="text-sm font-black uppercase italic tracking-[0.2em] mb-8 pb-4 border-b border-slate-800">Final Manifest</h3>
            <div className="space-y-6 mb-12">
              <div className="flex justify-between items-center text-[11px] font-bold uppercase text-slate-500">
                <span>Total Weapons</span>
                <span className="text-white font-black text-lg">{selectedItems.arms.length}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-bold uppercase text-slate-500">
                <span>Consumables</span>
                <span className="text-white font-black text-lg">{selectedItems.ammunition.length + selectedItems.munitions.length}</span>
              </div>
            </div>

            <button 
              onClick={() => setShowConfirmModal(true)}
              disabled={!selectedOfficer || outstandingItems.length > 0 || Object.values(selectedItems).every(arr => arr.length === 0)}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-800 disabled:text-slate-600 text-white py-5 text-xs font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-xl"
            >
              <ArrowUpCircle size={20} /> Authorize Issue
            </button>
          </div>
        </div>
      </div>

      <OfficerHistoryModal officer={selectedOfficer} open={showHistory} onClose={() => setShowHistory(false)} />

      {/* MODALS */}
      {showKGIDModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white w-full max-w-md shadow-2xl border-t-8 border-slate-900">
            <div className="p-8">
              <h3 className="text-sm font-black uppercase italic mb-6 border-b-2 border-slate-100 pb-4">Biometric Verification</h3>
              <div className="mb-8">
                <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block">Officer KGID Number</label>
                <input 
                  autoFocus
                  type="text"
                  value={kgidInput}
                  onChange={(e) => setKgidInput(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 p-4 font-black uppercase tracking-widest text-lg focus:border-slate-900 outline-none"
                  placeholder="EX: KGID12345"
                />
              </div>
              <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-slate-200 bg-slate-50 rounded-lg relative overflow-hidden">
                {isScanning && <div className="absolute top-0 w-full h-1 bg-blue-500 animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_15px_#3b82f6]"></div>}
                <Fingerprint className={`mb-4 ${isScanning ? 'text-blue-500 scale-110' : 'text-slate-300'}`} size={64} />
                <p className="text-[9px] font-black uppercase text-slate-400">
                  {isScanning ? 'Scanning Pattern...' : 'Waiting for Scanner...'}
                </p>
              </div>
              <div className="mt-8 flex gap-4">
                <button onClick={() => setShowKGIDModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-slate-400 border border-slate-200">Cancel</button>
                <button onClick={handleKGIDSubmit} className="flex-1 bg-slate-900 text-white py-4 text-[10px] font-black uppercase tracking-widest">Verify Finger</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg shadow-2xl border-t-8 border-red-600">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6 text-red-600">
                <AlertCircle size={32} />
                <h3 className="text-lg font-black uppercase italic">Final Authorization</h3>
              </div>
              
              <div className="bg-slate-50 p-6 border-2 border-slate-100 mb-6">
                <p className="text-xs font-bold text-slate-600 mb-4">You are about to issue equipment to:</p>
                <div className="flex items-center gap-4">
                   <div className="bg-slate-900 text-white p-2 text-xs font-black uppercase">{selectedOfficer.name}</div>
                   <div className="text-[10px] font-black uppercase text-slate-400">KGID: {selectedOfficer.kgidNo}</div>
                </div>
              </div>

              <div className="space-y-2 mb-8 max-h-40 overflow-y-auto pr-2">
                {selectedItems.arms.map(a => <div key={a._id} className="text-[10px] font-bold uppercase flex justify-between"><span>{a.registerNumber}</span> <span className="text-slate-400">WEAPON</span></div>)}
                {selectedItems.ammunition.map(a => <div key={a._id} className="text-[10px] font-bold uppercase flex justify-between"><span>{a.name} x{quantities[`ammo_${a._id}`]}</span> <span className="text-slate-400">AMMO</span></div>)}
                {selectedItems.munitions.map(m => <div key={m._id} className="text-[10px] font-bold uppercase flex justify-between"><span>{m.name} x{quantities[`munition_${m._id}`]}</span> <span className="text-slate-400">MUNITION</span></div>)}
              </div>

              <div className="flex gap-4">
                <button 
                  disabled={isSubmitting} 
                  onClick={() => setShowConfirmModal(false)} 
                  className="flex-1 py-4 text-[10px] font-black uppercase text-slate-400 border border-slate-200"
                >
                  Back
                </button>
                <button 
                  disabled={isSubmitting} 
                  onClick={handleFinalIssue} 
                  className="flex-1 bg-red-600 text-white py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Confirm & Log'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0% { top: 0% }
          50% { top: 100% }
          100% { top: 0% }
        }
      `}</style>
    </div>
  )
}

export default IssueItems