import React, { useState } from 'react'
import { useFingerprint } from '../contexts/FingerprintContext'
import { Fingerprint, CheckCircle, XCircle, Loader, RefreshCcw } from 'lucide-react'

const FingerprintScanner = ({ onScanComplete, onScanError, disabled = false }) => {
  const { captureFinger, scannerStatus, isScanning } = useFingerprint()
  const [scannedData, setScannedData] = useState(null)

  const handleScan = async () => {
    try {
      const result = await captureFinger()
      
      if (result.success) {
        setScannedData(result.data)
        onScanComplete?.(result.data)
      } else {
        onScanError?.(result.error)
      }
    } catch (error) {
      onScanError?.(error.message)
    }
  }

  const resetScanner = () => {
    setScannedData(null)
  }

  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      {/* SCANNER VISUALIZER */}
      <div className="relative group">
        <div className={`
          w-24 h-24 flex items-center justify-center transition-all duration-300 border-2
          ${scannedData 
            ? 'bg-green-50 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]' 
            : isScanning 
            ? 'bg-red-50 border-red-500 animate-pulse' 
            : 'bg-white border-slate-200'}
        `}>
          {isScanning ? (
            <div className="relative">
              <Loader className="w-10 h-10 text-red-600 animate-spin" />
              <div className="absolute inset-0 w-10 h-1 bg-red-600/20 top-1/2 -translate-y-1/2 animate-bounce"></div>
            </div>
          ) : scannedData ? (
            <CheckCircle className="w-10 h-10 text-green-600" />
          ) : (
            <Fingerprint className="w-10 h-10 text-slate-300 group-hover:text-slate-400 transition-colors" />
          )}
        </div>
        
        {/* CORNER ACCENTS (Terminal Style) */}
        <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-slate-400"></div>
        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-slate-400"></div>
      </div>

      {/* STATUS INFORMATION */}
      <div className="mt-4 text-center space-y-1">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Sensor Status
        </p>
        <p className={`text-[11px] font-black uppercase italic ${scannerStatus?.includes('Ready') ? 'text-green-600' : 'text-red-500'}`}>
          {isScanning ? 'Capturing Biometrics...' : scannerStatus || 'Initializing...'}
        </p>
      </div>

      {/* RESULT FEEDBACK */}
      {scannedData && (
        <div className="mt-4 w-full bg-green-50 border border-green-100 p-2 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-green-700 uppercase leading-none">Capture Verified</span>
            <span className="text-[10px] font-mono font-bold text-green-600">Quality Index: {scannedData.quality}%</span>
          </div>
          <CheckCircle size={14} className="text-green-600" />
        </div>
      )}

      {/* CONTROL ACTIONS */}
      <div className="mt-5 w-full">
        {!scannedData ? (
          <button
            onClick={handleScan}
            disabled={disabled || isScanning}
            className={`
              w-full py-3 px-4 flex items-center justify-center gap-3 transition-all
              text-[10px] font-black uppercase tracking-widest
              ${isScanning 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-slate-900 text-white hover:bg-red-700 border-l-4 border-red-500 shadow-md active:scale-95'}
            `}
          >
            {isScanning ? 'Reading Node...' : 'Initialize Scan'}
          </button>
        ) : (
          <button
            onClick={resetScanner}
            className="w-full py-3 px-4 flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
          >
            <RefreshCcw size={14} />
            Reset Scanner
          </button>
        )}
      </div>
      
      <p className="mt-3 text-[8px] font-bold text-slate-300 uppercase tracking-tighter">
        Secure Biometric Link // RSA 2048 Bit
      </p>
    </div>
  )
}

export default FingerprintScanner;