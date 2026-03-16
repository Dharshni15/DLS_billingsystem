import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      nav('/online-orders')
    } catch (e) {
      const errMsg = e.response?.data?.error || e.message
      alert('Login failed: ' + errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto card p-6 space-y-4">
      <h2 className="text-2xl font-semibold">Login</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full rounded bg-black/30 border border-white/10 px-3 py-2" placeholder="Email or username" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input className="w-full rounded bg-black/30 border border-white/10 px-3 py-2" type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading? 'Signing in...' : 'Login'}</button>
      </form>
      <div className="text-sm text-white/70">No account? <Link to="/signup" className="text-brand-300 hover:underline">Signup</Link></div>
    </div>
  )
}
