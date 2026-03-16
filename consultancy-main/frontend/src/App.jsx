import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom'
import POS from './pages/POS'
import Home from './pages/Home'
import Receipt from './pages/Receipt'
import Products from './pages/Products'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import OnlineOrders from './pages/OnlineOrders'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import ImportExport from './pages/ImportExport'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from './contexts/AuthContext'
import { listOnlineOrders } from './api'

function Layout({ children }) {
  const { user, logout } = useAuth()
  const [notifCount, setNotifCount] = useState(0)
  

  // Simple polling-based order status notification badge (customers only)
  useEffect(() => {
    if (!user) return
    if (user.role !== 'customer') { setNotifCount(0); return }
    let stop = false
    const key = `orderStatusSeen:${user.id || user._id || 'me'}`
    const parseSeen = () => {
      try { return JSON.parse(localStorage.getItem(key) || '{}') } catch { return {} }
    }
    const tick = async () => {
      try {
        const items = await listOnlineOrders({})
        const seen = parseSeen()
        // count orders whose status changed since last seen
        let changed = 0
        const nextSeen = { ...seen }
        for (const o of items) {
          const prev = seen[o._id]
          if (prev && prev !== o.status) changed++
          if (!prev) nextSeen[o._id] = o.status
        }
        setNotifCount(changed)
        localStorage.setItem(key, JSON.stringify(nextSeen))
      } catch {}
      if (!stop) timer = setTimeout(tick, 10000)
    }
    let timer = setTimeout(tick, 500)
    return () => { stop = true; clearTimeout(timer) }
  }, [user])

  // (Favorites removed)
  return (
    <div className="min-h-screen">
      <nav className="bg-gradient-to-r from-brand-900 to-brand-700 border-b border-white/10">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <NavLink to="/home" className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="h-10 w-20 rounded object-cover" />
              <span className="text-white font-semibold tracking-wide">SellSmart</span>
            </NavLink>
          </div>
          <div className="flex items-center gap-4 text-white/80">
            {/* Conditional links based on role */}
            {user && user.role === 'admin' && (
              <>
                <NavLink to="/dashboard" className={({isActive})=>`px-3 py-2 rounded hover:bg-white/10 ${isActive? 'bg-white/10 text-white' : ''}`}>Dashboard</NavLink>
                <NavLink to="/" end className={({isActive})=>`px-3 py-2 rounded hover:bg-white/10 ${isActive? 'bg-white/10 text-white' : ''}`}>POS</NavLink>
                <NavLink to="/customers" className={({isActive})=>`px-3 py-2 rounded hover:bg-white/10 ${isActive? 'bg-white/10 text-white' : ''}`}>Customers</NavLink>
                <NavLink to="/import-export" className={({isActive})=>`px-3 py-2 rounded hover:bg-white/10 ${isActive? 'bg-white/10 text-white' : ''}`}>Import/Export</NavLink>
              </>
            )}

            {user && (
              <>
                <NavLink to="/products" className={({isActive})=>`px-3 py-2 rounded hover:bg-white/10 ${isActive? 'bg-white/10 text-white' : ''}`}>Products</NavLink>
                <NavLink to="/online-orders" className={({isActive})=>`px-3 py-2 rounded hover:bg-white/10 ${isActive? 'bg-white/10 text-white' : ''}`}>Online Orders</NavLink>
              </>
            )}
            
            {user && user.role === 'customer' && (
              <button
                onClick={async ()=>{
                  try {
                    const items = await listOnlineOrders({})
                    const key = `orderStatusSeen:${user.id || user._id || 'me'}`
                    const nextSeen = {}
                    for (const o of items) nextSeen[o._id] = o.status
                    localStorage.setItem(key, JSON.stringify(nextSeen))
                    setNotifCount(0)
                  } catch {}
                }}
                className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20"
                title="Mark all as seen"
              >Mark all as seen</button>
            )}
            {!user && <NavLink to="/login" className={({isActive})=>`px-3 py-2 rounded hover:bg-white/10 ${isActive? 'bg-white/10 text-white' : ''}`}>Login</NavLink>}
            {!user && <NavLink to="/signup" className={({isActive})=>`px-3 py-2 rounded hover:bg-white/10 ${isActive? 'bg-white/10 text-white' : ''}`}>Signup</NavLink>}
            {user && (
              <button onClick={logout} className="px-3 py-2 rounded hover:bg-white/10">Logout</button>
            )}
          </div>
        </div>
      </nav>
      <main className="container py-6">{children}</main>
    </div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  const { user } = useAuth()

  const RequireAdmin = ({ children }) => {
    if (!user) return <Navigate to="/login" replace />
    if (user.role !== 'admin') return <Navigate to="/online-orders" replace />
    return children
  }

  const RequireAuth = ({ children }) => {
    if (!user) return <Navigate to="/login" replace />
    return children
  }
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <RequireAdmin>
                <POS />
              </RequireAdmin>
            </motion.div>
          }
        />
        <Route
          path="/home"
          element={
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <Home />
            </motion.div>
          }
        />
        <Route
          path="/dashboard"
          element={
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <RequireAdmin>
                <Dashboard />
              </RequireAdmin>
            </motion.div>
          }
        />
        <Route
          path="/products"
          element={
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <RequireAuth>
                <Products />
              </RequireAuth>
            </motion.div>
          }
        />
        <Route
          path="/customers"
          element={
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <RequireAdmin>
                <Customers />
              </RequireAdmin>
            </motion.div>
          }
        />
        <Route
          path="/customers/:id"
          element={
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <RequireAdmin>
                <CustomerDetail />
              </RequireAdmin>
            </motion.div>
          }
        />
        <Route
          path="/import-export"
          element={
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <RequireAdmin>
                <ImportExport />
              </RequireAdmin>
            </motion.div>
          }
        />
        <Route
          path="/receipt/:id"
          element={
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <RequireAdmin>
                <Receipt />
              </RequireAdmin>
            </motion.div>
          }
        />
        <Route
          path="/online-orders"
          element={
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <RequireAuth>
                <OnlineOrders />
              </RequireAuth>
            </motion.div>
          }
        />
        <Route
          path="/login"
          element={
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <Login />
            </motion.div>
          }
        />
        <Route
          path="/signup"
          element={
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <Signup />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <AnimatedRoutes />
      </Layout>
    </BrowserRouter>
  )
}
