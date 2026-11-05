import React, { useState, useEffect } from 'react'
import { transactionsAPI } from '../utils/api'
import { toast } from 'react-toastify'
import { 
  Search, Eye, ArrowUpCircle, ArrowDownCircle,
  User, Database, ChevronLeft, ChevronRight,
  Crosshair, Box, X, ExternalLink, Download,
  Paperclip, FileWarning, AlertCircle, File, 
  ShieldAlert,Zap
} from 'lucide-react'

const Transactions = () => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const response = await transactionsAPI.getAll()
      const data = response.data?.data || response.data || []
      setTransactions(data)
    } catch (error) {
      console.error('API Error:', error)
      toast.error('CRITICAL: DATABASE LINK FAILURE')
    } finally {
      setLoading(false)
    }
  }

  const getTransactionTypeStyle = (type) => {
    return type === 'issue' 
      ? 'bg-blue-500/10 text-blue-600 border-blue-200' 
      : 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
  }

  const getStatusStyle = (status) => {
    switch(status?.toLowerCase()) {
      case 'open': return 'bg-amber-500 text-white'
      case 'completed': return 'bg-emerald-600 text-white'
      case 'closed': return 'bg-slate-600 text-white'
      default: return 'bg-slate-400 text-white'
    }
  }

  const filteredTransactions = transactions.filter(t => {
    const searchStr = searchTerm.toLowerCase()
    const matchesSearch = 
      t.officerId?.name?.toLowerCase().includes(searchStr) ||
      t.officerId?.kgidNo?.toLowerCase().includes(searchStr) ||
      t.officerId?.metalNo?.toLowerCase().includes(searchStr) ||
      t._id.toLowerCase().includes(searchStr)
    
    const matchesType = filterType === 'all' || t.transactionType === filterType
    const transDate = new Date(t.createdAt)
    const matchesDate = (!dateRange.start || transDate >= new Date(dateRange.start)) && 
                        (!dateRange.end || transDate <= new Date(dateRange.end))
    
    return matchesSearch && matchesType && matchesDate
  })

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)

  const downloadFile = async (filePath, fileName) => {
    try {
      const response = await transactionsAPI.downloadDocument(filePath)
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = fileName || 'REGISTRY_DOC'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      toast.error('Unable to download this document')
    }
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans flex flex-col">
      {/* COMMAND HEADER */}
      <header className="bg-slate-900 text-white p-4 lg:px-8 border-b-4 border-slate-700 flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-4">
          <div className="bg-slate-700 p-2 italic font-black text-xl text-white">LOG</div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tighter leading-none italic text-red-500">Master Transaction Archive</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Audit Mode // Data Access: Restricted</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <span className="hidden md:block text-[9px] font-bold text-slate-500 uppercase tracking-tighter text-right">System Status:<br/><span className="text-emerald-500">Online & Secure</span></span>
            <div className="h-8 w-[2px] bg-slate-700 hidden md:block mx-2"></div>
            <ShieldAlert className="text-red-500 animate-pulse" size={20}/>
        </div>
      </header>

      <main className="flex-1 p-6 lg:p-10 space-y-6 max-w-[1900px] mx-auto w-full">
        
        {/* TACTICAL SEARCH & FILTER BAR */}
        <div className="bg-white border border-slate-300 shadow-sm p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text" placeholder="FILTER BY PERSONNEL / KGID / METAL NO..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 text-[11px] font-black uppercase outline-none focus:border-slate-900 transition-all"
            />
          </div>
          
          <select
            value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-4 py-3 text-[11px] font-black uppercase outline-none focus:border-slate-900 appearance-none"
          >
            <option value="all">Category: All Transactions</option>
            <option value="issue">Category: Sign-Out (Issue)</option>
            <option value="return">Category: Sign-In (Return)</option>
          </select>
          
          <div className="md:col-span-2 flex items-center gap-2">
            <input type="date" value={dateRange.start} onChange={(e) => setDateRange(p=>({...p, start:e.target.value}))} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-[11px] font-black outline-none focus:border-slate-900" />
            <span className="text-slate-400 font-black text-[10px]">TO</span>
            <input type="date" value={dateRange.end} onChange={(e) => setDateRange(p=>({...p, end:e.target.value}))} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-[11px] font-black outline-none focus:border-slate-900" />
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="bg-white border border-slate-300 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-slate-100 p-3 border-b border-slate-300 flex justify-between items-center">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] flex items-center gap-2">
              <Database size={14}/> Central Registry Log
            </span>
            <span className="bg-slate-900 text-white text-[9px] font-black px-3 py-1 uppercase italic tracking-widest">
              {filteredTransactions.length} Records Loaded
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="px-4 py-4 text-left">Sl.No</th>
                  <th className="px-4 py-4 text-left">Rank</th>
                  <th className="px-4 py-4 text-left">Metal No</th>
                  <th className="px-4 py-4 text-left">KGID</th>
                  <th className="px-4 py-4 text-left">Officer Name</th>
                  <th className="px-4 py-4 text-left">Type</th>
                  <th className="px-4 py-4 text-left bg-slate-100/30">Arm Type</th>
                  <th className="px-2 py-4 text-center bg-slate-100/30">Qty</th>
                  <th className="px-4 py-4 text-left">Ammo Type</th>
                  <th className="px-2 py-4 text-center">Qty</th>
                  <th className="px-4 py-4 text-left bg-slate-100/30">Munition</th>
                  <th className="px-2 py-4 text-center bg-slate-100/30">Qty</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr><td colSpan="13" className="p-20 text-center font-black text-slate-400 italic">QUERYING SERVER DATABASE...</td></tr>
                ) : currentTransactions.map((t, idx) => {
                  const armTypes = t.issuedItems?.armoury?.map(a => a.type).join(', ') || '--';
                  const armQty = t.issuedItems?.armoury?.length || 0;
                  
                  // Logic to separate Ammo from Munitions (adjust key 'isMunition' as per your schema)
                  const ammoItems = t.issuedItems?.ammunition?.filter(a => a) || [];
                  const munitionItems = t.issuedItems?.munition?.filter(a => a) || [];

                  const ammoNames = ammoItems.map(a => a.name).join(', ') || '--';
                  const ammoCount = ammoItems.reduce((acc, curr) => acc + (curr.count || 0), 0) || 0;

                  const munitionNames = munitionItems.map(a => a.name).join(', ') || '--';
                  const munitionCount = munitionItems.reduce((acc, curr) => acc + (curr.count || 0), 0) || 0;
                  const hasDiscrepancy = (t.shortageDetails || []).some(item => Number(item.shortageQuantity || 0) > 0) || (t.transactionType === 'issue' && ['open', 'partial', 'overdue'].includes(t.status));

                  return (
                    <tr key={t._id} className={`${hasDiscrepancy ? 'bg-red-50/70 border-l-4 border-l-red-600' : 'bg-emerald-50/20 border-l-4 border-l-emerald-500'} hover:bg-slate-50/80 transition-all group`}>
                      <td className="px-4 py-4 font-mono text-[10px] font-black text-slate-400">{indexOfFirstItem + idx + 1}</td>
                      <td className="px-4 py-4 text-[10px] font-black text-red-600 uppercase">{t.officerId?.rank || '--'}</td>
                      <td className="px-4 py-4 text-[10px] font-black text-slate-900 uppercase">{t.officerId?.metalNo || '--'}</td>
                      <td className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase">{t.officerId?.kgidNo || '--'}</td>
                      <td className="px-4 py-4 font-black text-[11px] text-slate-900 uppercase">{t.officerId?.name}</td>
                      <td className="px-4 py-4">
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase border ${getTransactionTypeStyle(t.transactionType)}`}>
                          {t.transactionType}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[10px] font-bold text-slate-600  max-w-[100px] bg-slate-50/30 italic">{armTypes}</td>
                      <td className="px-2 py-4 text-center font-black text-[11px] bg-slate-50/30 text-blue-600">{armQty}</td>
                      <td className="px-4 py-4 text-[10px] font-bold text-slate-600  max-w-[100px] italic">{ammoNames}</td>
                      <td className="px-2 py-4 text-center font-black text-[11px] text-amber-600">{ammoCount}</td>
                      <td className="px-4 py-4 text-[10px] font-bold text-slate-600  max-w-[100px] italic bg-slate-50/30">{munitionNames}</td>
                      <td className="px-2 py-4 text-center font-black text-[11px] bg-slate-50/30 text-red-600">{munitionCount}</td>
                      <td className="px-4 py-4 text-right">
                        <button 
                            onClick={() => { setSelectedTransaction(t); setShowViewModal(true) }} 
                            className="bg-slate-900 text-white p-1.5 hover:bg-red-600 transition-all shadow-md active:scale-95"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-500 uppercase italic">
              Displaying {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredTransactions.length)} of {filteredTransactions.length} Logs
            </p>
            <div className="flex gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 border border-slate-300 bg-white hover:bg-slate-900 hover:text-white disabled:opacity-20 transition-all shadow-sm"><ChevronLeft size={16}/></button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 border border-slate-300 bg-white hover:bg-slate-900 hover:text-white disabled:opacity-20 transition-all shadow-sm"><ChevronRight size={16}/></button>
            </div>
          </div>
        </div>
      </main>

      {/* DETAILED RECORD MODAL */}
      {showViewModal && selectedTransaction && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-white border-t-[10px] border-red-600 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            
            <div className="sticky top-0 p-6 border-b border-slate-200 flex justify-between items-center bg-white z-20">
              <div>
                <h2 className="text-xl font-black italic uppercase text-slate-900 leading-none">Record Detail View</h2>
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] font-black bg-slate-900 text-white px-2 py-0.5">ID: {selectedTransaction._id}</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 border ${getTransactionTypeStyle(selectedTransaction.transactionType)}`}>{selectedTransaction.transactionType.toUpperCase()}</span>
                </div>
              </div>
              <button onClick={() => setShowViewModal(false)} className="bg-slate-900 text-white p-2 hover:bg-red-600 transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* OFFICER PROFILE CARD */}
              <div className="space-y-4">
                <div className="bg-slate-900 p-6 border-b-4 border-red-600 relative overflow-hidden group">
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-24 h-24 bg-slate-800 border-2 border-slate-700 flex items-center justify-center mb-4">
                        <User size={48} className="text-slate-600" />
                    </div>
                    <h3 className="text-white font-black uppercase text-center text-lg italic tracking-tight">{selectedTransaction.officerId?.name}</h3>
                    <p className="text-red-500 font-black text-[10px] uppercase tracking-widest mt-1">{selectedTransaction.officerId?.rank}</p>
                  </div>
                  <Zap className="absolute -bottom-4 -right-4 text-white/5 group-hover:text-white/10 transition-all" size={100} />
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 space-y-3">
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Metal Number</span>
                        <span className="text-[10px] font-black text-slate-900 uppercase">{selectedTransaction.officerId?.metalNo || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase">KGID Number</span>
                        <span className="text-[10px] font-black text-slate-900 uppercase">{selectedTransaction.officerId?.kgidNo}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Timestamp</span>
                        <span className="text-[10px] font-black text-slate-900 uppercase">{new Date(selectedTransaction.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Audit Status</span>
                        <span className="text-[10px] font-black text-emerald-600 uppercase italic">Authenticated</span>
                    </div>
                </div>
              </div>

              {/* ASSET DETAILS */}
              <div className="md:col-span-2 space-y-6">
                {/* ARMS TABLE */}
                <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase flex items-center gap-2 italic">
                        <Crosshair size={14} className="text-blue-600"/> Arms Manifest
                    </h4>
                    <div className="border border-slate-200 overflow-hidden">
                        <table className="w-full text-[10px] text-left">
                            <thead className="bg-slate-100 uppercase font-black">
                                <tr>
                                    <th className="px-4 py-2 border-r border-slate-200">Register No</th>
                                    <th className="px-4 py-2 border-r border-slate-200">Type</th>
                                    <th className="px-4 py-2">Butt No</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-bold uppercase">
                                {selectedTransaction.issuedItems?.armoury?.length > 0 ? selectedTransaction.issuedItems.armoury.map((arm, i) => (
                                    <tr key={i} className={arm.status === 'not_returned' ? 'bg-red-50 text-red-700' : 'bg-emerald-50/30'}>
                                        <td className="px-4 py-2 border-r border-slate-200 text-slate-900">{arm.registerNumber}</td>
                                        <td className="px-4 py-2 border-r border-slate-200 text-slate-600">{arm.type}</td>
                                        <td className="px-4 py-2 text-slate-900">{arm.buttNumber}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="3" className="px-4 py-3 text-center text-slate-300 italic">No arms recorded</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* AMMUNITION & MUNITIONS TABLE */}
                <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase flex items-center gap-2 italic">
                        <Box size={14} className="text-amber-600"/> Expendables Ammunitions
                    </h4>
                    <div className="border border-slate-200 overflow-hidden">
                        <table className="w-full text-[10px] text-left">
                            <thead className="bg-slate-100 uppercase font-black">
                                <tr>
                                    <th className="px-4 py-2 border-r border-slate-200">Item Name</th>
                                    <th className="px-4 py-2 border-r border-slate-200 text-center">Issued</th>
                                    <th className="px-4 py-2 border-r border-slate-200 text-center">Unused Returned</th>
                                    <th className="px-4 py-2 border-r border-slate-200 text-center">Consumed</th>
                                    <th className="px-4 py-2 border-r border-slate-200 text-center text-red-600">Empty Cases</th>
                                    <th className="px-4 py-2 text-center">Missing Cases</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-bold uppercase">
                                {selectedTransaction.issuedItems?.ammunition?.length > 0 ? selectedTransaction.issuedItems.ammunition.map((ammo, i) => (
                                    <tr key={i} className={Number(ammo.missingCasesCount || 0) > 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50/30'}>
                                        <td className="px-4 py-2 border-r border-slate-200 text-slate-900 flex items-center gap-2">
                                            {ammo.isMunition && <Zap size={10} className="text-red-500 fill-red-500"/>}
                                            {ammo.name}
                                        </td>
                                        <td className="px-4 py-2 border-r border-slate-200 text-center text-slate-600">{ammo.count}</td>
                                        <td className="px-4 py-2 border-r border-slate-200 text-center text-emerald-600">{ammo.returnedCount || 0}</td>
                                        <td className="px-4 py-2 border-r border-slate-200 text-center text-amber-700">{ammo.consumedCount || 0}</td>
                                        <td className="px-4 py-2 border-r border-slate-200 text-center text-red-600">{ammo.emptyCasesReturned || 0}</td>
                                        <td className="px-4 py-2 text-center text-red-700">{ammo.missingCasesCount || 0}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="6" className="px-4 py-3 text-center text-slate-300 italic">No ammunition recorded</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase flex items-center gap-2 italic">
                        <Box size={14} className="text-amber-600"/> Expendables Munitions
                    </h4>
                    <div className="border border-slate-200 overflow-hidden">
                        <table className="w-full text-[10px] text-left">
                            <thead className="bg-slate-100 uppercase font-black">
                                <tr>
                                    <th className="px-4 py-2 border-r border-slate-200">Item Name</th>
                                    <th className="px-4 py-2 border-r border-slate-200 text-center">Unused Returned</th>
                                    <th className="px-4 py-2 border-r border-slate-200 text-center">Consumed</th>
                                    <th className="px-4 py-2 border-r border-slate-200 text-center text-red-600">Empty Cases</th>
                                    <th className="px-4 py-2 text-center">Missing Cases</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-bold uppercase">
                                {selectedTransaction.issuedItems?.munition?.length > 0 ? selectedTransaction.issuedItems.munition.map((ammo, i) => (
                                    <tr key={i} className={Number(ammo.missingCasesCount || 0) > 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50/30'}>
                                        <td className="px-4 py-2 border-r border-slate-200 text-slate-900 flex items-center gap-2">
                                            {ammo.isMunition && <Zap size={10} className="text-red-500 fill-red-500"/>}
                                            {ammo.name}
                                        </td>
                                        <td className="px-4 py-2 border-r border-slate-200 text-center text-emerald-600">{ammo.returnedCount || 0}</td>
                                        <td className="px-4 py-2 border-r border-slate-200 text-center text-amber-700">{ammo.consumedCount || 0}</td>
                                        <td className="px-4 py-2 border-r border-slate-200 text-center text-red-600">{ammo.emptyCasesReturned || ammo.emptyCasesReturnedL || 0}</td>
                                        <td className="px-4 py-2 text-center text-red-700">{ammo.missingCasesCount || 0}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="4" className="px-4 py-3 text-center text-slate-300 italic">No munition recorded</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* DOCUMENT LINKS */}
                {selectedTransaction.returnDocuments?.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-slate-900 uppercase flex items-center gap-2 italic px-1">
                            <Paperclip size={14} className="text-blue-600"/> Attached Evidence & Documents
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {selectedTransaction.returnDocuments.map((doc, idx) => (
                                <div key={idx} className="border border-slate-200 p-3 bg-white hover:border-red-500 transition-all flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <File size={16} className="text-slate-400 group-hover:text-red-600 transition-colors"/>
                                        <p className="text-[10px] font-black text-slate-900 uppercase truncate max-w-[150px]">{doc.description || 'Record_Doc.pdf'}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => downloadFile(doc.filePath, doc.description)} className="bg-slate-900 text-white p-1.5 hover:bg-emerald-600 transition-all"><Download size={12}/></button>
                                        
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button 
                  onClick={() => setShowViewModal(false)} 
                  className="px-8 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-600 shadow-xl transition-all"
                >
                  Close Record
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Transactions