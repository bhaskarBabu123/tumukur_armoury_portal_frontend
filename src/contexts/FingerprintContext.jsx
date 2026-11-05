import React, { createContext, useContext, useState } from 'react'
import { toast } from 'react-toastify'

const FingerprintContext = createContext()

export const useFingerprint = () => {
  const context = useContext(FingerprintContext)
  if (!context) {
    throw new Error('useFingerprint must be used within a FingerprintProvider')
  }
  return context
}

// MFS100 Integration
const MFS100_URI = "http://localhost:8004/mfs100/"

const postMFS100Client = (method, jsonData) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', MFS100_URI + method, true)
    xhr.timeout = 15000
    xhr.onerror = () => reject({ httpStatus: false, err: 'Cannot connect to MFS100 service. Check device service and USB connection.' })
    xhr.ontimeout = () => reject({ httpStatus: false, err: 'MFS100 request timed out. Try again.' })
    xhr.onabort = () => reject({ httpStatus: false, err: 'MFS100 request was cancelled.' })
    xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8')
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText)
            resolve({ httpStatus: true, data })
          } catch (e) {
            reject({ httpStatus: false, err: 'JSON parse error' })
          }
        } else {
          reject({ httpStatus: false, err: `MFS100 service returned HTTP ${xhr.status || 'network error'}` })
        }
      }
    }
    xhr.send(jsonData)
  })
}

export const FingerprintProvider = ({ children }) => {
  const [scannerStatus, setScannerStatus] = useState('Not initialized')
  const [isScanning, setIsScanning] = useState(false)

  const captureFinger = async (quality = 80, timeout = 5000) => {
    setIsScanning(true)
    setScannerStatus('Scanning...')
    
    try {
      const request = {
        Quality: quality,
        TimeOut: timeout
      }
      
      const result = await postMFS100Client('capture', JSON.stringify(request))
      
      if (result.httpStatus && result.data.ErrorCode === '0') {
        setScannerStatus('Fingerprint captured successfully')
        return {
          success: true,
          data: {
            template: result.data.AnsiTemplate,
            bitmap: result.data.BitmapData,
            quality: result.data.Quality
          }
        }
      } else {
        const error = result.data?.ErrorDescription || 'Capture failed'
        setScannerStatus(`Error: ${error}`)
        toast.error(`Fingerprint capture failed: ${error}`)
        return { success: false, error }
      }
    } catch (error) {
      const message = error?.err || 'Fingerprint device not connected. Check that the MFS100 service is running.'
      setScannerStatus(message)
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setIsScanning(false)
    }
  }

  const verifyFinger = async (probTemplate, galleryTemplate) => {
    try {
      const request = {
        ProbTemplate: probTemplate,
        GalleryTemplate: galleryTemplate,
        BioType: "FMR"
      }
      
      const result = await postMFS100Client('verify', JSON.stringify(request))
      
      if (result.httpStatus && result.data.Status === true) {
        return { success: true, matched: true, score: result.data.MatchingScore }
      } else {
        return { success: true, matched: false, score: result.data?.MatchingScore || 0 }
      }
    } catch (error) {
      return { success: false, error: 'Verification failed' }
    }
  }

  const matchFinger = async (quality, timeout, galleryTemplate) => {
    try {
      const request = {
        Quality: quality,
        TimeOut: timeout,
        GalleryTemplate: galleryTemplate,
        BioType: "FMR"
      }
      
      const result = await postMFS100Client('match', JSON.stringify(request))
      
      if (result.httpStatus && result.data.ErrorCode === '0') {
        return {
          success: true,
          matched: result.data.Status === true,
          template: result.data.AnsiTemplate,
          bitmap: result.data.BitmapData,
          score: result.data.MatchingScore
        }
      } else {
        return { success: false, error: result.data?.ErrorDescription || 'Match failed' }
      }
    } catch (error) {
      return { success: false, error: 'Match operation failed' }
    }
  }

  const value = {
    scannerStatus,
    isScanning,
    captureFinger,
    verifyFinger,
    matchFinger,
    setScannerStatus
  }

  return (
    <FingerprintContext.Provider value={value}>
      {children}
    </FingerprintContext.Provider>
  )
}