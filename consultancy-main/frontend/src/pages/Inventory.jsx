import React, { useState, useEffect } from 'react'
import { listInventory, getLowStockItems, updateInventory } from '../api'
import { motion } from 'framer-motion'

export default function Inventory() {
  const [inventory, setInventory] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showMovement, setShowMovement] = useState(null)
  const [tab, setTab] = useState('all')
  const [movementData, setMovementData] = useState({
    type: 'in',
    quantity: '',
    reason: ''
  })

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    try {
      setLoading(true)
      const [invData, lowStockData] = await Promise.all([
        listInventory({}),
        getLowStockItems()
      ])
      setInventory(invData)
      setLowStock(lowStockData)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleMovement = async (id) => {
    if (!movementData.quantity) return
    try {
      await updateInventory(id, {
        movement: {
          type: movementData.type,
          quantity: parseInt(movementData.quantity),
          reason: movementData.reason
        }
      })
      setShowMovement(null)
      setMovementData({ type: 'in', quantity: '', reason: '' })
      await load()
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    }
  }

  if (loading) return <div className="p-6 text-center">Loading inventory...</div>

  const displayData = tab === 'low' ? lowStock : inventory

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Inventory Management</h1>

      {error && <div className="bg-red-50 p-4 rounded-lg text-red-700">{error}</div>}

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setTab('all')}
          className={`px-4 py-2 font-semibold border-b-2 ${tab === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'}`}
        >
          All Items
        </button>
        <button
          onClick={() => setTab('low')}
          className={`px-4 py-2 font-semibold border-b-2 relative ${tab === 'low' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'}`}
        >
          Low Stock
          {lowStock.length > 0 && <span className="absolute -top-2 right-0 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{lowStock.length}</span>}
        </button>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Product</th>
              <th className="px-6 py-3 text-left font-semibold">SKU</th>
              <th className="px-6 py-3 text-right font-semibold">Quantity</th>
              <th className="px-6 py-3 text-right font-semibold">Reserved</th>
              <th className="px-6 py-3 text-right font-semibold">Available</th>
              <th className="px-6 py-3 text-right font-semibold">Min Stock</th>
              <th className="px-6 py-3 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((inv) => {
              const isLow = inv.quantity < inv.minThreshold
              return (
                <motion.tr key={inv._id} className={`border-b hover:bg-gray-50 ${isLow ? 'bg-red-50' : ''}`}>
                  <td className="px-6 py-3">
                    <p className="font-semibold">{inv.productId?.name || 'Unknown'}</p>
                  </td>
                  <td className="px-6 py-3 text-gray-600">{inv.productId?.sku}</td>
                  <td className="px-6 py-3 text-right font-semibold">{inv.quantity}</td>
                  <td className="px-6 py-3 text-right">{inv.reserved}</td>
                  <td className="px-6 py-3 text-right">{inv.available}</td>
                  <td className="px-6 py-3 text-right">{inv.minThreshold}</td>
                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() => setShowMovement(inv._id)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
                    >
                      Move
                    </button>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Movement Modal */}
      {showMovement && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Stock Movement</h3>

            <div className="space-y-4">
              <select
                value={movementData.type}
                onChange={(e) => setMovementData({ ...movementData, type: e.target.value })}
                className="w-full border rounded-lg p-2"
              >
                <option value="in">Stock In</option>
                <option value="out">Stock Out</option>
                <option value="adjustment">Adjustment</option>
                <option value="return">Return</option>
              </select>

              <input
                type="number"
                placeholder="Quantity"
                value={movementData.quantity}
                onChange={(e) => setMovementData({ ...movementData, quantity: e.target.value })}
                className="w-full border rounded-lg p-2"
                required
              />

              <input
                type="text"
                placeholder="Reason"
                value={movementData.reason}
                onChange={(e) => setMovementData({ ...movementData, reason: e.target.value })}
                className="w-full border rounded-lg p-2"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => handleMovement(showMovement)}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Save Movement
                </button>
                <button
                  onClick={() => {
                    setShowMovement(null)
                    setMovementData({ type: 'in', quantity: '', reason: '' })
                  }}
                  className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
