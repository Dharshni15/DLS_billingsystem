import React, { useState } from 'react'
import { exportProducts, exportCustomers, exportInvoices } from '../api'
import { motion } from 'framer-motion'

export default function ImportExport() {
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const downloadFile = (data, filename) => {
    const url = window.URL.createObjectURL(new Blob([data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.parentNode.removeChild(link)
  }

  const handleExport = async (type) => {
    try {
      setLoading(type)
      let data, filename
      if (type === 'products') {
        data = await exportProducts()
        filename = 'products.xlsx'
      } else if (type === 'customers') {
        data = await exportCustomers()
        filename = 'customers.xlsx'
      } else if (type === 'invoices') {
        data = await exportInvoices()
        filename = 'invoices.xlsx'
      }
      downloadFile(data, filename)
      setSuccess(`${type} exported successfully`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Export Data</h1>

      {error && <div className="bg-red-50 p-4 rounded-lg text-red-700">{error}</div>}
      {success && <div className="bg-green-50 p-4 rounded-lg text-green-700">{success}</div>}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6">Export Data</h2>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Products</h3>
            <p className="text-sm text-gray-600 mb-3">Download all products as Excel file</p>
            <button
              onClick={() => handleExport('products')}
              disabled={loading === 'products'}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading === 'products' ? 'Exporting...' : 'Export Products'}
            </button>
          </div>

          <hr />

          <div>
            <h3 className="font-semibold mb-2">Customers</h3>
            <p className="text-sm text-gray-600 mb-3">Download all customers as Excel file</p>
            <button
              onClick={() => handleExport('customers')}
              disabled={loading === 'customers'}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading === 'customers' ? 'Exporting...' : 'Export Customers'}
            </button>
          </div>

          <hr />

          <div>
            <h3 className="font-semibold mb-2">Invoices</h3>
            <p className="text-sm text-gray-600 mb-3">Download all invoices as Excel file</p>
            <button
              onClick={() => handleExport('invoices')}
              disabled={loading === 'invoices'}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading === 'invoices' ? 'Exporting...' : 'Export Invoices'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
