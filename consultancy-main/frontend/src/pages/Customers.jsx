import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { createCustomer, listCustomers, listTopCustomers } from '../api'
import { motion } from 'framer-motion'

export default function Customers() {
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [top, setTop] = useState([])

  const load = async () => {
    setLoading(true)
    try {
      const data = await listCustomers(q ? { q } : {})
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    (async () => {
      try { const t = await listTopCustomers({ limit: 3 }); setTop(t) } catch {}
    })()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    try {
      await createCustomer(form)
      setForm({ name: '', phone: '', email: '' })
      await load()
    } catch (e) {
      alert(e?.response?.data?.error || 'Create customer failed')
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Customers</h2>

      {/* Top 3 customers by points */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-white/80">Top 3 Customers (by points)</div>
          <div className="text-xs text-white/60">5% discount auto-applies for these customers</div>
        </div>
        {top.length ? (
          <div className="grid md:grid-cols-3 gap-3">
            {top.map((c, i) => (
              <div key={c._id} className="rounded border border-white/10 bg-black/30 p-3">
                <div className="text-sm text-white/60">#{i+1}</div>
                <div className="font-medium">{c.name} {c.code? `(${c.code})` : ''}</div>
                <div className="text-sm text-white/70">Points: {c.points||0}</div>
                <div className="mt-2"><Link to={`/customers/${c._id}`} className="btn-primary">View History</Link></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-white/60 text-sm">No points yet.</div>
        )}
      </div>
      <form onSubmit={submit} className="card p-4 grid md:grid-cols-5 gap-3 items-center">
        <input className="rounded bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-brand-500" required placeholder="Name" value={form.name} onChange={(e)=>setForm(f=>({...f, name:e.target.value}))} />
        <input className="rounded bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-brand-500" placeholder="Phone" value={form.phone} onChange={(e)=>setForm(f=>({...f, phone:e.target.value}))} />
        <input className="rounded bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-brand-500" placeholder="Email" value={form.email} onChange={(e)=>setForm(f=>({...f, email:e.target.value}))} />
        <div />
        <button type="submit" className="btn-primary">Add</button>
      </form>

      <div className="flex gap-2">
        <input className="rounded bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-brand-500" placeholder="Search" value={q} onChange={(e)=>setQ(e.target.value)} />
        <button onClick={load} disabled={loading} className="btn-primary">{loading? 'Loading...' : 'Search'}</button>
      </div>

      <div className="card overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-white/5">
            <tr className="text-left text-sm text-white/70">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(c => (
              <motion.tr key={c._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-white/5">
                <td className="px-3 py-2"><Link className="text-brand-300 hover:underline" to={`/customers/${c._id}`}>{c.name}</Link></td>
                <td className="px-3 py-2">{c.code || '-'}</td>
                <td className="px-3 py-2">{c.phone || '-'}</td>
                <td className="px-3 py-2">{c.email || '-'}</td>
                <td className="px-3 py-2">{new Date(c.createdAt).toLocaleString()}</td>
                <td className="px-3 py-2 text-right">
                  <Link to={`/customers/${c._id}`} className="btn-primary">View History</Link>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
