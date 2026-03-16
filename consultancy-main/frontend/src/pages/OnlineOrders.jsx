import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { listProducts, createOnlineOrder, listOnlineOrders, updateOnlineOrderStatus, setRole, createInvoice } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function OnlineOrders() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  
  // Track orders with unread status change for customers
  const [unreadIds, setUnreadIds] = useState(new Set())

  const seenKey = () => `orderStatusSeen:${user?.id || user?._id || 'me'}`
  const getSeen = () => {
    try { return JSON.parse(localStorage.getItem(seenKey()) || '{}') } catch { return {} }
  }
  const setSeen = (map) => {
    try { localStorage.setItem(seenKey(), JSON.stringify(map)) } catch {}
  }

  const recomputeUnread = (items) => {
    if (!user || user.role !== 'customer') { setUnreadIds(new Set()); return }
    const seen = getSeen()
    const ids = new Set()
    for (const o of items) {
      const prev = seen[o._id]
      if (prev && prev !== o.status) ids.add(o._id)
    }
    setUnreadIds(ids)
  }

  const markRead = (id) => {
    const seen = getSeen()
    const order = orders.find(o => o._id === id)
    if (order) {
      seen[id] = order.status
      setSeen(seen)
      setUnreadIds(prev => { const ns = new Set(prev); ns.delete(id); return ns })
    }
  }

  const markAllRead = () => {
    const seen = getSeen()
    for (const o of orders) seen[o._id] = o.status
    setSeen(seen)
    setUnreadIds(new Set())
  }

  // create form state
  const [q, setQ] = useState('')
  const [productOptions, setProductOptions] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [qty, setQty] = useState(1)
  const [customerName, setCustomerName] = useState('')
  const [address, setAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const items = await listOnlineOrders(statusFilter ? { status: statusFilter } : {})
      setOrders(items)
      recomputeUnread(items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [statusFilter])

  // Keep legacy x-role header in sync for product listing endpoints
  useEffect(() => {
    if (user?.role) setRole(user.role)
  }, [user])

  // (Favorites removed)

  const searchProducts = async () => {
    try {
      const items = await listProducts(q ? { q, limit: 10 } : { limit: 10 })
      setProductOptions(items)
    } catch {}
  }

  const price = useMemo(() => selectedProduct ? Number(selectedProduct.price || 0) : 0, [selectedProduct])

  const submitOrder = async (e) => {
    e.preventDefault()
    if (!selectedProduct) { alert('Select a product'); return }
    if (Number(qty) <= 0) { alert('Enter qty'); return }
    setSubmitting(true)
    try {
      await createOnlineOrder({ productId: selectedProduct._id, qty: Number(qty)||1, customerName, address })
      // clear form
      setSelectedProduct(null)
      setQty(1)
      setCustomerName('')
      setAddress('')
      await load()
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to create order')
    } finally {
      setSubmitting(false)
    }
  }

  const onUpdateStatus = async (id, status) => {
    try {
      await updateOnlineOrderStatus(id, status)
      await load()
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to update status')
    }
  }

  const generateBill = async (order) => {
    try {
      const inv = await createInvoice({
        items: [{
          productId: order.productId,
          sku: order.sku,
          name: order.name,
          qty: order.qty,
          price: order.price,
          taxRate: 0,
          discount: 0
        }],
        payments: [{ method: 'Cash', amount: Number(order.price || 0) * order.qty }],
        customerName: order.customerName || '',
        cashier: user?.name || 'online',
        storeId: order.storeId || 'MAIN'
      })
      // mark delivered so it doesn't get billed again
      await onUpdateStatus(order._id, 'DELIVERED')
      navigate(`/receipt/${inv._id}`)
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to generate bill')
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Online Orders</h2>

      {/* Favorites panel removed */}

      <form onSubmit={submitOrder} className="card p-4 grid md:grid-cols-6 gap-3 items-start">
        <div className="md:col-span-2">
          <div className="text-sm text-white/80 mb-1">Find Product (name/SKU)</div>
          <div className="flex gap-2">
            <input className="flex-1 rounded bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-brand-500" placeholder="Search products" value={q} onChange={(e)=>setQ(e.target.value)} />
            <button type="button" className="btn-primary" onClick={searchProducts}>Search</button>
          </div>
          {productOptions.length > 0 && (
            <div className="mt-2 rounded border border-white/10 bg-black/30 max-h-40 overflow-auto">
              {productOptions.map(p => (
                <button key={p._id} type="button" onClick={()=>{ setSelectedProduct(p); setProductOptions([]); }} className={`w-full text-left px-3 py-2 hover:bg-white/10 ${selectedProduct?._id===p._id? 'bg-white/10' : ''}`}>
                  <div className="text-sm">{p.sku} · {p.name}</div>
                  <div className="text-xs text-white/60">Price: ₹{Number(p.price||0).toFixed(2)}</div>
                </button>
              ))}
            </div>
          )}
          {selectedProduct && (
            <div className="mt-2 text-xs text-white/70">Selected: {selectedProduct.sku} · {selectedProduct.name}</div>
          )}
        </div>
        <div>
          <div className="text-sm text-white/80 mb-1">Qty</div>
          <input className="w-full rounded bg-black/30 border border-white/10 px-3 py-2" type="number" min={1} value={qty} onChange={(e)=>setQty(e.target.value)} />
        </div>
        <div>
          <div className="text-sm text-white/80 mb-1">Price</div>
          <div className="px-3 py-2">₹{price.toFixed(2)}</div>
        </div>
        <div className="md:col-span-2">
          <div className="text-sm text-white/80 mb-1">Customer Name</div>
          <input className="w-full rounded bg-black/30 border border-white/10 px-3 py-2" value={customerName} onChange={(e)=>setCustomerName(e.target.value)} />
        </div>
        <div className="md:col-span-6">
          <div className="text-sm text-white/80 mb-1">Address</div>
          <textarea className="w-full rounded bg-black/30 border border-white/10 px-3 py-2" rows={2} value={address} onChange={(e)=>setAddress(e.target.value)} />
        </div>
        <div className="md:col-span-6 flex justify-end"><button type="submit" disabled={submitting} className="btn-primary">{submitting? 'Placing...' : 'Place Order'}</button></div>
      </form>

      <div className="card p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-white/80">Orders</div>
          <div className="flex items-center gap-2">
            {user?.role === 'customer' && unreadIds.size > 0 && (
              <button onClick={markAllRead} className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20">Mark all as read</button>
            )}
            <select className="rounded bg-black/30 border border-white/10 px-2 py-1 text-sm" value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="PLACED">Placed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
        <div className="overflow-auto rounded border border-white/10">
          <table className="min-w-full">
            <thead className="bg-white/5">
              <tr className="text-left text-sm text-white/70">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">SKU / Name</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-right">Price</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <motion.tr key={o._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`border-t border-white/5 ${user?.role==='customer' && unreadIds.has(o._id) ? 'bg-yellow-500/10' : ''}`}>
                  <td className="px-3 py-2">{new Date(o.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2">{o.sku} · {o.name}</td>
                  <td className="px-3 py-2 text-right">{o.qty}</td>
                  <td className="px-3 py-2 text-right">₹{Number(o.price||0).toFixed(2)}</td>
                  <td className="px-3 py-2">{o.customerName || '-'}</td>
                  <td className="px-3 py-2">{o.status}</td>
                  <td className="px-3 py-2 text-right flex justify-end gap-2">
                    {user?.role === 'admin' ? (
                      <div className="flex items-center gap-2">
                        <select className="rounded bg-black/30 border border-white/10 px-2 py-1 text-sm" value={o.status} onChange={(e)=>onUpdateStatus(o._id, e.target.value)}>
                          <option value="PLACED">Placed</option>
                          <option value="SHIPPED">Shipped</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                        <button onClick={()=>generateBill(o)} className="text-xs px-2 py-1 rounded bg-green-600 hover:bg-green-500">Bill</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        {unreadIds.has(o._id) && (
                          <button onClick={()=>markRead(o._id)} className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20">Mark read</button>
                        )}
                        <span className="text-white/80 text-sm">—</span>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
              {!orders.length && (
                <tr className="border-t border-white/5"><td className="px-3 py-4 text-white/60" colSpan={7}>No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
