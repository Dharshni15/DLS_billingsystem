import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getInvoice } from '../api'

export default function Receipt() {
  const { id } = useParams()
  const [inv, setInv] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [printSize, setPrintSize] = useState('80')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await getInvoice(id)
        if (mounted) setInv(data)
      } catch (e) {
        setErr(e?.response?.data?.error || 'Failed to load receipt')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [id])

  const onPrint = () => {
    window.print()
  }

  if (loading) return <div className="card p-4">Loading...</div>
  if (err) return <div className="card p-4 text-red-300">{err}</div>
  if (!inv) return <div className="card p-4">Not found</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <h2 className="text-2xl font-semibold">Receipt</h2>
        <div className="flex gap-2">
          <select className="rounded bg-black/30 border border-white/10 px-2 py-1" value={printSize} onChange={(e)=>setPrintSize(e.target.value)}>
            <option value="58">58mm</option>
            <option value="80">80mm</option>
          </select>
          <button onClick={onPrint} className="btn-primary">Print</button>
          <Link to="/" className="btn-primary">New Sale</Link>
        </div>
      </div>

      <div className={`card p-4 print:shadow-none print:border-0 mx-auto receipt receipt-${printSize}`}>
        <div className="text-center">
          <div className="text-lg font-semibold">SellSmart</div>
          <div className="text-sm text-white/70">Store: {inv.storeId || 'MAIN'}</div>
          <div className="text-sm text-white/70">Date: {new Date(inv.date).toLocaleString()}</div>
          <div className="text-sm text-white/70">Invoice: {inv.number}</div>
          <div className="text-sm text-white/70">Status: {inv.status}</div>
        </div>

        <div className="mt-4 overflow-hidden rounded border border-white/10">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5">
              <tr className="text-left text-white/70">
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-right">Price</th>
                <th className="px-3 py-2 text-right">Disc</th>
                <th className="px-3 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map((it, idx) => (
                <tr key={idx} className="border-t border-white/5">
                  <td className="px-3 py-1">{it.name}</td>
                  <td className="px-3 py-1 text-right">{it.qty}</td>
                  <td className="px-3 py-1 text-right">{Number(it.price).toFixed(2)}</td>
                  <td className="px-3 py-1 text-right">{Number(it.discount||0).toFixed(2)}</td>
                  <td className="px-3 py-1 text-right">{(Number(it.price)*Number(it.qty) - Number(it.discount||0)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 space-y-1 text-sm">
          <div className="flex items-center justify-between"><span>Subtotal</span><span>₹{Number(inv.subtotal).toFixed(2)}</span></div>
          <div className="flex items-center justify-between"><span>Discount</span><span>-₹{Number(inv.discount||0).toFixed(2)}</span></div>
          <div className="flex items-center justify-between"><span>Tax</span><span>₹{Number(inv.tax).toFixed(2)}</span></div>
          <div className="h-px bg-white/10" />
          <div className="flex items-center justify-between text-base font-semibold"><span>Total</span><span>₹{Number(inv.total).toFixed(2)}</span></div>
        </div>

        {/* Payments breakdown */}
        <div className="mt-3 space-y-1 text-sm">
          <div className="font-semibold text-white/80">Payments</div>
          {(inv.payments || []).map((p, i) => (
            <div key={i} className="flex items-center justify-between">
              <span>{p.method}{p.reference ? ` (${p.reference})` : ''}</span>
              <span>₹{Number(p.amount||0).toFixed(2)}</span>
            </div>
          ))}
          <div className="h-px bg-white/10" />
          {(() => {
            const paid = (inv.payments||[]).reduce((a,p)=> a + (Number(p.amount)||0), 0)
            const due = Math.max(0, Number(inv.total||0) - paid)
            return (
              <>
                <div className="flex items-center justify-between"><span>Paid</span><span>₹{paid.toFixed(2)}</span></div>
                <div className="flex items-center justify-between"><span>Due</span><span>₹{due.toFixed(2)}</span></div>
              </>
            )
          })()}
          <div className="text-center text-xs text-white/60 mt-2">Thank you! Visit again.</div>
        </div>
      </div>

      <style>{`
        .receipt { max-width: 320px; }
        .receipt-58 { width: 58mm; }
        .receipt-80 { width: 80mm; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          nav, .print\\:hidden { display: none !important; }
          .card { background: white !important; color: black !important; box-shadow: none !important; }
          .container { max-width: 100% !important; padding: 0 12px !important; }
          .receipt { margin: 0 auto !important; }
        }
      `}</style>
    </div>
  )
}
