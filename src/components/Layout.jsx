import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Home, Users, Shield, Package, Zap, 
  ArrowUpCircle, ArrowDownCircle, FileText, 
  BarChart3, Settings, LogOut, Menu, X, AlertTriangle, 
  ChevronRight, Bell, Landmark, ShieldCheck
} from 'lucide-react'
import Logo from './Logo'

const Layout = ({ children }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Officers List', href: '/officers', icon: Users },
    { name: 'Arms Inventory', href: '/arms', icon: Shield },
    { name: 'Ammunition Stock', href: '/ammunition', icon: Package },
    { name: 'Munitions', href: '/munitions', icon: Zap },
    { name: 'Issue Register', href: '/issue', icon: ArrowUpCircle },
    { name: 'Return Register', href: '/return', icon: ArrowDownCircle },
    { name: 'Transactions', href: '/transactions', icon: FileText },
    { name: 'Missing / Empty Cases', href: '/accountability', icon: AlertTriangle },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-[#fcfcfc] overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-black/40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR: DARK RED THEME */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#7f1d1d] text-white transform transition-transform duration-300 lg:translate-x-0 lg:static
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col border-r-4 border-[#450a0a]
      `}>
        
        {/* Logo / Portal Header */}
        <div className="p-5 border-b border-[#991b1b] bg-[#450a0a]">
          <div className="flex items-center gap-3">
            <Logo/>
            <div>
              <h1 className="text-sm font-black tracking-tighter leading-none">ARMOURY PORTAL</h1>
              <p className="text-[10px] text-red-200/80 font-bold uppercase tracking-widest mt-1">KSRP • Karnataka</p>
            </div>
          </div>
        </div>

        {/* Links Area - Compact & All visible */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  group flex items-center px-3 py-2 text-[13px] font-bold rounded transition-all duration-150
                  ${isActive 
                    ? 'bg-black text-white border-l-4 border-white shadow-lg' 
                    : 'text-red-100 hover:bg-[#450a0a] hover:text-white'
                  }
                `}
              >
                <Icon className={`mr-3 h-4 w-4 ${isActive ? 'text-white' : 'text-red-300 group-hover:text-white'}`} />
                {item.name}
              </Link>
            )
          })}

          {/* User & Logout - Not fixed, moves with scroll if needed */}
          <div className="mt-8 pt-4 border-t border-[#991b1b]">
            <div className="px-3 py-3 mb-2 bg-[#450a0a]/50 rounded border border-[#991b1b]">
              <p className="text-[10px] text-red-300 uppercase font-bold mb-1">Active Officer</p>
              <p className="text-xs font-black truncate">{user?.name || 'K. SHIVAKUMAR'}</p>
              <p className="text-[10px] text-red-200/60 truncate italic">{user?.role || 'Armoury In-Charge'}</p>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-[12px] font-bold text-red-100 hover:bg-black hover:text-white rounded transition-colors"
            >
              <LogOut className="mr-3 h-4 w-4" />
              EXIT SYSTEM
            </button>
          </div>
        </nav>
      </aside>

      {/* MAIN CONTENT: LIGHT THEME */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 bg-white border-b-2 border-gray-100 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1 text-gray-800">
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-[#450a0a]" />
              <span className="text-xs font-black text-gray-900 uppercase tracking-widest hidden sm:block">
                Government of Karnataka <span className="text-gray-300 mx-2">|</span> Police Department
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-right hidden md:block">
              <p className="text-[11px] font-black text-gray-900 uppercase">
                {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-[10px] text-red-700 font-bold leading-none">SECURE SESSION ACTIVE</p>
            </div>
            <div className="h-9 w-9 bg-gray-50 border border-gray-200 rounded flex items-center justify-center text-gray-500 relative hover:border-[#7f1d1d] hover:text-[#7f1d1d] cursor-pointer transition-all">
               <Bell className="h-4 w-4" />
               <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-600 rounded-full"></span>
            </div>
          </div>
        </header>

        {/* Page Area */}
        <main className="flex-1 overflow-y-auto bg-[#f4f4f5] p-6">
          <div className="bg-white min-h-full rounded-lg shadow-sm border border-gray-200 p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout