// MFS100 Fingerprint Scanner Integration
// This file provides JavaScript functions to interact with the MFS100 fingerprint device

const MFS100_URI = "http://localhost:8004/mfs100/"

// Helper function to make POST requests to MFS100 device
function postMFS100Client(method, jsonData) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', MFS100_URI + method, true)
    xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8')
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText)
            resolve({ httpStaus: true, data })
          } catch (e) {
            reject({ httpStaus: false, err: 'JSON parse error' })
          }
        } else {
          reject({ httpStaus: false, err: 'Service Unavailable' })
        }
      }
    }
    
    xhr.onerror = function() {
      reject({ httpStaus: false, err: 'Network error' })
    }
    
    xhr.send(jsonData)
  })
}

// Helper function to make GET requests to MFS100 device
function getMFS100Client(method) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', MFS100_URI + method, true)
    xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8')
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText)
            resolve({ httpStaus: true, data })
          } catch (e) {
            reject({ httpStaus: false, err: 'JSON parse error' })
          }
        } else {
          reject({ httpStaus: false, err: 'Service Unavailable' })
        }
      }
    }
    
    xhr.onerror = function() {
      reject({ httpStaus: false, err: 'Network error' })
    }
    
    xhr.send()
  })
}

// Get MFS100 device information
export function getMFS100Info() {
  return getMFS100Client("info")
}

// Get MFS100 key information
export function getMFS100KeyInfo(key) {
  const request = { "Key": key }
  const jsonData = JSON.stringify(request)
  return postMFS100Client("keyinfo", jsonData)
}

// Capture fingerprint from MFS100 device
export function captureFinger(quality = 80, timeout = 5000) {
  const request = {
    "Quality": quality,
    "TimeOut": timeout
  }
  const jsonData = JSON.stringify(request)
  return postMFS100Client("capture", jsonData)
}

// Capture multiple fingerprints
export function captureMultiFinger(quality = 80, timeout = 5000, noOfFinger = 1) {
  const request = {
    "Quality": quality,
    "TimeOut": timeout,
    "NoOfFinger": noOfFinger
  }
  const jsonData = JSON.stringify(request)
  return postMFS100Client("capturewithdeduplicate", jsonData)
}

// Verify fingerprint against stored template
export function verifyFinger(probTemplate, galleryTemplate) {
  const request = {
    "ProbTemplate": probTemplate,
    "GalleryTemplate": galleryTemplate,
    "BioType": "FMR" // Can be "ANSI" if using ANSI templates
  }
  const jsonData = JSON.stringify(request)
  return postMFS100Client("verify", jsonData)
}

// Match fingerprint with live capture
export function matchFinger(quality = 80, timeout = 5000, galleryTemplate) {
  const request = {
    "Quality": quality,
    "TimeOut": timeout,
    "GalleryTemplate": galleryTemplate,
    "BioType": "FMR" // Can be "ANSI" if using ANSI templates
  }
  const jsonData = JSON.stringify(request)
  return postMFS100Client("match", jsonData)
}

// Get PID data
export function getPidData(biometricArray) {
  const request = { "Biometrics": biometricArray }
  const jsonData = JSON.stringify(request)
  return postMFS100Client("getpiddata", jsonData)
}

// Get RBD data
export function getRbdData(biometricArray) {
  const request = { "Biometrics": biometricArray }
  const jsonData = JSON.stringify(request)
  return postMFS100Client("getrbddata", jsonData)
}

// Biometric data structure
export class Biometric {
  constructor(bioType, biometricData, pos, nfiq, na) {
    this.BioType = bioType
    this.BiometricData = biometricData
    this.Pos = pos
    this.Nfiq = nfiq
    this.Na = na
  }
}

// MFS100 Request structure
export class MFS100Request {
  constructor(biometricArray) {
    this.Biometrics = biometricArray
  }
}

// Error handling helper
export function getHttpError(status, textStatus, thrownError) {
  console.error("MFS100 Error:", { status, textStatus, thrownError })
  
  let err = thrownError || "Unhandled Exception"
  
  if (status === 0) {
    err = 'Service Unavailable - MFS100 device not connected'
  } else if (status === 404) {
    err = 'MFS100 service not found'
  } else if (status === 500) {
    err = 'Internal Server Error'
  } else if (textStatus === 'parsererror') {
    err = 'JSON parse failed'
  } else if (textStatus === 'timeout') {
    err = 'Request timeout'
  } else if (textStatus === 'abort') {
    err = 'Request aborted'
  }
  
  return err
}

// Device status check
export async function checkDeviceStatus() {
  try {
    const result = await getMFS100Info()
    return {
      connected: result.httpStaus,
      info: result.data
    }
  } catch (error) {
    return {
      connected: false,
      error: error.err || 'Device not connected'
    }
  }
}

// Initialize device connection
export async function initializeDevice() {
  try {
    const status = await checkDeviceStatus()
    if (status.connected) {
      console.log('MFS100 device connected successfully')
      return { success: true, message: 'Device connected' }
    } else {
      console.error('MFS100 device not connected:', status.error)
      return { success: false, message: status.error }
    }
  } catch (error) {
    console.error('Failed to initialize MFS100 device:', error)
    return { success: false, message: 'Failed to initialize device' }
  }
}