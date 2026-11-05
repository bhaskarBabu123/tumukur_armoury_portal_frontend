import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useFingerprint } from '../contexts/FingerprintContext'
import { 
  ShieldCheck, Eye, EyeOff, Fingerprint, 
  AlertTriangle, FileWarning, Landmark, Info 
} from 'lucide-react'
import { toast } from 'react-toastify'
import Logo from '../components/Logo'

const Login = () => {
  const { login, isAuthenticated } = useAuth()
  const { captureFinger } = useFingerprint()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fingerprintRequired, setFingerprintRequired] = useState(false)
  const [fingerprintData, setFingerprintData] = useState(null)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFingerprintScan = async () => {
    try {
      const result = await captureFinger()
      if (result.success) {
        setFingerprintData(result.data.template)
        toast.success('Biometric Identity Verified')
      }
    } catch (error) {
      toast.error('Biometric Scanner Error')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await login(formData.email, formData.password, fingerprintData)
      if (!result.success && result.message?.includes('fingerprint')) {
        setFingerprintRequired(true)
        toast.info('Officer Biometric Required')
      }
    } catch (error) {
      toast.error('Authentication Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc]">
      
      {/* Left Panel: Instructions & Guidelines (Dark Red/Black) */}
      <div className="hidden md:flex md:w-1/2 bg-[#450a0a] p-12 flex-col justify-between text-white border-r-8 border-black">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <Logo/>
            <div>
              <h1 className="text-2xl font-black tracking-tighter">KSRP ARMOURY</h1>
              <p className="text-xs text-red-300 font-bold uppercase tracking-[0.2em]">Govt of Karnataka</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-6">Standard Operating Procedures (SOP)</h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="mt-1"><Fingerprint className="text-red-400 h-6 w-6" /></div>
              <div>
                <p className="font-bold text-lg">Biometric Mandate</p>
                <p className="text-sm text-red-100/70">Mandatory fingerprint capture is required for both Issuer and Receiver for every transaction of Arms/Ammunition.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1"><AlertTriangle className="text-yellow-500 h-6 w-6" /></div>
              <div>
                <p className="font-bold text-lg">Shortage & Loss Protocol</p>
                <p className="text-sm text-red-100/70">Any missing munitions must be reported immediately. Return status will remain 'PENDING' until CO/QM approval is uploaded.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1"><FileWarning className="text-red-400 h-6 w-6" /></div>
              <div>
                <p className="font-bold text-lg">Document Approval</p>
                <p className="text-sm text-red-100/70">Digital signature or scanned PDF of the 'Shortage Approval Form' is mandatory if physical count does not match inventory.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-red-800 pt-6">
          <p className="text-[10px] text-red-400 font-bold tracking-widest uppercase">Secured Terminal ID: KSRP-BLR-04</p>
        </div>
      </div>

      {/* Right Panel: Login Form (Light Theme) */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-10 md:hidden">
             <ShieldCheck className="mx-auto h-12 w-12 text-[#450a0a]" />
             <h2 className="mt-4 text-2xl font-black text-gray-900">KSRP ARMOURY</h2>
          </div>

          <div className="bg-white p-8 rounded-2xl  border border-gray-200">
            <div className="flex items-center gap-2 mb-8 bg-blue-50 p-3 rounded-lg border border-blue-100">
               <Info className="h-5 w-5 text-blue-600" />
               <p className="text-[11px] text-blue-800 font-bold uppercase tracking-tight">Access restricted to authorized Armoury Officers only.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Service Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-100 focus:border-[#450a0a] focus:ring-0 transition-all text-sm font-medium"
                  placeholder="name@ksrp.gov.in"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Secure Password</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-100 focus:border-[#450a0a] focus:ring-0 transition-all text-sm font-medium"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#450a0a]"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {fingerprintRequired && (
                <div className="pt-4 animate-in fade-in slide-in-from-bottom-2">
                  <button
                    type="button"
                    onClick={handleFingerprintScan}
                    className={`
                      w-full flex items-center justify-center px-4 py-4 border-2 rounded-xl font-black text-xs tracking-widest transition-all
                      ${fingerprintData 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-gray-50 text-gray-700 border-dashed border-gray-300 hover:bg-red-50 hover:border-red-200'
                      }
                    `}
                  >
                    <Fingerprint className={`h-6 w-6 mr-3 ${fingerprintData ? 'text-green-600' : 'text-red-700'}`} />
                    {fingerprintData ? 'BIOMETRIC CAPTURED' : 'SCAN OFFICER FINGERPRINT'}
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (fingerprintRequired && !fingerprintData)}
                className="w-full bg-black hover:bg-[#450a0a] text-white py-4 rounded-xl font-black text-sm tracking-[0.2em] transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'VERIFYING...' : 'SECURE SIGN IN'}
              </button>
            </form>
          </div>

          <p className="mt-8 text-center text-[10px] text-gray-400 font-medium uppercase tracking-widest">
            © 2026 KSRP. All Access is Monitored & Recorded.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login