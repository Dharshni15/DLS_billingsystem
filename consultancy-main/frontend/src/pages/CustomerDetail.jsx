import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCustomer, listInvoices } from '../api'
import { motion } from 'framer-motion'

export default function CustomerDetail() {
  const { id } = useParams()
  const [customer, setCustomer] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState({ paid: 0, due: 0, total: 0 })

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [c, inv] = await Promise.all([
          getCustomer(id),
          listInvoices({ customerId: id, limit: 200 })
        ])
        if (!mounted) return
        setCustomer(c)
        setInvoices(inv)
        // compute summary
        const totals = inv.reduce((acc, v) => {
          const paid = (v.payments || []).reduce((a, p) => a + (Number(p.amount) || 0), 0)
          acc.paid += paid
          acc.total += Number(v.total || 0)
          acc.due += Math.max(0, Number(v.total || 0) - paid)
          return acc
        }, { paid: 0, due: 0, total: 0 })
        setSummary(totals)
      } catch (e) {
        setError(e?.response?.data?.error || 'Failed to load customer details')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [id])

  if (loading) return <div className="card p-4">Loading...</div>
  if (error) return <div className="card p-4 text-red-300">{error}</div>
  if (!customer) return <div className="card p-4">Not found</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Customer Details</h2>
        <Link to="/customers" className="btn-primary">Back</Link>
      </div>

      <div className="card p-4 grid md:grid-cols-2 gap-3 text-sm">
        <div><span className="text-white/60">Name</span><div className="font-medium">{customer.name}</div></div>
        <div><span className="text-white/60">Code</span><div className="font-medium">{customer.code || '-'}</div></div>
        <div><span className="text-white/60">Phone</span><div className="font-medium">{customer.phone || '-'}</div></div>
        <div><span className="text-white/60">Email</span><div className="font-medium">{customer.email || '-'}</div></div>
        <div className="md:col-span-2"><span className="text-white/60">Address</span><div className="font-medium">{customer.address || '-'}</div></div>
        <div><span className="text-white/60">Tax ID</span><div className="font-medium">{customer.taxId || '-'}</div></div>
        <div><span className="text-white/60">Credit Limit</span><div className="font-medium">₹{Number(customer.creditLimit||0).toFixed(2)}</div></div>
        <div><span className="text-white/60">Balance</span><div className="font-medium">₹{Number(customer.balance||0).toFixed(2)}</div></div>
        <div><span className="text-white/60">Status</span><div className="font-medium">{customer.active ? 'Active' : 'Inactive'}</div></div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div className="card p-4"><div className="text-white/60 text-sm">Total Billed</div><div className="text-xl font-semibold">₹{summary.total.toFixed(2)}</div></div>
        <div className="card p-4"><div className="text-white/60 text-sm">Total Paid</div><div className="text-xl font-semibold">₹{summary.paid.toFixed(2)}</div></div>
        <div className="card p-4"><div className="text-white/60 text-sm">Outstanding</div><div className="text-xl font-semibold">₹{summary.due.toFixed(2)}</div></div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-3 py-2 border-b border-white/10 text-white/80">Purchase History</div>
        <table className="min-w-full">
          <thead className="bg-white/5">
            <tr className="text-left text-sm text-white/70">
              <th className="px-3 py-2">Invoice</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2 text-right">Subtotal</th>
              <th className="px-3 py-2 text-right">Tax</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2 text-right">Paid</th>
              <th className="px-3 py-2 text-right">Due</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => {
              const paid = (inv.payments||[]).reduce((a,p)=> a + (Number(p.amount)||0), 0)
              const due = Math.max(0, Number(inv.total||0) - paid)
              return (
              <motion.tr key={inv._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-white/5">
                <td className="px-3 py-2">{inv.number}</td>
                <td className="px-3 py-2">{new Date(inv.date).toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{Number(inv.subtotal||0).toFixed(2)}</td>
                <td className="px-3 py-2 text-right">{Number(inv.tax||0).toFixed(2)}</td>
                <td className="px-3 py-2 text-right">{Number(inv.total||0).toFixed(2)}</td>
                <td className="px-3 py-2 text-right">{paid.toFixed(2)}</td>
                <td className="px-3 py-2 text-right">{due.toFixed(2)}</td>
                <td className="px-3 py-2">{inv.status}</td>
                <td className="px-3 py-2"><Link className="text-brand-300 hover:underline" to={`/receipt/${inv._id}`}>View</Link></td>
              </motion.tr>
            )})}
            {!invoices.length && (
              <tr className="border-t border-white/5"><td className="px-3 py-4 text-white/60" colSpan={7}>No purchases yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Outstanding invoices */}
      <div className="card overflow-hidden">
        <div className="px-3 py-2 border-b border-white/10 text-white/80">Outstanding</div>
        <table className="min-w-full">
          <thead className="bg-white/5">
            <tr className="text-left text-sm text-white/70">
              <th className="px-3 py-2">Invoice</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2 text-right">Paid</th>
              <th className="px-3 py-2 text-right">Due</th>
            </tr>
          </thead>
          <tbody>
            {invoices.filter(v=>{
              const paid = (v.payments||[]).reduce((a,p)=> a + (Number(p.amount)||0), 0)
              return paid < Number(v.total||0)
            }).map(v => {
              const paid = (v.payments||[]).reduce((a,p)=> a + (Number(p.amount)||0), 0)
              const due = Math.max(0, Number(v.total||0) - paid)
              return (
                <tr key={v._id} className="border-t border-white/5">
                  <td className="px-3 py-2">{v.number}</td>
                  <td className="px-3 py-2">{new Date(v.date).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{Number(v.total||0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{paid.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{due.toFixed(2)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Simple ledger (invoices and payments) */}
      <div className="card overflow-hidden">
        <div className="px-3 py-2 border-b border-white/10 text-white/80">Ledger (Summary)</div>
        <table className="min-w-full">
          <thead className="bg-white/5">
            <tr className="text-left text-sm text-white/70">
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Particulars</th>
              <th className="px-3 py-2 text-right">Debit</th>
              <th className="px-3 py-2 text-right">Credit</th>
            </tr>
          </thead>
          <tbody>
            {invoices.flatMap(v => {
              const rows = [
                { date: v.date, text: `Invoice ${v.number}`, debit: Number(v.total||0), credit: 0 }
              ]
              for (const p of (v.payments||[])) {
                rows.push({ date: v.date, text: `${p.method}${p.reference? ' ('+p.reference+')':''}`, debit: 0, credit: Number(p.amount||0) })
              }
              return rows
            }).sort((a,b)=> new Date(a.date) - new Date(b.date)).map((row, idx) => (
              <tr key={idx} className="border-t border-white/5">
                <td className="px-3 py-2">{new Date(row.date).toLocaleString()}</td>
                <td className="px-3 py-2">{row.text}</td>
                <td className="px-3 py-2 text-right">{row.debit ? row.debit.toFixed(2) : '-'}</td>
                <td className="px-3 py-2 text-right">{row.credit ? row.credit.toFixed(2) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
