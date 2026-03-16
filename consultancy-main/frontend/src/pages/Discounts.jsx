import React, { useState, useEffect } from 'react'
import { listDiscounts, createDiscount, updateDiscount, deleteDiscount } from '../api'
import { motion } from 'framer-motion'

export default function Discounts() {
  const [discounts, setDiscounts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    minOrderValue: 0,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    maxUsage: '',
    active: true
  })

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    try {
      setLoading(true)
      const data = await listDiscounts({ active: 'true' })
      setDiscounts(data)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        minOrderValue: parseFloat(formData.minOrderValue) || 0,
        maxUsage: formData.maxUsage ? parseInt(formData.maxUsage) : null
      }

      if (editingId) {
        await updateDiscount(editingId, payload)
      } else {
        await createDiscount(payload)
      }

      await load()
      setShowForm(false)
      setEditingId(null)
      setFormData({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: 0,
        minOrderValue: 0,
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        maxUsage: '',
        active: true
      })
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure?')) {
      try {
        await deleteDiscount(id)
        await load()
      } catch (err) {
        setError(err.response?.data?.error || err.message)
      }
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Promotions & Discounts</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? 'Cancel' : '+ New Discount'}
        </button>
      </div>

      {error && <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-lg text-red-200">{error}</div>}

      {showForm && (
        <motion.form 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit} 
          className="card p-6 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-white/60 ml-1">Discount Code</label>
              <input
                type="text"
                placeholder="e.g. SUMMER50"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full rounded bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-brand-500 text-white"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-white/60 ml-1">Description</label>
              <input
                type="text"
                placeholder="Short description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-brand-500 text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-white/60 ml-1">Discount Type</label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                className="w-full rounded bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-brand-500 text-white"
              >
                <option value="percentage" className="bg-brand-900">Percentage (%)</option>
                <option value="fixed" className="bg-brand-900">Fixed Amount ($)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-white/60 ml-1">Discount Value</label>
              <input
                type="number"
                placeholder="0.00"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                step="0.01"
                className="w-full rounded bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-brand-500 text-white"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-white/60 ml-1">Min Order Value</label>
              <input
                type="number"
                placeholder="0.00"
                value={formData.minOrderValue}
                onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                step="0.01"
                className="w-full rounded bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-brand-500 text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-white/60 ml-1">Max Usage</label>
              <input
                type="number"
                placeholder="Leave blank for unlimited"
                value={formData.maxUsage}
                onChange={(e) => setFormData({ ...formData, maxUsage: e.target.value })}
                className="w-full rounded bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-brand-500 text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-white/60 ml-1">Valid From</label>
              <input
                type="date"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                className="w-full rounded bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-brand-500 text-white"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-white/60 ml-1">Valid Until</label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                className="w-full rounded bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-brand-500 text-white"
                required
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-5 h-5 rounded bg-black/30 border border-white/10 text-brand-500 focus:ring-brand-500"
              />
              <label htmlFor="active" className="text-white/80 font-medium">Active Promotion</label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">

            <button type="submit" className="btn-primary flex-1">
              {editingId ? 'Update Promotion' : 'Save Promotion'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingId(null) }}
              className="flex-1 px-4 py-2 rounded bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.form>
      )}

      {/* Discounts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {discounts.map((discount) => (
          <motion.div 
            key={discount._id} 
            layout
            className="card p-6 flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-brand-400">{discount.code}</p>
                  {!discount.active && (
                    <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-bold uppercase border border-red-500/20">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/70">{discount.description || 'No description'}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-white">
                  {discount.discountValue}{discount.discountType === 'percentage' ? '%' : '₹'}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">OFF</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-white/60 mb-6 bg-black/20 p-3 rounded-lg border border-white/5">
              <div>
                <p className="text-[10px] uppercase text-white/30 mb-1">Min Order</p>
                <p className="font-medium text-white/90">₹{discount.minOrderValue}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-white/30 mb-1">Usage</p>
                <p className="font-medium text-white/90">
                  {discount.usageCount}{discount.maxUsage ? ` / ${discount.maxUsage}` : ' (unlimited)'}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] uppercase text-white/30 mb-1">Validity Period</p>
                <p className="font-medium text-white/90 flex items-center gap-1">
                  <span>{new Date(discount.validFrom).toLocaleDateString()}</span>
                  <span className="text-white/20">→</span>
                  <span>{new Date(discount.validUntil).toLocaleDateString()}</span>
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingId(discount._id)
                  setFormData({
                    code: discount.code,
                    description: discount.description,
                    discountType: discount.discountType,
                    discountValue: discount.discountValue,
                    minOrderValue: discount.minOrderValue,
                    validFrom: new Date(discount.validFrom).toISOString().split('T')[0],
                    validUntil: new Date(discount.validUntil).toISOString().split('T')[0],
                    maxUsage: discount.maxUsage || '',
                    active: discount.active
                  })
                  setShowForm(true)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="flex-1 bg-brand-500/20 text-brand-200 border border-brand-500/30 px-3 py-2 rounded text-sm hover:bg-brand-500/30 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(discount._id)}
                className="flex-1 bg-red-500/10 text-red-300 border border-red-500/20 px-3 py-2 rounded text-sm hover:bg-red-500/20 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {discounts.length === 0 && !loading && (
        <div className="card p-12 text-center">
          <p className="text-white/40 text-lg">No promotions available yet.</p>
          <button 
            onClick={() => setShowForm(true)}
            className="mt-4 text-brand-400 hover:underline"
          >
            Create your first discount code
          </button>
        </div>
      )}
    </div>
  )

}
