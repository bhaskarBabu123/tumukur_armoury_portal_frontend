import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  Bell, 
  Database,
  Key,
  Save,
  Eye,
  EyeOff
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Settings = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [systemSettings, setSystemSettings] = useState({
    autoLogoutTime: 30,
    enableNotifications: true,
    enableAuditLog: true,
    maxLoginAttempts: 3,
    sessionTimeout: 60
  })

  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }))
    }
  }, [user])

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({ ...prev, [name]: value }))
  }

  const handleSystemChange = (e) => {
    const { name, value, type, checked } = e.target
    setSystemSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    setLoading(true)
    try {
      const updateData = { name: profileData.name, email: profileData.email }
      if (profileData.newPassword) {
        updateData.currentPassword = profileData.currentPassword
        updateData.newPassword = profileData.newPassword
      }
      await axios.put('/api/auth/profile', updateData,{headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }})
      toast.success('Profile updated successfully')
      setProfileData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'system', name: 'System', icon: SettingsIcon },
    { id: 'database', name: 'Database', icon: Database }
  ]

  return (
    <div className="space-y-6 bg-white min-h-screen p-4">
      {/* Header */}
      <div className="border-b-2 border-black pb-4">
        <h1 className="text-3xl font-black text-black uppercase tracking-tight">Settings</h1>
        <p className="text-gray-600 font-medium">System Configuration & Account Security</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <div className="lg:col-span-1">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-200 border ${
                    activeTab === tab.id
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-gray-200 hover:border-red-600 hover:text-red-600'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${activeTab === tab.id ? 'text-red-500' : ''}`} />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-xl font-bold text-black mb-6 flex items-center">
                  <span className="w-2 h-6 bg-red-600 mr-3"></span>
                  USER PROFILE
                </h3>
                
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-gray-500">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={profileData.name}
                        onChange={handleProfileChange}
                        className="w-full border-2 border-black p-3 focus:ring-0 focus:border-red-600 outline-none font-bold"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-gray-500">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        className="w-full border-2 border-black p-3 focus:ring-0 focus:border-red-600 outline-none font-bold"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t-2 border-dashed border-gray-200">
                    <h4 className="text-sm font-black uppercase text-red-600 mb-4">Security Update</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="currentPassword"
                          placeholder="Current Password"
                          value={profileData.currentPassword}
                          onChange={handleProfileChange}
                          className="w-full border-2 border-black p-3 pr-10 outline-none focus:border-red-600"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-4">
                          {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                        </button>
                      </div>
                      <input
                        type="password"
                        name="newPassword"
                        placeholder="New Password"
                        value={profileData.newPassword}
                        onChange={handleProfileChange}
                        className="w-full border-2 border-black p-3 outline-none focus:border-red-600"
                      />
                      <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm New"
                        value={profileData.confirmPassword}
                        onChange={handleProfileChange}
                        className="w-full border-2 border-black p-3 outline-none focus:border-red-600"
                      />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full md:w-auto bg-black text-white px-8 py-3 font-black uppercase hover:bg-red-600 transition-colors flex items-center justify-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Processing...' : 'Save Profile Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="text-xl font-bold text-black mb-6 flex items-center">
                  <span className="w-2 h-6 bg-red-600 mr-3"></span>
                  SECURITY PROTOCOLS
                </h3>
                
                <div className="grid gap-4">
                  <div className="border-2 border-black p-4 bg-red-50 flex items-start">
                    <Shield className="h-6 w-6 text-red-600 mr-4 flex-shrink-0" />
                    <div>
                      <p className="font-black text-black uppercase text-sm">Biometric Enforcement</p>
                      <p className="text-sm text-gray-700">Fingerprint authorization is required for all lethal inventory transactions.</p>
                    </div>
                  </div>

                  <div className="border-2 border-black p-4 bg-gray-50">
                    <p className="font-black text-black uppercase text-xs mb-3 text-gray-500">Session Information</p>
                    <div className="space-y-2">
                      <div className="flex justify-between border-b border-gray-200 pb-1">
                        <span className="text-sm font-bold">Last Authorized Access:</span>
                        <span className="text-sm">{user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-1">
                        <span className="text-sm font-bold">Access Level:</span>
                        <span className="text-sm text-red-600 font-black uppercase">{user?.role || 'Administrator'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System Tab */}
            {activeTab === 'system' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-xl font-bold text-black mb-6 flex items-center">
                  <span className="w-2 h-6 bg-red-600 mr-3"></span>
                  SYSTEM PARAMETERS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {['autoLogoutTime', 'sessionTimeout', 'maxLoginAttempts'].map((field) => (
                    <div key={field} className="space-y-2">
                      <label className="text-xs font-black uppercase text-gray-500">{field.replace(/([A-Z])/g, ' $1')}</label>
                      <input
                        type="number"
                        name={field}
                        value={systemSettings[field]}
                        onChange={handleSystemChange}
                        className="w-full border-2 border-black p-3 font-bold outline-none focus:border-red-600"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-8 space-y-4">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      name="enableAuditLog"
                      checked={systemSettings.enableAuditLog}
                      onChange={handleSystemChange}
                      className="w-5 h-5 border-2 border-black checked:bg-red-600 appearance-none cursor-pointer" 
                    />
                    <span className="font-bold text-black uppercase text-sm group-hover:text-red-600">Enable Master Audit Logging</span>
                  </label>
                </div>
              </div>
            )}

            {/* Database Tab */}
            {activeTab === 'database' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-xl font-bold text-black mb-6 flex items-center">
                  <span className="w-2 h-6 bg-red-600 mr-3"></span>
                  DATABASE CORE
                </h3>
                <div className="bg-black text-white p-4 font-mono text-xs mb-6">
                  <p className="text-green-400 font-bold uppercase mb-2">● SYSTEM_ONLINE</p>
                  <p>DB_TYPE: MongoDB_v6.0</p>
                  <p>ENCRYPTION: AES-256-GCM</p>
                  <p>BACKUP_INTERVAL: 24H</p>
                </div>
                <button className="bg-red-600 text-white px-6 py-2 font-black uppercase text-sm hover:bg-black transition-colors">
                  Force Manual Backup
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings