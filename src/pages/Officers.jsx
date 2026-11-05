import React, { useState, useEffect, useRef } from 'react'
import { officersAPI } from '../utils/api'
import { toast } from 'react-toastify'
import { 
  Plus, Search, Trash2, Eye, User, Phone, 
  Badge, Building, X, Fingerprint, Shield,
  Activity, Hash, SlidersHorizontal, FileText,
  Smartphone, Briefcase, Calendar, 
  UserPlus, Camera, CheckCircle2, Upload, RefreshCw, Video
} from 'lucide-react'
import FingerprintScanner from '../components/FingerprintScanner'

const API_ROOT = (import.meta.env.VITE_API_URL || 'https://main-armoury-portal-backend.onrender.com/api').replace(/\/api\/?$/, '')

const MAX_PHOTO_SIZE = 5 * 1024 * 1024 // 5MB

const Officers = () => {
  // --- CORE STATE ---
  const [officers, setOfficers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedOfficer, setSelectedOfficer] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '', rank: '', metalNo: '', phonenumber: '',
    kgidNo: '', company: '', remarks: '',
    fingerprintData: '', profilePicture: null
  })

  // --- PHOTO / CAMERA STATE ---
  const [photoPreview, setPhotoPreview] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraDevices, setCameraDevices] = useState([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [cameraError, setCameraError] = useState('')
  const [cameraLoading, setCameraLoading] = useState(false)
  const [capturedFile, setCapturedFile] = useState(null)
  const [capturedPreview, setCapturedPreview] = useState(null)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => { fetchOfficers() }, [])

  // Build / clean the preview URL for the selected profile picture
  useEffect(() => {
    if (formData.profilePicture instanceof File) {
      const url = URL.createObjectURL(formData.profilePicture)
      setPhotoPreview(url)
      return () => URL.revokeObjectURL(url)
    }
    setPhotoPreview(null)
  }, [formData.profilePicture])

  // Clean captured preview URL
  useEffect(() => {
    if (!capturedFile) { setCapturedPreview(null); return }
    const url = URL.createObjectURL(capturedFile)
    setCapturedPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [capturedFile])

  // Start camera when modal opens, stop when it closes / unmounts
  useEffect(() => {
    if (showCamera) startCamera()
    return () => stopCamera()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCamera])

  // Refresh device list if a camera is plugged in / removed
  useEffect(() => {
    if (!navigator.mediaDevices?.addEventListener) return
    const onChange = () => { if (showCamera) loadDevices() }
    navigator.mediaDevices.addEventListener('devicechange', onChange)
    return () => navigator.mediaDevices.removeEventListener('devicechange', onChange)
  }, [showCamera])

  const fetchOfficers = async () => {
    try {
      const response = await officersAPI.getAll()
      setOfficers(response.data.data)
    } catch (error) {
      toast.error('Directory Sync Failed')
    } finally {
      setLoading(false)
    }
  }

  // --- CAMERA HELPERS ---
  const loadDevices = async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices()
      setCameraDevices(all.filter(d => d.kind === 'videoinput'))
    } catch (e) {
      /* ignore */
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
  }

  const startCamera = async (deviceId) => {
    setCameraError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera is not supported in this browser, or the page is not served over HTTPS / localhost.')
      return
    }
    setCameraLoading(true)
    stopCamera()
    try {
      const constraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
      const activeId = stream.getVideoTracks()[0]?.getSettings()?.deviceId
      if (activeId) setSelectedDeviceId(activeId)
      // Labels are only available after permission is granted
      await loadDevices()
    } catch (err) {
      let msg = 'Unable to access camera.'
      if (err.name === 'NotAllowedError') msg = 'Camera permission denied. Allow camera access in the browser and try again.'
      else if (err.name === 'NotFoundError') msg = 'No camera device found. Connect a camera and try again.'
      else if (err.name === 'NotReadableError') msg = 'Camera is busy or being used by another application.'
      else if (err.name === 'OverconstrainedError') msg = 'Selected camera is unavailable. Choose another device.'
      setCameraError(msg)
    } finally {
      setCameraLoading(false)
    }
  }

  const openCamera = () => {
    setCapturedFile(null)
    setShowCamera(true)
  }

  const closeCamera = () => {
    stopCamera()
    setShowCamera(false)
    setCapturedFile(null)
    setCameraError('')
  }

  const handleDeviceChange = (e) => {
    const id = e.target.value
    setSelectedDeviceId(id)
    startCamera(id)
  }

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !video.videoWidth) {
      toast.error('Camera not ready yet')
      return
    }
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (!blob) { toast.error('Capture failed'); return }
      const file = new File([blob], `officer-photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
      setCapturedFile(file)
      stopCamera()
    }, 'image/jpeg', 0.92)
  }

  const retakePhoto = () => {
    setCapturedFile(null)
    startCamera(selectedDeviceId)
  }

  const useCapturedPhoto = () => {
    if (!capturedFile) return
    setFormData(prev => ({ ...prev, profilePicture: capturedFile }))
    toast.success('Photo Captured')
    closeCamera()
  }

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, profilePicture: null }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // --- FORM HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value, files } = e.target
    if (files) {
      const file = files[0]
      if (file) {
        if (!file.type.startsWith('image/')) {
          toast.error('Please select an image file')
          e.target.value = ''
          return
        }
        if (file.size > MAX_PHOTO_SIZE) {
          toast.error('Image must be under 5MB')
          e.target.value = ''
          return
        }
      }
      setFormData(prev => ({ ...prev, [name]: file || null }))
      return
    }
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFingerprintCapture = (fingerprintData) => {
    setFormData(prev => ({ ...prev, fingerprintData: fingerprintData.template }))
    toast.success('Biometric Registered')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await officersAPI.create(formData)
      toast.success('Personnel Created')
      setShowAddModal(false)
      resetForm()
      fetchOfficers()
    } catch (error) {
      toast.error('System Rejection: ' + error.response?.data?.message)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '', rank: '', metalNo: '', phonenumber: '',
      kgidNo: '', company: '', remarks: '',
      fingerprintData: '', profilePicture: null
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDelete = async (id) => {
    if (window.confirm('Purge this record?')) {
      try {
        await officersAPI.delete(id)
        toast.success('Record Erased')
        fetchOfficers()
      } catch (error) {
        toast.error('Access Denied')
      }
    }
  }

  const filteredOfficers = officers.filter(o =>
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.metalNo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return (
    <div className="fixed inset-0 bg-[#F1F5F9] flex items-center justify-center font-black text-slate-400 text-[10px] tracking-[0.4em]">
      INITIALIZING DIRECTORY...
    </div>
  )

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      
      {/* 1. TOP COMMAND BAR */}
      <header className="w-full bg-[#F1F5F9] border-b border-gray-300 px-4 py-4 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 p-2.5 shadow-lg">
              <Shield className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Personnel Directory</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Database: Online // Verified {officers.length}</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full md:w-auto bg-slate-900 hover:bg-red-700 text-white px-8 py-3 flex items-center justify-center gap-3 transition-all border-l-4 border-red-500 shadow-sm"
          >
            <Plus size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Enlist Personnel</span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full p-4 lg:p-8 space-y-6">
        
        {/* 2. SEARCH GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="SEARCH BY NAME, METAL NO, OR ASSIGNMENT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-300 py-4 pl-12 pr-4 text-xs font-black uppercase tracking-[0.1em] placeholder:text-gray-300 focus:border-slate-900 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="bg-white border border-gray-300 flex items-center justify-between px-6 py-4 shadow-sm">
            <div className="flex items-center gap-3 font-black text-[10px] text-slate-500 uppercase">
              <SlidersHorizontal size={16} className="text-slate-400" />
              Filter: Nominal
            </div>
            <Activity size={16} className="text-red-500" />
          </div>
        </div>

        {/* 3. MAIN TABLE */}
        <div className="bg-white border border-gray-300 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[#F1F5F9] border-b border-gray-300 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="px-8 py-5">Personnel</th>
                  <th className="px-8 py-5">Rank & Metal No</th>
                  <th className="px-8 py-5">Assigned Unit</th>
                  <th className="px-8 py-5">Authentication</th>
                  <th className="px-8 py-5 text-right">Commands</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOfficers.map((officer) => (
                  <tr key={officer._id} className="hover:bg-blue-50/40 transition-colors group italic">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-gray-100 border border-gray-200 overflow-hidden">
                          {officer.profilePicture ? (
                            <img src={`${API_ROOT}/uploads/profiles/${officer.profilePicture}`} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300"><User size={20}/></div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase tracking-tight mb-0.5">{officer.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{officer.phonenumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <p className="text-[11px] font-black text-slate-700 uppercase">{officer.rank}</p>
                      <p className="text-[10px] font-mono font-black text-red-600">M-ID: {officer.metalNo}</p>
                    </td>
                    <td className="px-8 py-4">
                      <p className="text-[11px] font-bold text-slate-600 uppercase italic">{officer.company || 'GEN_POOL'}</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase">KGID: {officer.kgidNo || '---'}</p>
                    </td>
                    <td className="px-8 py-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 text-[9px] font-black uppercase tracking-widest ${officer.fingerprintData ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                        <CheckCircle2 size={12} />
                        {officer.fingerprintData ? 'BIO_READY' : 'BIO_PENDING'}
                      </div>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setSelectedOfficer(officer); setShowViewModal(true); }} className="p-2.5 bg-white border border-gray-200 text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all"><Eye size={16}/></button>
                        <button onClick={() => handleDelete(officer._id)} className="p-2.5 bg-white border border-gray-200 text-slate-400 hover:text-red-600 hover:border-red-600 transition-all"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 4. DETAILS POPUP (NO FINGERPRINT DISPLAY) */}
      {showViewModal && selectedOfficer && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col border border-slate-300">
            {/* Header */}
            <div className="bg-[#F1F5F9] p-6 flex justify-between items-center border-b border-gray-300">
              <div className="flex items-center gap-4">
                <div className="bg-slate-900 p-2 text-white">
                  <User size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase italic tracking-tighter">Personnel Profile</h2>
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Metal No: {selectedOfficer.metalNo}</p>
                </div>
              </div>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><X size={24}/></button>
            </div>

            <div className="p-8 lg:p-12 overflow-y-auto max-h-[80vh]">
              <div className="flex flex-col md:flex-row gap-10">
                <div className="w-full md:w-1/3">
                  <div className="aspect-square bg-gray-50 border-2 border-slate-100 p-2 grayscale">
                    {selectedOfficer.profilePicture ? (
                      <img src={`${API_ROOT}/uploads/profiles/${selectedOfficer.profilePicture}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-200"><User size={60}/></div>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-6">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase italic leading-none">{selectedOfficer.name}</h3>
                    <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest">{selectedOfficer.rank}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4 border-t border-gray-100 pt-6">
                    <DossierItem icon={<Smartphone size={14}/>} label="Phone Number" value={selectedOfficer.phonenumber} />
                    <DossierItem icon={<Building size={14}/>} label="Assigned Unit" value={selectedOfficer.company || 'Not Assigned'} />
                    <DossierItem icon={<Hash size={14}/>} label="KGID Reference" value={selectedOfficer.kgidNo || 'N/A'} />
                    <DossierItem icon={<Calendar size={14}/>} label="Registry Date" value="Jan 17, 2026" />
                  </div>

                  <div className="bg-slate-50 p-4 border-l-4 border-red-500">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Dossier Notes</p>
                    <p className="text-xs font-bold text-slate-600 leading-relaxed italic">{selectedOfficer.remarks || "Clear record - No additional administrative remarks."}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-[#F8FAFC] border-t border-gray-200 flex justify-end">
              <button onClick={() => setShowViewModal(false)} className="px-8 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-lg">Close File</button>
            </div>
          </div>
        </div>
      )}

      {/* 5. ADD PERSONNEL POPUP (Fixed Overflow & Themed) */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-4xl shadow-2xl relative flex flex-col border border-slate-300 max-h-[90vh]">
            {/* Header */}
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <UserPlus size={24} className="text-red-500" />
                <h2 className="text-lg font-black uppercase italic tracking-tighter">New Personnel Registry</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-white/50 hover:text-white transition-colors"><X size={24}/></button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
              <div className="overflow-y-auto p-8 lg:p-12 space-y-10">
                
                {/* Section 1: Official Identity */}
                <div>
                  <h4 className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <FileText size={14}/> 01. Official Identification
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormInput label="Full Name" name="name" value={formData.name} onChange={handleInputChange} required />
                    <FormSelect label="Rank" name="rank" value={formData.rank} onChange={handleInputChange} required 
                      options={['Constable', 'Head Constable', 'Assistant Sub Inspector', 'Sub Inspector', 'Inspector', 'Deputy Superintendent', 'Superintendent', 'Additional Superintendent', 'Deputy Inspector General', 'Inspector General', 'Additional Director General', 'Director General']} />
                    <FormInput label="Metal Number" name="metalNo" value={formData.metalNo} onChange={handleInputChange} required />
                  </div>
                </div>

                {/* Section 2: Contact & Unit */}
                <div>
                  <h4 className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <Building size={14}/> 02. Posting & Contact
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormInput label="Phone Number" name="phonenumber" type="tel" value={formData.phonenumber} onChange={handleInputChange} required />
                    <FormInput label="KGID Number" name="kgidNo" value={formData.kgidNo} onChange={handleInputChange} />
                    <FormInput label="Company Name" name="company" value={formData.company} onChange={handleInputChange} />
                  </div>
                </div>

                {/* Section 3: Biometrics & Photo */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-4">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Fingerprint size={14}/> 03. Biometric Scan (Optional)
                    </h4>
                    <div className="bg-[#F1F5F9] border-2 border-dashed border-slate-300 h-40 flex flex-col items-center justify-center p-4">
                      <p className="text-[9px] text-slate-500 text-center mb-2">Optional now. You can register fingerprint later when the device is available.</p><FingerprintScanner onScanComplete={handleFingerprintCapture} onScanError={(err) => toast.error(err)} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Camera size={14}/> 04. Profile Capture
                    </h4>
                    <div className="space-y-4">
                      {/* Photo preview + actions */}
                      <div className="flex items-start gap-4">
                        <div className="h-28 w-28 shrink-0 bg-gray-50 border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center">
                          {photoPreview ? (
                            <img src={photoPreview} alt="Profile preview" className="w-full h-full object-cover" />
                          ) : (
                            <User size={36} className="text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <button
                            type="button"
                            onClick={openCamera}
                            className="w-full bg-slate-900 hover:bg-red-700 text-white px-4 py-2.5 flex items-center justify-center gap-2 transition-all border-l-4 border-red-500 shadow-sm"
                          >
                            <Video size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Take Photo (Camera)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full bg-white hover:border-slate-900 text-slate-700 px-4 py-2.5 flex items-center justify-center gap-2 transition-all border border-gray-300 shadow-sm"
                          >
                            <Upload size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Choose File</span>
                          </button>
                          {formData.profilePicture && (
                            <button
                              type="button"
                              onClick={removePhoto}
                              className="w-full text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-600 transition-colors flex items-center justify-center gap-2 py-1"
                            >
                              <Trash2 size={12} /> Remove Photo
                            </button>
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            name="profilePicture"
                            accept="image/*"
                            onChange={handleInputChange}
                            className="hidden"
                          />
                        </div>
                      </div>
                      {formData.profilePicture && (
                        <p className="text-[9px] font-bold text-slate-400 uppercase truncate">
                          Selected: {formData.profilePicture.name}
                        </p>
                      )}
                      <textarea name="remarks" value={formData.remarks} onChange={handleInputChange} placeholder="ADMIN NOTES..." className="w-full border border-gray-300 p-4 h-24 text-xs font-black uppercase outline-none focus:border-slate-900"></textarea>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 bg-[#F8FAFC] border-t border-gray-200 flex justify-end items-center gap-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="text-[10px] font-black uppercase text-gray-400 hover:text-slate-900 transition-colors">Abort Registry</button>
                <button type="submit" className="bg-slate-900 text-white px-10 py-4 text-[10px] font-black uppercase tracking-widest border-l-4 border-red-600 shadow-xl hover:bg-red-700 transition-all">Commit to Database</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. CAMERA CAPTURE POPUP */}
      {showCamera && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
          <div className="bg-white w-full max-w-xl shadow-2xl flex flex-col border border-slate-300 max-h-[95vh]">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Camera size={20} className="text-red-500" />
                <h2 className="text-sm font-black uppercase italic tracking-tighter">Profile Photo Capture</h2>
              </div>
              <button type="button" onClick={closeCamera} className="text-white/50 hover:text-white transition-colors"><X size={22}/></button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Device selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Camera Device</label>
                <select
                  value={selectedDeviceId}
                  onChange={handleDeviceChange}
                  disabled={cameraDevices.length === 0 || !!capturedFile}
                  className="w-full bg-white border border-gray-300 px-4 py-3 text-xs font-bold text-slate-800 focus:border-slate-900 outline-none shadow-sm disabled:opacity-50"
                >
                  {cameraDevices.length === 0 && <option value="">DETECTING CAMERAS...</option>}
                  {cameraDevices.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {(d.label || `Camera ${i + 1}`).toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Viewfinder */}
              <div className="relative aspect-video bg-slate-900 border-2 border-slate-300 overflow-hidden flex items-center justify-center">
                {/* Live video */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${capturedFile ? 'hidden' : 'block'}`}
                />
                {/* Captured still */}
                {capturedFile && capturedPreview && (
                  <img src={capturedPreview} alt="Captured" className="w-full h-full object-cover" />
                )}
                {/* Loading */}
                {cameraLoading && !capturedFile && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 text-white text-[10px] font-black uppercase tracking-[0.3em]">
                    Starting Camera...
                  </div>
                )}
                {/* Error */}
                {cameraError && !capturedFile && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900 p-6 text-center">
                    <Camera size={28} className="text-red-500" />
                    <p className="text-[11px] font-bold text-white/80 leading-relaxed">{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => startCamera(selectedDeviceId || undefined)}
                      className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>

              {/* Hidden canvas used for capture */}
              <canvas ref={canvasRef} className="hidden" />

              <p className="text-[9px] text-slate-500 text-center">
                Tip: Face the camera in good lighting. You can switch between built-in and connected cameras above.
              </p>
            </div>

            {/* Actions */}
            <div className="p-5 bg-[#F8FAFC] border-t border-gray-200 flex justify-end items-center gap-4">
              <button type="button" onClick={closeCamera} className="text-[10px] font-black uppercase text-gray-400 hover:text-slate-900 transition-colors">Cancel</button>
              {!capturedFile ? (
                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={!!cameraError || cameraLoading}
                  className="bg-slate-900 text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest border-l-4 border-red-600 shadow-xl hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Camera size={14} /> Capture
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={retakePhoto}
                    className="bg-white text-slate-700 px-6 py-3 text-[10px] font-black uppercase tracking-widest border border-gray-300 hover:border-slate-900 transition-all flex items-center gap-2"
                  >
                    <RefreshCw size={14} /> Retake
                  </button>
                  <button
                    type="button"
                    onClick={useCapturedPhoto}
                    className="bg-slate-900 text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest border-l-4 border-red-600 shadow-xl hover:bg-red-700 transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 size={14} /> Use Photo
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// STYLED SUB-COMPONENTS
const FormInput = ({ label, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">{label}</label>
    <input {...props} className="w-full bg-white border border-gray-300 px-4 py-3 text-xs font-bold text-slate-800 focus:border-slate-900 outline-none shadow-sm transition-all" />
  </div>
)

const FormSelect = ({ label, options, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">{label}</label>
    <select {...props} className="w-full bg-white border border-gray-300 px-4 py-3 text-xs font-bold text-slate-800 focus:border-slate-900 outline-none shadow-sm appearance-none">
      <option value="">RANK_CHOOSE...</option>
      {options.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
    </select>
  </div>
)

const DossierItem = ({ icon, label, value }) => (
  <div className="space-y-1">
    <div className="flex items-center gap-2 text-slate-400">
      {icon}
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <p className="text-sm font-black text-slate-800 uppercase italic ml-6">{value}</p>
  </div>
)

export default Officers