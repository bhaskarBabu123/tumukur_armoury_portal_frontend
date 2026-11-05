import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { AlertTriangle, Search, FileText, Download, Loader2, Shield, Package, Zap, CheckCircle2 } from 'lucide-react'
import { transactionsAPI } from '../utils/api'

const AccountabilityRegister = () => {
  const [transactions, setTransactions] = useState([])
  const [usedMaterials, setUsedMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    Promise.all([
      transactionsAPI.getAll({ type: 'return', limit: 200 }),
      transactionsAPI.getUsedMaterials({ limit: 200 })
    ])
      .then(([transactionResponse, usedResponse]) => {
        setTransactions(transactionResponse.data.data || [])
        setUsedMaterials(usedResponse.data.data || [])
      })
      .catch(error => toast.error(error.response?.data?.message || 'Unable to load accountability register'))
      .finally(() => setLoading(false))
  }, [])

  const records = useMemo(() => transactions.flatMap(transaction =>
    (transaction.shortageDetails || []).map((item, index) => ({
      id: `${transaction._id}-${index}`,
      transaction,
      item,
      officer: transaction.officerId || {}
    }))
  ).filter(record => {
    const term = search.toLowerCase()
    const text = `${record.officer.name || ''} ${record.officer.kgidNo || ''} ${record.officer.metalNo || ''} ${record.item.itemName || ''} ${record.item.itemType || ''} ${record.transaction.transactionNumber || ''}`.toLowerCase()
    return (!term || text.includes(term)) && (filter === 'all' || record.item.itemType === filter)
  }), [transactions, search, filter])

  const download = async (filePath, fileName) => {
    try {
      const response = await transactionsAPI.downloadDocument(filePath)
      const url = URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName || 'supporting-document'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('Unable to download supporting document')
    }
  }

  const typeIcon = type => type === 'armoury' ? <Shield size={15}/> : type === 'ammunition' ? <Package size={15}/> : <Zap size={15}/>

  return (
    <div className="space-y-6">
      <header className="bg-slate-900 text-white p-6 border-b-4 border-red-600">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-red-400" size={26}/>
          <div>
            <h1 className="text-xl font-black uppercase">Missing items & empty-case register</h1>
            <p className="text-[10px] text-slate-300 uppercase tracking-widest mt-1">Officer-wise discrepancy tracking · return reports · evidence documents</p>
          </div>
        </div>
      </header>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="border bg-red-50 border-red-200 p-4"><p className="text-[10px] font-black uppercase text-red-600">Open discrepancy records</p><p className="text-2xl font-black text-red-700">{records.length}</p></div>
        <div className="border bg-emerald-50 border-emerald-200 p-4"><p className="text-[10px] font-black uppercase text-emerald-700">Documents attached</p><p className="text-2xl font-black text-emerald-700">{records.filter(row => row.transaction.returnDocuments?.length).length}</p></div>
        <div className="border bg-slate-50 border-slate-200 p-4"><p className="text-[10px] font-black uppercase text-slate-500">Return transactions reviewed</p><p className="text-2xl font-black text-slate-900">{transactions.length}</p></div>
      </div>

      <div className="bg-white border p-4 grid md:grid-cols-3 gap-3">
        <div className="relative md:col-span-2">
          <Search size={16} className="absolute left-3 top-3 text-slate-400"/>
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search officer, KGID, metal number, item or transaction..." className="w-full border p-3 pl-10 text-xs"/>
        </div>
        <select value={filter} onChange={event => setFilter(event.target.value)} className="border p-3 text-xs font-bold uppercase">
          <option value="all">All item categories</option>
          <option value="armoury">Arms not returned</option>
          <option value="ammunition">Ammunition missing cases</option>
          <option value="munition">Munitions missing cases</option>
        </select>
      </div>

      <div className="bg-white border overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xs font-black uppercase">Discrepancy records</h2>
          <span className="text-[10px] font-black text-red-600">{records.length} RECORDS</span>
        </div>
        {loading ? <div className="py-16 text-center text-slate-400"><Loader2 className="animate-spin mx-auto mb-2"/>Loading register...</div> :
          records.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-slate-100 text-[9px] uppercase text-slate-500">
                  <tr><th className="p-3">Officer</th><th className="p-3">Item / Type</th><th className="p-3">Issued / Expected</th><th className="p-3">Received</th><th className="p-3">Missing</th><th className="p-3">Transaction / Date</th><th className="p-3">Report / Documents</th><th className="p-3">Status</th></tr>
                </thead>
                <tbody>
                  {records.map(record => {
                    const { item, transaction, officer } = record
                    const docs = transaction.returnDocuments || []
                    return (
                      <tr key={record.id} className="border-t bg-red-50/60 border-l-4 border-l-red-600">
                        <td className="p-3"><p className="text-xs font-black uppercase">{officer.name || 'Unknown'}</p><p className="text-[10px] text-slate-500">{officer.kgidNo || 'No KGID'} · {officer.metalNo || 'No metal no.'}</p></td>
                        <td className="p-3"><p className="text-xs font-black uppercase flex items-center gap-2">{typeIcon(item.itemType)}{item.itemName}</p><p className="text-[9px] text-slate-500 uppercase">{item.itemType}</p></td>
                        <td className="p-3 text-xs font-bold">{item.expectedQuantity ?? '—'}</td>
                        <td className="p-3 text-xs font-bold text-emerald-700">{item.returnedQuantity ?? 0}</td>
                        <td className="p-3 text-sm font-black text-red-700">{item.shortageQuantity ?? 0}</td>
                        <td className="p-3"><p className="text-[10px] font-black">{transaction.transactionNumber}</p><p className="text-[10px] text-slate-500">{new Date(transaction.createdAt).toLocaleString()}</p></td>
                        <td className="p-3">
                          <p className="text-[10px] text-slate-600 max-w-[180px]">{item.reason || transaction.returnRemarks?.join(' ') || 'No remarks recorded'}</p>
                          {docs.map((doc, index) => <button key={index} onClick={() => download(doc.filePath, doc.fileName)} className="mt-1 mr-1 text-[9px] font-bold text-blue-700 underline"><FileText size={11} className="inline mr-1"/>{doc.fileName || doc.description || 'Document'}</button>)}
                        </td>
                        <td className="p-3"><span className="px-2 py-1 bg-red-600 text-white text-[9px] font-black uppercase">Missing / Review</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : <div className="py-16 text-center text-sm text-emerald-700"><CheckCircle2 className="mx-auto mb-2"/>No matching missing-item records found.</div>
        }
      </div>
      <div className="bg-white border overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-xs font-black uppercase">Empty-case / consumed-material register</h2>
          <p className="text-[10px] text-slate-500 mt-1">Separate record of consumed quantities, cases received and cases not received.</p>
        </div>
        {loading ? <div className="p-8 text-center text-slate-400">Loading...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
              <thead className="bg-slate-100 text-[9px] uppercase text-slate-500"><tr><th className="p-3">Officer</th><th className="p-3">Item</th><th className="p-3">Category</th><th className="p-3">Consumed</th><th className="p-3">Empty cases received</th><th className="p-3">Cases missing</th><th className="p-3">Date / Report</th></tr></thead>
              <tbody>
                {usedMaterials.map(row => (
                  <tr key={row._id} className={`border-t ${Number(row.missingCasesCount || 0) > 0 ? 'bg-red-50 border-l-4 border-l-red-600' : 'bg-emerald-50/40 border-l-4 border-l-emerald-500'}`}>
                    <td className="p-3"><p className="text-xs font-black uppercase">{row.officerId?.name || 'Unknown'}</p><p className="text-[10px] text-slate-500">{row.officerId?.metalNo || ''}</p></td>
                    <td className="p-3 text-xs font-bold uppercase">{row.itemName}</td>
                    <td className="p-3 text-[10px] uppercase">{row.itemType}</td>
                    <td className="p-3 text-xs font-black">{row.consumedCount}</td>
                    <td className="p-3 text-xs font-black text-emerald-700">{row.emptyCasesReceived}</td>
                    <td className={`p-3 text-xs font-black ${Number(row.missingCasesCount || 0) ? 'text-red-700' : 'text-emerald-700'}`}>{row.missingCasesCount || 0}</td>
                    <td className="p-3 text-[10px] text-slate-500">{new Date(row.createdAt).toLocaleString()}<p>{row.remarks || ''}</p></td>
                  </tr>
                ))}
                {!usedMaterials.length && <tr><td colSpan="7" className="p-8 text-center text-slate-400">No consumed-material or empty-case entries recorded.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[10px] text-slate-500">This register displays discrepancies recorded in return transactions. A submitted report is evidence attached to the record; it does not itself mark a missing item as approved or resolved.</p>
    </div>
  )
}

export default AccountabilityRegister
