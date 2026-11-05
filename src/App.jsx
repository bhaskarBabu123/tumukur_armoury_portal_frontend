import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import { AuthProvider } from './contexts/AuthContext'
import { FingerprintProvider } from './contexts/FingerprintContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Officers from './pages/Officers'
import Arms from './pages/Arms'
import Ammunition from './pages/Ammunition'
import Munitions from './pages/Munitions'
import IssueItems from './pages/IssueItems'
import ReturnItems from './pages/ReturnItems'
import Transactions from './pages/Transactions'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import AccountabilityRegister from './pages/AccountabilityRegister'

function App() {
  return (
    <AuthProvider>
      <FingerprintProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/officers" element={<Officers />} />
                        <Route path="/arms" element={<Arms />} />
                        <Route path="/ammunition" element={<Ammunition />} />
                        <Route path="/munitions" element={<Munitions />} />
                        <Route path="/issue" element={<IssueItems />} />
                        <Route path="/return" element={<ReturnItems />} />
                        <Route path="/transactions" element={<Transactions />} />
                        <Route path="/accountability" element={<AccountabilityRegister />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/settings" element={<Settings />} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              className="toast-container"
            />
          </div>
        </Router>
      </FingerprintProvider>
    </AuthProvider>
  )
}

export default App