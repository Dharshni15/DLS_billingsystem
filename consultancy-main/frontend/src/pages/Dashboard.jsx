import React, { useState, useEffect } from 'react'
import { getDashboardMetrics, getSalesTrends, getCategoryBreakdown } from '../api'
import { motion } from 'framer-motion'

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null)
  const [trends, setTrends] = useState(null)
  const [categories, setCategories] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState(30)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [metricsData, trendsData, categoriesData] = await Promise.all([
          getDashboardMetrics(),
          getSalesTrends({ days: selectedPeriod }),
          getCategoryBreakdown()
        ])
        setMetrics(metricsData)
        setTrends(trendsData)
        setCategories(categoriesData)
      } catch (err) {
        setError(err.response?.data?.error || err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedPeriod])

  if (loading) return <div className="p-6 text-center">Loading dashboard...</div>
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time business analytics and insights</p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Key Metrics - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-700 text-sm font-semibold">Total Sales Today</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">${metrics?.totalSales?.toFixed(2) || '0.00'}</p>
              <p className="text-xs text-gray-600 mt-3">📊 {metrics?.totalOrders || 0} orders</p>
            </div>
            <span className="text-3xl">💰</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-sm border-l-4 border-green-500 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-700 text-sm font-semibold">Avg Order Value</p>
              <p className="text-3xl font-bold text-green-600 mt-2">${metrics?.avgOrderValue?.toFixed(2) || '0.00'}</p>
              <p className="text-xs text-gray-600 mt-3">Per transaction</p>
            </div>
            <span className="text-3xl">📈</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-sm border-l-4 border-purple-500 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-700 text-sm font-semibold">Total Customers</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{metrics?.totalCustomers || 0}</p>
              <p className="text-xs text-gray-600 mt-3">Registered</p>
            </div>
            <span className="text-3xl">👥</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl shadow-sm border-l-4 border-orange-500 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-700 text-sm font-semibold">Low Stock Items</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{metrics?.lowStockProducts || 0}</p>
              <p className="text-xs text-gray-600 mt-3">⚠️ Attention needed</p>
            </div>
            <span className="text-3xl">📦</span>
          </div>
        </motion.div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">Total Products</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{metrics?.totalProducts || 0}</p>
            </div>
            <span className="text-4xl text-indigo-200">🏷️</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-cyan-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">Today's Date</p>
              <p className="text-lg font-bold text-cyan-600 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
            </div>
            <span className="text-4xl text-cyan-200">📅</span>
          </div>
        </motion.div>
      </div>

      {/* Sales Trends Chart with Period Selector */}
      {trends && trends.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Sales Trends</h2>
            <div className="flex gap-2">
              {[7, 14, 30].map(days => (
                <button
                  key={days}
                  onClick={() => setSelectedPeriod(days)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                    selectedPeriod === days
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Last {days}d
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 flex items-end gap-1 bg-gray-50 p-4 rounded-lg">
            {trends.map((trend, idx) => {
              const maxSales = Math.max(...trends.map(t => t.sales || 0))
              const heightPercent = maxSales > 0 ? (trend.sales / maxSales) * 100 : 0
              return (
                <motion.div
                  key={idx}
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercent}%` }}
                  transition={{ delay: idx * 0.02 }}
                  className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t hover:from-blue-600 hover:to-blue-500 relative group cursor-pointer"
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-center text-xs font-bold bg-gray-900 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                    ${trend.sales?.toFixed(0)} / {trend.orders || 0}
                  </div>
                </motion.div>
              )
            })}
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">Daily Sales Performance ($ / Orders)</p>
        </motion.div>
      )}


      {/* Footer Note */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-sm text-blue-900">
        💡 <strong>Pro Tip:</strong> Monitor low stock items regularly to ensure optimal inventory management.
      </motion.div>
    </div>
  )
}
