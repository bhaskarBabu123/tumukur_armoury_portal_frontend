
import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import {
  ArrowDownCircle, Shield, Package, Zap, Upload, FileText,
  RefreshCw, Loader2, AlertTriangle, UserCircle, Fingerprint,
  X, History, CheckCircle2, Phone, BadgeCheck
} from 'lucide-react'

import { officersAPI, transactionsAPI } from '../utils/api'
import { useFingerprint } from '../contexts/FingerprintContext'
import OfficerHistoryModal from '../components/OfficerHistoryModal'

const API_ROOT = (import.meta.env.VITE_API_URL || 'https://main-armoury-portal-backend.onrender.com/api')
  .replace(/\/api\/?$/, '')

const PROFILE_PLACEHOLDER = 'https://via.placeholder.com/100?text=OFFICER'

const ReturnItems = () => {
  const { captureFinger, verifyFinger, isScanning } = useFingerprint()

  const [officers, setOfficers] = useState([])
  const [selectedOfficerId, setSelectedOfficerId] = useState('')
  const [selectedOfficer, setSelectedOfficer] = useState(null)

  const [items, setItems] = useState([])
  const [selected, setSelected] = useState({})
  const [quantities, setQuantities] = useState({})
  const [consumed, setConsumed] = useState({})
  const [emptyCases, setEmptyCases] = useState({})
  const [armActions, setArmActions] = useState({})
  const [armReasons, setArmReasons] = useState({})

  const [documents, setDocuments] = useState([])
  const [remarks, setRemarks] = useState('')

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // KGID and fingerprint verification
  const [showKGIDModal, setShowKGIDModal] = useState(false)
  const [kgidInput, setKgidInput] = useState('')
  const [verifyingFingerprint, setVerifyingFingerprint] = useState(false)

  const [showHistory, setShowHistory] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Load officer directory
  useEffect(() => {
    officersAPI.getAll({ limit: 500 })
      .then(response => {
        setOfficers(response.data.data || [])
      })
      .catch(() => {
        toast.error('Unable to load officer directory')
      })
  }, [])

  // Clear return form
  const clearReturnForm = () => {
    setItems([])
    setSelected({})
    setQuantities({})
    setConsumed({})
    setEmptyCases({})
    setArmActions({})
    setArmReasons({})
    setDocuments([])
    setRemarks('')
  }

  // Reset the complete return session
  const reset = () => {
    setSelectedOfficerId('')
    setSelectedOfficer(null)

    clearReturnForm()

    setKgidInput('')
    setShowKGIDModal(false)
    setShowConfirmModal(false)
    setShowHistory(false)
  }

  // Fetch outstanding items for officer
  const fetchOutstanding = async officerId => {
    if (!officerId) return

    setLoading(true)
    clearReturnForm()

    try {
      const response = await transactionsAPI.getOutstandingByOfficer(officerId)

      const officer = response.data.officer

      setSelectedOfficer(officer)
      setSelectedOfficerId(officer?._id || officerId)

      const outstanding = response.data.data || []

      setItems(outstanding)

      // Select all outstanding items by default
      setSelected(
        Object.fromEntries(
          outstanding.map(item => [item.key, true])
        )
      )

      // Default consumables to full outstanding quantity
      setQuantities(
        Object.fromEntries(
          outstanding
            .filter(item => item.itemType !== 'armoury')
            .map(item => [item.key, Number(item.outstandingCount || 0)])
        )
      )

      setConsumed(
        Object.fromEntries(
          outstanding
            .filter(item => item.itemType !== 'armoury')
            .map(item => [item.key, 0])
        )
      )

      setEmptyCases(
        Object.fromEntries(
          outstanding
            .filter(item => item.itemType !== 'armoury')
            .map(item => [item.key, 0])
        )
      )

      if (!outstanding.length) {
        toast.info('No outstanding issued items for this officer')
      }
    } catch (error) {
      setSelectedOfficer(null)
      setSelectedOfficerId('')

      toast.error(
        error.response?.data?.message ||
        'Unable to fetch outstanding items'
      )
    } finally {
      setLoading(false)
    }
  }

  // KGID and fingerprint verification
  const handleKGIDSubmit = async () => {
    const normalizedKGID = kgidInput.trim().toUpperCase()

    if (!normalizedKGID) {
      toast.error('Enter officer KGID')
      return
    }

    const officer = officers.find(
      item =>
        String(item.kgidNo || '').trim().toUpperCase() === normalizedKGID
    )

    if (!officer) {
      toast.error('KGID Not Found')
      return
    }

    if (!officer.fingerprintData) {
      toast.error(
        'No fingerprint is registered for this officer. Use manual officer selection.'
      )
      return
    }

    setVerifyingFingerprint(true)

    try {
      const result = await captureFinger()

      if (!result?.success || !result.data?.template) {
        toast.error(result?.message || 'Unable to capture fingerprint')
        return
      }

      const verifyResult = await verifyFinger(
        result.data.template,
        officer.fingerprintData
      )

      if (verifyResult?.success && verifyResult.matched) {
        setShowKGIDModal(false)
        setKgidInput('')

        await fetchOutstanding(officer._id)

        toast.success(`Access Granted: ${officer.name}`)
      } else {
        toast.error('Biometric Mismatch')
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        error.message ||
        'Biometric Scanner Error'
      )
    } finally {
      setVerifyingFingerprint(false)
    }
  }

  // Selected item lines
  const selectedRows = useMemo(
    () => items.filter(item => selected[item.key]),
    [items, selected]
  )

  // Documents required for discrepancies or consumption
  const needsDocuments = items.some(item => {
    if (!selected[item.key]) return true

    if (item.itemType === 'armoury') {
      return armActions[item.key] === 'not_returned'
    }

    const processed =
      Number(quantities[item.key] || 0) +
      Number(consumed[item.key] || 0)

    return (
      processed < Number(item.outstandingCount || 0) ||
      Number(consumed[item.key] || 0) > 0 ||
      Number(emptyCases[item.key] || 0) > 0
    )
  })

  // Number input validation
  const updateNumber = (setter, key, value, max) => {
    const number = value === '' ? '' : Number(value)

    if (
      number !== '' &&
      (!Number.isInteger(number) || number < 0 || number > max)
    ) {
      return
    }

    setter(previous => ({
      ...previous,
      [key]: number
    }))
  }

  // Return validation
  const validate = () => {
    if (!selectedOfficer) {
      toast.error('Identify an officer first')
      return false
    }

    if (!selectedRows.length) {
      toast.error('Select at least one item to process')
      return false
    }

    for (const item of selectedRows) {
      if (item.itemType === 'armoury') {
        if (
          armActions[item.key] === 'not_returned' &&
          !String(armReasons[item.key] || '').trim()
        ) {
          toast.error(`Enter the reason for not returning ${item.name}`)
          return false
        }

        continue
      }

      const unused = Number(quantities[item.key] || 0)
      const used = Number(consumed[item.key] || 0)
      const cases = Number(emptyCases[item.key] || 0)

      if (unused + used < 1) {
        toast.error(
          `Enter unused returned or consumed quantity for ${item.name}`
        )
        return false
      }

      if (unused + used > Number(item.outstandingCount)) {
        toast.error(
          `Total exceeds outstanding quantity for ${item.name}`
        )
        return false
      }

      if (cases > used) {
        toast.error(
          `Empty cases cannot exceed consumed quantity for ${item.name}`
        )
        return false
      }
    }

    if (needsDocuments && !documents.length) {
      toast.error(
        'Supporting report/document is mandatory for consumption, empty cases or arms not returned'
      )
      return false
    }

    if (needsDocuments && !remarks.trim()) {
      toast.error(
        'Enter remarks explaining the usage or non-return'
      )
      return false
    }

    return true
  }

  // Save return transaction
  const saveReturn = async () => {
    if (!selectedOfficer) return

    setSubmitting(true)

    try {
      const returnItems = selectedRows.map(item => {
        if (item.itemType === 'armoury') {
          return {
            issueTransactionId: item.issueTransactionId,
            itemId: item.itemId,
            itemType: 'armoury',
            action: armActions[item.key] || 'returned',
            reason: armReasons[item.key] || ''
          }
        }

        return {
          issueTransactionId: item.issueTransactionId,
          itemId: item.itemId,
          itemType: item.itemType,
          unusedReturnedCount: Number(quantities[item.key] || 0),
          consumedCount: Number(consumed[item.key] || 0),
          emptyCasesReturned: Number(emptyCases[item.key] || 0)
        }
      })

      await transactionsAPI.return({
        officerId: selectedOfficer._id,
        returnItems,
        remarks,
        documents
      })

      toast.success(
        'Return saved successfully. Ready for the next officer.'
      )

      // Close confirmation modal
      setShowConfirmModal(false)

      // IMPORTANT: Clear the previous officer session
      // Do not reload the same officer's outstanding items
      reset()

    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Return failed'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const submitReturn = () => {
    if (!validate()) return
    setShowConfirmModal(true)
  }

  // Manual officer selection
  const handleManualOfficerChange = event => {
    const officerId = event.target.value

    if (officerId) {
      fetchOutstanding(officerId)
    } else {
      setSelectedOfficerId('')
      setSelectedOfficer(null)
      clearReturnForm()
    }
  }

  // Item icon
  const itemIcon = type => {
    if (type === 'armoury') return <Shield size={18} />
    if (type === 'ammunition') return <Package size={18} />
    return <Zap size={18} />
  }

  // Officer profile photo URL
  const getProfilePicture = officer => {
    if (!officer?.profilePicture) return PROFILE_PLACEHOLDER

    return `${API_ROOT}/uploads/profiles/${officer.profilePicture}`
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8 text-slate-900">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b-2 border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tight">
            Inbound Equipment <span className="text-red-600">Return</span>
          </h1>

          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Partial returns • Consumption ledger • Empty-case register
          </p>
        </div>

        <button
          onClick={reset}
          disabled={submitting || loading || verifyingFingerprint}
          className="px-5 py-3 bg-slate-200 text-xs font-black uppercase disabled:opacity-50"
        >
          Reset session
        </button>
      </div>

      {/* Officer Verification */}
      <section className="bg-white border-2 border-slate-200 p-5 mb-4">

        <div className="flex items-center gap-2 mb-3">
          <Fingerprint size={18} className="text-red-600" />
          <h2 className="text-xs font-black uppercase">
            Officer verification
          </h2>
        </div>

        <p className="text-xs text-slate-500 mb-3">
          Enter the officer KGID first. The registered fingerprint will
          then be verified before loading outstanding items.
        </p>

        <button
          onClick={() => setShowKGIDModal(true)}
          disabled={
            loading ||
            submitting ||
            isScanning ||
            verifyingFingerprint
          }
          className="w-full md:w-auto px-5 py-3 bg-red-600 text-white text-xs font-black uppercase flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Fingerprint size={16} />
          Verify with KGID & fingerprint
        </button>

        {/* Officer Profile Card */}
        {selectedOfficer && (
          <div className="mt-5 border-2 border-slate-200 bg-white shadow-sm overflow-hidden">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5">

              <div className="flex items-center gap-5">

                {/* Profile Photo */}
                <div className="relative shrink-0">
                  <img
                    src={getProfilePicture(selectedOfficer)}
                    alt="Officer Profile"
                    className="w-24 h-24 rounded-sm object-cover border-2 border-slate-900 shadow-md"
                    onError={event => {
                      event.currentTarget.onerror = null
                      event.currentTarget.src = PROFILE_PLACEHOLDER
                    }}
                  />

                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1 rounded-full">
                    <CheckCircle2 size={17} />
                  </div>
                </div>

                {/* Officer Details */}
                <div className="min-w-0">

                  <h2 className="text-xl font-black uppercase italic text-slate-900">
                    {selectedOfficer.name}
                  </h2>

                  <p className="text-[11px] font-black text-red-600 uppercase tracking-widest mt-1">
                    {selectedOfficer.rank || 'OFFICER'} // KGID: {selectedOfficer.kgidNo || 'N/A'}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-3">

                    <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 border border-slate-200">
                      METAL: {selectedOfficer.metalNo || 'N/A'}
                    </span>

                    <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 border border-slate-200">
                      DEPT: {selectedOfficer.department || 'ARMED RESERVE'}
                    </span>

                    {selectedOfficer.phone && (
                      <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 border border-slate-200 flex items-center gap-1">
                        <Phone size={11} />
                        {selectedOfficer.phone}
                      </span>
                    )}

                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-1 border border-emerald-200 flex items-center gap-1">
                      <BadgeCheck size={12} />
                      IDENTIFIED
                    </span>

                  </div>
                </div>
              </div>

              {/* Officer History */}
              <button
                onClick={() => setShowHistory(true)}
                className="px-5 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-2"
              >
                <History size={15} />
                View Issue / Return History
              </button>

            </div>

            <div className="bg-slate-900 text-white px-5 py-2 text-[10px] font-black uppercase tracking-widest">
              Officer identified successfully · Outstanding equipment return
            </div>

          </div>
        )}

      </section>

      {/* Manual Officer Selection */}
      <section className="bg-white border-2 border-slate-200 p-5 mb-6">

        <div className="flex items-center gap-2 mb-3">
          <UserCircle size={18} className="text-slate-500" />
          <h2 className="text-xs font-black uppercase">
            Manual officer selection (fallback)
          </h2>
        </div>

        <div className="flex flex-col md:flex-row gap-3">

          <select
            value={selectedOfficerId}
            onChange={handleManualOfficerChange}
            disabled={loading || submitting}
            className="flex-1 border-2 border-slate-200 bg-white p-3 text-sm font-bold disabled:opacity-50"
          >
            <option value="">
              Choose officer — name / KGID / metal number
            </option>

            {officers.map(officer => (
              <option key={officer._id} value={officer._id}>
                {officer.name} — {officer.kgidNo || 'No KGID'} — {officer.metalNo || 'No metal number'}
              </option>
            ))}
          </select>

          <button
            onClick={() =>
              selectedOfficerId && fetchOutstanding(selectedOfficerId)
            }
            disabled={!selectedOfficerId || loading || submitting}
            className="px-5 py-3 bg-slate-900 text-white text-xs font-black uppercase flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={14} />
            Refresh outstanding
          </button>

        </div>

        <p className="mt-2 text-[10px] text-slate-400">
          Use this fallback when fingerprint verification is unavailable
          or the officer has no registered fingerprint.
        </p>

      </section>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Outstanding Items */}
        <section className="xl:col-span-2 bg-white border-2 border-slate-200 p-5">

          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs font-black uppercase flex items-center gap-2">
              <ArrowDownCircle size={17} className="text-red-600" />
              Outstanding issued items
            </h2>

            <span className="bg-slate-900 text-white px-3 py-1 text-[10px] font-black">
              {items.length} PENDING LINES
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <Loader2 className="animate-spin mx-auto mb-2" />
              Loading officer ledger...
            </div>
          ) : !selectedOfficer ? (
            <div className="py-20 text-center text-xs font-bold uppercase text-slate-300">
              Verify or select an officer to view issued items
            </div>
          ) : !items.length ? (
            <div className="py-20 text-center text-sm font-bold text-emerald-700">
              No outstanding items. All recorded issue quantities are accounted for.
            </div>
          ) : (
            <div className="space-y-3">

              {items.map(item => (
                <article
                  key={item.key}
                  className={`border-2 p-4 ${
                    selected[item.key]
                      ? 'border-red-500 bg-red-50/30'
                      : 'border-slate-100'
                  }`}
                >

                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">

                    <label className="flex items-start gap-3 cursor-pointer">

                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 accent-red-600"
                        checked={!!selected[item.key]}
                        onChange={event =>
                          setSelected(previous => ({
                            ...previous,
                            [item.key]: event.target.checked
                          }))
                        }
                      />

                      <span className="text-slate-500 mt-0.5">
                        {itemIcon(item.itemType)}
                      </span>

                      <span>
                        <span className="block text-sm font-black uppercase">
                          {item.name}
                        </span>

                        <span className="block text-[10px] font-bold uppercase text-slate-400">
                          {item.itemType} · Issue {item.issueTransactionNumber} · {new Date(item.issueDate).toLocaleDateString()}
                        </span>

                        {item.itemType !== 'armoury' && (
                          <span className="block mt-1 text-xs font-black text-red-600">
                            Issued {item.issuedCount} · Previously returned {item.returnedCount} · Consumed {item.consumedCount} · Outstanding {item.outstandingCount}
                          </span>
                        )}
                      </span>

                    </label>

                    {item.itemType === 'armoury' ? (
                      <span className="text-[10px] font-black text-amber-700 uppercase">
                        Physical return required
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-slate-500 uppercase">
                        Process any quantity now
                      </span>
                    )}

                  </div>

                  {/* Armoury Return */}
                  {selected[item.key] && item.itemType === 'armoury' && (
                    <div className="mt-4 ml-7 grid gap-3 md:grid-cols-2">

                      <select
                        value={armActions[item.key] || 'returned'}
                        onChange={event =>
                          setArmActions(previous => ({
                            ...previous,
                            [item.key]: event.target.value
                          }))
                        }
                        className="border border-slate-300 p-2 text-xs font-bold"
                      >
                        <option value="returned">
                          Physically returned now
                        </option>

                        <option value="not_returned">
                          Not returned — submit report
                        </option>
                      </select>

                      {armActions[item.key] === 'not_returned' && (
                        <input
                          value={armReasons[item.key] || ''}
                          onChange={event =>
                            setArmReasons(previous => ({
                              ...previous,
                              [item.key]: event.target.value
                            }))
                          }
                          placeholder="Reason for non-return"
                          className="border border-slate-300 p-2 text-xs"
                        />
                      )}

                    </div>
                  )}

                  {/* Ammunition and Munition Return */}
                  {selected[item.key] && item.itemType !== 'armoury' && (
                    <div className="mt-4 ml-7 grid grid-cols-1 sm:grid-cols-3 gap-3">

                      <label className="text-[10px] font-black uppercase text-slate-500">
                        Unused returned

                        <input
                          type="number"
                          min="0"
                          max={item.outstandingCount}
                          value={quantities[item.key] ?? 0}
                          onChange={event =>
                            updateNumber(
                              setQuantities,
                              item.key,
                              event.target.value,
                              item.outstandingCount
                            )
                          }
                          className="mt-1 block w-full border border-slate-300 p-2 text-sm font-bold text-slate-900"
                        />
                      </label>

                      <label className="text-[10px] font-black uppercase text-slate-500">
                        Used / consumed

                        <input
                          type="number"
                          min="0"
                          max={item.outstandingCount}
                          value={consumed[item.key] ?? 0}
                          onChange={event =>
                            updateNumber(
                              setConsumed,
                              item.key,
                              event.target.value,
                              item.outstandingCount
                            )
                          }
                          className="mt-1 block w-full border border-slate-300 p-2 text-sm font-bold text-slate-900"
                        />
                      </label>

                      <label className="text-[10px] font-black uppercase text-slate-500">
                        Empty cases returned

                        <input
                          type="number"
                          min="0"
                          max={Number(consumed[item.key] || 0)}
                          value={emptyCases[item.key] ?? 0}
                          onChange={event =>
                            updateNumber(
                              setEmptyCases,
                              item.key,
                              event.target.value,
                              Number(consumed[item.key] || 0)
                            )
                          }
                          className="mt-1 block w-full border border-slate-300 p-2 text-sm font-bold text-slate-900"
                        />
                      </label>

                      <p className="sm:col-span-3 text-[10px] text-slate-500">
                        Unaccounted quantity stays outstanding for the next
                        return. Empty cases are stored separately and never
                        added to usable stock. Cases not received = consumed
                        minus empty cases returned.
                      </p>

                    </div>
                  )}

                </article>
              ))}

            </div>
          )}

        </section>

        {/* Supporting Documents and Stock Handling */}
        <aside className="space-y-5">

          <section className="bg-white border-2 border-slate-200 p-5">

            <h2 className="text-xs font-black uppercase flex items-center gap-2 mb-4">
              <FileText size={17} className="text-red-600" />
              Supporting documents
            </h2>

            {needsDocuments && (
              <div className="mb-4 bg-amber-50 border border-amber-200 p-3 text-[11px] font-bold text-amber-800 flex gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                Required because this return includes consumed items,
                empty cases or an arm not physically returned.
              </div>
            )}

            <label className="block border-2 border-dashed border-slate-300 p-5 text-center cursor-pointer hover:bg-slate-50">

              <Upload className="mx-auto mb-2 text-slate-400" />

              <span className="block text-[10px] font-black uppercase">
                Attach reports / documents
              </span>

              <span className="block text-[9px] text-slate-400 mt-1">
                PDF, DOC, DOCX or image · max 5 MB each
              </span>

              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                className="hidden"
                onChange={event =>
                  setDocuments(Array.from(event.target.files || []))
                }
              />

            </label>

            {documents.length > 0 && (
              <ul className="mt-3 space-y-1">
                {documents.map(file => (
                  <li
                    key={`${file.name}-${file.size}`}
                    className="text-[10px] text-slate-600 truncate"
                  >
                    • {file.name}
                  </li>
                ))}
              </ul>
            )}

            <label className="block mt-4 text-[10px] font-black uppercase text-slate-500">

              Remarks / report details

              <textarea
                value={remarks}
                onChange={event => setRemarks(event.target.value)}
                rows={5}
                placeholder="Explain usage, empty cases, missing cases or reason for arm non-return..."
                className="mt-2 w-full border border-slate-300 p-3 text-xs font-medium normal-case"
              />

            </label>

          </section>

          {/* Stock Handling */}
          <section className="bg-slate-900 text-white p-5">

            <h2 className="text-xs font-black uppercase mb-3">
              Stock handling
            </h2>

            <ul className="space-y-2 text-[11px] text-slate-300">
              <li>• Unused returned quantity goes back to usable stock.</li>
              <li>• Consumed quantity is deducted from usable stock and recorded as used.</li>
              <li>• Empty cases go to separate used-case records only.</li>
              <li>• Missing empty cases are calculated and included in the return record.</li>
              <li>• Any unprocessed quantity remains outstanding against its original issue.</li>
            </ul>

            <button
              onClick={submitReturn}
              disabled={
                submitting ||
                loading ||
                !selectedRows.length
              }
              className="mt-6 w-full bg-red-600 disabled:opacity-40 py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              {submitting
                ? <Loader2 size={16} className="animate-spin" />
                : <ArrowDownCircle size={16} />
              }

              Save return transaction
            </button>

          </section>

        </aside>

      </div>

      {/* KGID and Fingerprint Modal */}
      {showKGIDModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">

          <div className="w-full max-w-md bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 p-5">

              <div>
                <h2 className="text-sm font-black uppercase">
                  Officer fingerprint verification
                </h2>

                <p className="mt-1 text-[10px] text-slate-500">
                  Step 1: KGID · Step 2: Fingerprint
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!isScanning && !verifyingFingerprint) {
                    setShowKGIDModal(false)
                    setKgidInput('')
                  }
                }}
                className="p-1 text-slate-500 hover:text-slate-900"
                aria-label="Close verification"
              >
                <X size={20} />
              </button>

            </div>

            <div className="p-5">

              <label className="block text-[10px] font-black uppercase text-slate-500">

                Officer KGID number

                <input
                  autoFocus
                  value={kgidInput}
                  onChange={event => setKgidInput(event.target.value)}
                  onKeyDown={event => {
                    if (
                      event.key === 'Enter' &&
                      !isScanning &&
                      !verifyingFingerprint
                    ) {
                      handleKGIDSubmit()
                    }
                  }}
                  placeholder="Enter KGID"
                  className="mt-2 w-full border-2 border-slate-300 p-3 text-sm font-bold uppercase outline-none focus:border-red-500"
                />

              </label>

              <div className="mt-4 rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                After KGID is found, place the registered finger on the
                scanner when prompted.
              </div>

              <button
                type="button"
                onClick={handleKGIDSubmit}
                disabled={
                  !kgidInput.trim() ||
                  isScanning ||
                  verifyingFingerprint ||
                  loading ||
                  submitting
                }
                className="mt-5 w-full bg-red-600 py-3 text-xs font-black uppercase text-white disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isScanning || verifyingFingerprint
                  ? <Loader2 size={16} className="animate-spin" />
                  : <Fingerprint size={16} />
                }

                {isScanning || verifyingFingerprint
                  ? 'Verifying fingerprint...'
                  : 'Continue to fingerprint scan'
                }
              </button>

            </div>

          </div>

        </div>
      )}

      {/* Officer History */}
      <OfficerHistoryModal
        officer={selectedOfficer}
        open={showHistory}
        onClose={() => setShowHistory(false)}
      />

      {/* Return Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/70 p-4">

          <div className="w-full max-w-xl bg-white shadow-2xl">

            <div className="border-b p-5">
              <h2 className="text-lg font-black uppercase">
                Confirm return transaction
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {selectedOfficer?.name} · {selectedRows.length} selected line(s)
              </p>
            </div>

            <div className="max-h-[50vh] overflow-y-auto p-5 space-y-2">

              {selectedRows.map(item => (
                <div key={item.key} className="border p-3 text-xs">

                  <p className="font-black uppercase">
                    {item.name} · {item.itemType}
                  </p>

                  {item.itemType === 'armoury' ? (
                    <p className="text-slate-500 mt-1">
                      {armActions[item.key] === 'not_returned'
                        ? `Not returned: ${armReasons[item.key] || ''}`
                        : 'Physical arm return'
                      }
                    </p>
                  ) : (
                    <p className="text-slate-500 mt-1">
                      Unused returned: {quantities[item.key] || 0}
                      {' · '}
                      Consumed: {consumed[item.key] || 0}
                      {' · '}
                      Empty cases received: {emptyCases[item.key] || 0}
                      {' · '}
                      Pending: {
                        Math.max(
                          0,
                          item.outstandingCount -
                          Number(quantities[item.key] || 0) -
                          Number(consumed[item.key] || 0)
                        )
                      }
                    </p>
                  )}

                </div>
              ))}

              {needsDocuments && (
                <p className="bg-amber-50 border border-amber-200 p-3 text-xs font-bold text-amber-800">
                  This return contains unreturned or consumed quantities.
                  Supporting documents and remarks will be attached to
                  the transaction.
                </p>
              )}

            </div>

            <div className="p-5 border-t flex gap-3">

              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="flex-1 border py-3 text-xs font-black uppercase"
              >
                Review again
              </button>

              <button
                onClick={saveReturn}
                disabled={submitting}
                className="flex-1 bg-red-600 text-white py-3 text-xs font-black uppercase disabled:opacity-50"
              >
                {submitting
                  ? 'Saving...'
                  : (
                    <>
                      <CheckCircle2 size={15} className="inline mr-2" />
                      Confirm & save return
                    </>
                  )
                }
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  )
}

export default ReturnItems
