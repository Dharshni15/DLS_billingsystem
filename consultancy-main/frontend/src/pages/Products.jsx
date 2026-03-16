import React, { useEffect, useState } from 'react'
import { createProduct, listProducts, listLowStock, exportProductsExcel, setRole, updateProduct } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { motion } from 'framer-motion'

export default function Products() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')
  const [form, setForm] = useState({ name: '', sku: '', barcode: '', price: 0, taxRate: 0, qty: 0, minStock: 3 })
  const [loading, setLoading] = useState(false)
  const [storeId, setStoreId] = useState('MAIN')
  const [lowStockCount, setLowStockCount] = useState(0)
  const [showLowStock, setShowLowStock] = useState(false)
  const [role, setRoleState] = useState('admin')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', sku: '', barcode: '', price: 0, taxRate: 0, qty: 0, minStock: 3, active: true })
  

  const load = async () => {
    setLoading(true)
    try {
      const data = await listProducts(q ? { q } : {})
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Role wiring for temporary header-based access control
  useEffect(() => {
    // prefer actual auth role; fall back to local state
    if (user?.role) {
      setRole(user.role)
      setRoleState(user.role)
    } else {
      setRole(role)
    }
  }, [user?.role, role])

  const refreshLowStockCount = async () => {
    try {
      const ls = await listLowStock({ storeId })
      setLowStockCount(ls.length)
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => { refreshLowStockCount() }, [storeId])

  // (Favorites removed)

  const submit = async (e) => {
    e.preventDefault()
    try {
      await createProduct({ ...form, price: Number(form.price)||0, taxRate: Number(form.taxRate)||0, qty: Number(form.qty)||0, minStock: Number(form.minStock)||0, storeId })
      setForm({ name: '', sku: '', barcode: '', price: 0, taxRate: 0, qty: 0, minStock: 3 })
      await load()
      await refreshLowStockCount()
    } catch (e) {
      alert(e?.response?.data?.error || 'Create product failed')
    }
  }

  const startEdit = (p) => {
    // derive current qty for store
    const s = (p.stock || []).find(x => x.storeId === storeId) || { qty: 0 }
    setEditingId(p._id)
    setEditForm({
      name: p.name || '',
      sku: p.sku || '',
      barcode: p.barcode || '',
      price: p.price || 0,
      taxRate: p.taxRate || 0,
      qty: s.qty || 0,
      minStock: p.minStock ?? 3,
      active: p.active !== false
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const saveEdit = async (id) => {
    try {
      await updateProduct(id, {
        ...editForm,
        price: Number(editForm.price)||0,
        taxRate: Number(editForm.taxRate)||0,
        qty: Number(editForm.qty)||0,
        minStock: Number(editForm.minStock)||0,
        storeId
      })
      setEditingId(null)
      await load()
      await refreshLowStockCount()
    } catch (e) {
      alert(e?.response?.data?.error || 'Update failed')
    }
  }

  const downloadExcel = async () => {
    try {
      const blob = await exportProductsExcel({ storeId })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'products.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert(e?.response?.data?.error || 'Export failed')
    }
  }

  const toggleLowStock = async () => {
    if (!showLowStock) {
      // load low stock list
      try {
        setLoading(true)
        const ls = await listLowStock({ storeId })
        // adapt records to display
        setItems(ls)
      } catch (e) {
        alert('Failed to load low stock')
      } finally {
        setLoading(false)
      }
    } else {
      await load()
    }
    setShowLowStock(v => !v)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Products</h2>
      {isAdmin && (
        <form onSubmit={submit} className="card p-4 grid md:grid-cols-8 gap-3">
          <input className="rounded bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-brand-500" required placeholder="Name" value={form.name} onChange={(e)=>setForm(f=>({...f, name:e.target.value}))} />
          <input className="rounded bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-brand-500" required placeholder="SKU" value={form.sku} onChange={(e)=>setForm(f=>({...f, sku:e.target.value}))} />
          <input className="rounded bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-brand-500" placeholder="Barcode" value={form.barcode} onChange={(e)=>setForm(f=>({...f, barcode:e.target.value}))} />
          <input className="rounded bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-brand-500" type="number" step="0.01" placeholder="Price" value={form.price} onChange={(e)=>setForm(f=>({...f, price:e.target.value}))} />
          <input className="rounded bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-brand-500" type="number" step="0.01" placeholder="Tax %" value={form.taxRate} onChange={(e)=>setForm(f=>({...f, taxRate:e.target.value}))} />
          <input className="rounded bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-brand-500" type="number" placeholder="Qty" value={form.qty} onChange={(e)=>setForm(f=>({...f, qty:e.target.value}))} />
          <input className="rounded bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-brand-500" type="number" placeholder="Min Stock" value={form.minStock} onChange={(e)=>setForm(f=>({...f, minStock:e.target.value}))} />
          <button type="submit" className="btn-primary">Add</button>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {isAdmin && (
          <>
            <select className="rounded bg-black/30 border border-white/10 px-3 py-2" value={role} onChange={(e)=>setRoleState(e.target.value)}>
              <option value="admin">Admin</option>
              <option value="cashier">Cashier</option>
            </select>
            <select className="rounded bg-black/30 border border-white/10 px-3 py-2" value={storeId} onChange={(e)=>setStoreId(e.target.value)}>
              <option value="MAIN">MAIN</option>
            </select>
          </>
        )}
        <input className="rounded bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-brand-500" placeholder="Search" value={q} onChange={(e)=>setQ(e.target.value)} />
        <button onClick={load} disabled={loading} className="btn-primary">{loading? 'Loading...' : 'Search'}</button>
        {isAdmin && (
          <>
            <button onClick={downloadExcel} className="btn-primary">Export (.xlsx)</button>
            <button onClick={toggleLowStock} className="btn-primary">
              {showLowStock ? 'Show All' : 'Show Low-Stock'}
            </button>
            <span className="text-sm text-white/70">Low-stock: <span className="font-semibold">{lowStockCount}</span></span>
          </>
        )}
      </div>

      <div className="card overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-white/5">
            <tr className="text-left text-sm text-white/70">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">SKU</th>
              {isAdmin && <th className="px-3 py-2">Barcode</th>}
              <th className="px-3 py-2 text-right">Price</th>
              <th className="px-3 py-2 text-right">Tax %</th>
              {isAdmin && !showLowStock && <th className="px-3 py-2 text-right">Qty</th>}
              {isAdmin && !showLowStock && <th className="px-3 py-2 text-right">Min</th>}
              {isAdmin && showLowStock && <th className="px-3 py-2 text-right">Qty</th>}
              {isAdmin && showLowStock && <th className="px-3 py-2 text-right">Min</th>}
              {isAdmin && <th className="px-3 py-2 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {items.map(p => {
              const s = (p.stock || []).find(x => x.storeId === storeId) || { qty: 0 }
              const isEditing = editingId === p._id
              return (
              <motion.tr key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-white/5">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    
                    {isAdmin && isEditing ? <input className="w-full rounded bg-black/30 border border-white/10 px-2 py-1" value={editForm.name} onChange={(e)=>setEditForm(f=>({...f, name:e.target.value}))} /> : p.name}
                  </div>
                </td>
                <td className="px-3 py-2">{isAdmin && isEditing ? <input className="w-full rounded bg-black/30 border border-white/10 px-2 py-1" value={editForm.sku} onChange={(e)=>setEditForm(f=>({...f, sku:e.target.value}))} /> : p.sku}</td>
                {isAdmin && <td className="px-3 py-2">{isEditing ? <input className="w-full rounded bg-black/30 border border-white/10 px-2 py-1" value={editForm.barcode} onChange={(e)=>setEditForm(f=>({...f, barcode:e.target.value}))} /> : (p.barcode || '-')}</td>}
                <td className="px-3 py-2 text-right">{isAdmin && isEditing ? <input className="w-24 rounded bg-black/30 border border-white/10 px-2 py-1" type="number" step="0.01" value={editForm.price} onChange={(e)=>setEditForm(f=>({...f, price:e.target.value}))} /> : (p.price?.toFixed ? p.price.toFixed(2) : p.price)}</td>
                <td className="px-3 py-2 text-right">{isAdmin && isEditing ? <input className="w-20 rounded bg-black/30 border border-white/10 px-2 py-1" type="number" step="0.01" value={editForm.taxRate} onChange={(e)=>setEditForm(f=>({...f, taxRate:e.target.value}))} /> : (p.taxRate || 0)}</td>
                {isAdmin && !showLowStock && <td className="px-3 py-2 text-right">{isEditing ? <input className="w-20 rounded bg-black/30 border border-white/10 px-2 py-1" type="number" value={editForm.qty} onChange={(e)=>setEditForm(f=>({...f, qty:e.target.value}))} /> : s.qty}</td>}
                {isAdmin && !showLowStock && <td className="px-3 py-2 text-right">{isEditing ? <input className="w-20 rounded bg-black/30 border border-white/10 px-2 py-1" type="number" value={editForm.minStock} onChange={(e)=>setEditForm(f=>({...f, minStock:e.target.value}))} /> : (p.minStock ?? 3)}</td>}
                {isAdmin && showLowStock && <td className="px-3 py-2 text-right">{p.qty}</td>}
                {isAdmin && showLowStock && <td className="px-3 py-2 text-right">{p.minStock}</td>}
                {isAdmin && (
                  <td className="px-3 py-2 text-right">
                    {!isEditing ? (
                      <button onClick={()=>startEdit(p)} className="btn-primary">Edit</button>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <button onClick={()=>saveEdit(p._id)} className="btn-primary">Save</button>
                        <button onClick={cancelEdit} className="btn-primary">Cancel</button>
                      </div>
                    )}
                  </td>
                )}
              </motion.tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  )
}
