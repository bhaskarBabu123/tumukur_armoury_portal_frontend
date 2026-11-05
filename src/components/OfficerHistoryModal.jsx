import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { X, History, FileText, Download, Loader2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { transactionsAPI } from '../utils/api'

const OfficerHistoryModal = ({ officer, open, onClose }) => {
  const [tab, setTab] = useState('history')
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState('')

  useEffect(() => {
    if (!open || !officer?._id) return
    let active = true
    setLoading(true)
    transactionsAPI.getByOfficer(officer._id)
      .then(response => {
        if (active) setHistory(response.data.data || [])
      })
      .catch(error => toast.error(error.response?.data?.message || 'Unable to load officer history'))
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [open, officer?._id])

  const documents = useMemo(() => history.flatMap(transaction =>
    (transaction.returnDocuments || []).map(document => ({
      ...document,
      transactionNumber: transaction.transactionNumber,
      transactionDate: transaction.createdAt,
      transactionId: transaction._id
    }))
  ), [history])

  const download = async doc => {
    setDownloading(doc.filePath)
    try {
      const response = await transactionsAPI.downloadDocument(doc.filePath)
      const url = URL.createObjectURL(response.data)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = doc.fileName || doc.description || 'supporting-document'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to download document')
    } finally {
      setDownloading('')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/70 flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden bg-white shadow-2xl flex flex-col">
        <div className="p-5 border-b flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black uppercase">Officer issue & return history</h2>
            <p className="text-xs text-slate-500 mt-1">
              {officer?.rank} {officer?.name} · KGID {officer?.kgidNo || 'N/A'} · Metal {officer?.metalNo || 'N/A'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-red-50" aria-label="Close history"><X /></button>
        </div>

        <div className="px-5 pt-4 flex gap-2 border-b">
          <button onClick={() => setTab('history')} className={`px-4 py-2 text-xs font-black uppercase border-b-2 ${tab === 'history' ? 'border-red-600 text-red-700' : 'border-transparent text-slate-400'}`}>
            <History size={14} className="inline mr-2" /> Transactions ({history.length})
          </button>
          <button onClick={() => setTab('documents')} className={`px-4 py-2 text-xs font-black uppercase border-b-2 ${tab === 'documents' ? 'border-red-600 text-red-700' : 'border-transparent text-slate-400'}`}>
            <FileText size={14} className="inline mr-2" /> Documents ({documents.length})
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {loading ? (
            <div className="py-16 text-center text-slate-400"><Loader2 className="animate-spin mx-auto mb-2" />Loading history...</div>
          ) : tab === 'history' ? (
            history.length ? (
              <div className="space-y-3">
                {history.map(transaction => {
                  const isIssue = transaction.transactionType === 'issue'
                  const arms = transaction.issuedItems?.armoury || []
                  const ammo = transaction.issuedItems?.ammunition || []
                  const munitions = transaction.issuedItems?.munition || []
                  return (
                    <article key={transaction._id} className={`border-l-4 border p-4 ${isIssue ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
                      <div className="flex flex-wrap justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {isIssue ? <ArrowUpCircle className="text-red-600" /> : <ArrowDownCircle className="text-emerald-600" />}
                          <div>
                            <p className="text-sm font-black uppercase">{transaction.transactionNumber} · {transaction.transactionType}</p>
                            <p className="text-[10px] text-slate-400">{new Date(transaction.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        <span className={`h-fit px-2 py-1 text-[10px] font-black uppercase ${transaction.status === 'closed' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{transaction.status}</span>
                      </div>
                      <div className="mt-3 grid sm:grid-cols-3 gap-2 text-xs">
                        <div className="bg-slate-50 p-2"><b>Arms:</b> {arms.map(item => item.registerNumber || item.type).join(', ') || '—'}</div>
                        <div className="bg-slate-50 p-2"><b>Ammunition:</b> {ammo.map(item => `${item.name} (${isIssue ? item.count : `returned ${item.returnedCount || 0}, used ${item.consumedCount || 0}`})`).join('; ') || '—'}</div>
                        <div className="bg-slate-50 p-2"><b>Munitions:</b> {munitions.map(item => `${item.name} (${isIssue ? item.count : `returned ${item.returnedCount || 0}, used ${item.consumedCount || 0}`})`).join('; ') || '—'}</div>
                      </div>
                      {transaction.returnRemarks?.length > 0 && <p className="mt-2 text-xs text-slate-600"><b>Remarks:</b> {transaction.returnRemarks.join(' · ')}</p>}
                      {transaction.shortageDetails?.length > 0 && (
                        <div className="mt-2 bg-red-50 text-red-700 p-2 text-xs">
                          <b>Discrepancies:</b> {transaction.shortageDetails.map(item => `${item.itemName}: ${item.shortageQuantity} missing`).join('; ')}
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            ) : <p className="py-12 text-center text-sm text-slate-400">No issue or return history found for this officer.</p>
          ) : (
            documents.length ? (
              <div className="grid md:grid-cols-2 gap-3">
                {documents.map((doc, index) => (
                  <div key={`${doc.transactionId}-${doc.filePath}-${index}`} className="border p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-black truncate">{doc.fileName || doc.description || 'Supporting document'}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{doc.transactionNumber} · {new Date(doc.transactionDate).toLocaleString()}</p>
                    </div>
                    <button onClick={() => download(doc)} disabled={downloading === doc.filePath} className="shrink-0 px-3 py-2 bg-slate-900 text-white text-[10px] font-bold uppercase disabled:opacity-50">
                      {downloading === doc.filePath ? <Loader2 size={14} className="animate-spin" /> : <><Download size={13} className="inline mr-1" /> Download</>}
                    </button>
                  </div>
                ))}
              </div>
            ) : <p className="py-12 text-center text-sm text-slate-400">No supporting documents are recorded for this officer.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default OfficerHistoryModal
