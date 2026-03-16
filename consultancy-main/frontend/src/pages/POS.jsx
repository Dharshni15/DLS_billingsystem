import React, { useState, useMemo, useEffect, useRef } from 'react'
import { lookupProduct, createInvoice, listCustomers, createCustomer, listTopCustomers, createPaymentIntent, confirmPaymentIntent } from '../api'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

function POS() {
  const [barcode, setBarcode] = useState('')
  const [cart, setCart] = useState([])
  const [customerName, setCustomerName] = useState('Walk-in')
  const [cashier, setCashier] = useState('cashier1')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()
  const [payments, setPayments] = useState([]) // [{amount, reference?}]
  const [cashReceived, setCashReceived] = useState('')
  const barcodeRef = useRef(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerOptions, setCustomerOptions] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showCustomerPrompt, setShowCustomerPrompt] = useState(false)
  const [creatingCustomer, setCreatingCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' })
  const [requireCustomer, setRequireCustomer] = useState(false)
  const [topCustomers, setTopCustomers] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('cash') // 'cash' or 'card'
  const [processingPayment, setProcessingPayment] = useState(false)
  const [clientSecret, setClientSecret] = useState('')
  const [showPaymentForm, setShowPaymentForm] = useState(false)

  // Determine if selected customer is in top 3 for loyalty
  const isTopCustomer = useMemo(() => (
    selectedCustomer && topCustomers.some(tc => tc._id === selectedCustomer._id)
  ), [selectedCustomer, topCustomers])

  // Build effective cart (auto 5% discount for top customers)
  const effectiveCart = useMemo(() => {
    if (!isTopCustomer) return cart
    return cart.map(it => {
      const base = (Number(it.price)||0) * (Number(it.qty)||0)
      const extra = 0.05 * base
      return { ...it, discount: Number(it.discount||0) + extra }
    })
  }, [cart, isTopCustomer])

  // Compute totals similar to backend logic (with per-line discount and taxRate%)
  const totals = useMemo(() => {
    let subtotal = 0
    let tax = 0
    let discount = 0
    for (const it of effectiveCart) {
      const line = (Number(it.price)||0) * (Number(it.qty)||0)
      const lineDiscount = Number(it.discount)||0
      const taxable = Math.max(0, line - lineDiscount)
      const lineTax = Math.round((taxable * (Number(it.taxRate)||0))) / 100
      subtotal += taxable
      tax += lineTax
      discount += lineDiscount
    }
    const total = subtotal + tax
    return { subtotal, tax, discount, total }
  }, [effectiveCart])

  const addByCode = async () => {
    if (!barcode) return
    try {
      const p = await lookupProduct(barcode)
      // Check store stock (MAIN) and prevent adding if out of stock
      const row = (p.stock || []).find(s => String(s.storeId) === 'MAIN')
      const available = Number(row?.qty || 0)
      if (available < 1) {
        alert('Out of stock')
        return prev => prev
      }
      setCart((prev) => {
        const idx = prev.findIndex((x) => x.sku === p.sku)
        if (idx >= 0) {
          const next = [...prev]
          const desired = next[idx].qty + 1
          if (desired > available) {
            alert(`Out of stock: only ${available} available`)
            return prev
          }
          next[idx] = { ...next[idx], qty: desired }
          return next
        }
        return [...prev, { sku: p.sku, productId: p._id, name: p.name, price: p.price, qty: 1, taxRate: p.taxRate || 0, discount: 0 }]
      })
      setBarcode('')
    } catch (e) {
      alert('Product not found')
    }
  }

  const updateQty = (sku, qty) => {
    setCart((prev) => prev.map((i) => (i.sku === sku ? { ...i, qty: Math.max(1, Number(qty)||1) } : i)))
  }

  const removeItem = (sku) => setCart((prev) => prev.filter((i) => i.sku !== sku))

  const updateDiscount = (sku, value) => {
    setCart((prev) => prev.map((i) => (i.sku === sku ? { ...i, discount: Math.max(0, Number(value)||0) } : i)))
  }

  const finalizeCheckout = async () => {
    // prevent overpay on submission (cap at total) – dueNow computed but not used to allow partials
    const paid = payments.reduce((a,p)=>a + (Number(p.amount)||0), 0)
    const dueNow = Math.max(0, totals.total - paid)
    setSaving(true)
    try {
      const payload = {
        items: effectiveCart.map(({ productId, sku, name, qty, price, taxRate, discount }) => ({ productId, sku, name, qty, price, taxRate, discount })),
        payments: payments.map(p=>({ method: p.method || 'Cash', amount: Number(p.amount)||0, reference: p.reference || '' })),
        customerId: selectedCustomer?._id,
        customerName: selectedCustomer?.name || customerName,
        cashier,
        storeId: 'MAIN'
      }
      const inv = await createInvoice(payload)
      setCart([])
      setPayments([])
      navigate(`/receipt/${inv._id}`)
    } catch (e) {
      alert(e?.response?.data?.error || 'Checkout failed')
    } finally {
      setSaving(false)
    }
  }

  const checkout = async () => {
    if (!cart.length) return
    const paid = payments.reduce((a,p)=>a + (Number(p.amount)||0), 0)
    if (paid <= 0) {
      alert('Add a payment before checkout')
      return
    }
    // If no customer selected, show optional prompt (can continue without)
    if (!selectedCustomer && !showCustomerPrompt) {
      setShowCustomerPrompt(true)
      return
    }
    await finalizeCheckout()
  }

  const handlePaymentAndCheckout = async () => {
    if (paymentMethod === 'card') {
      await handleStripePayment()
    } else {
      // For cash payments, proceed directly to checkout
      await checkout()
    }
  }

  const createCustomerInline = async () => {
    if (!newCustomer.name.trim()) { alert('Enter customer name'); return }
    setCreatingCustomer(true)
    try {
      const c = await createCustomer(newCustomer)
      setSelectedCustomer(c)
      setCustomerName(c.name)
      setShowCustomerPrompt(false)
      setNewCustomer({ name: '', phone: '', email: '' })
    } catch (e) {
      alert(e?.response?.data?.error || 'Create customer failed')
    } finally {
      setCreatingCustomer(false)
    }
  }

  const handleStripePayment = async () => {
    if (!cart.length) return
    setProcessingPayment(true)
    try {
      const { clientSecret: secret } = await createPaymentIntent({
        amount: totals.total,
        currency: 'INR',
        metadata: {
          customerName: selectedCustomer?.name || customerName,
          items: cart.length,
        },
      })
      setClientSecret(secret)
      setShowPaymentForm(true)
    } catch (error) {
      const errMsg = error.response?.data?.error || error.message
      alert('Failed to initialize payment: ' + errMsg)
    } finally {
      setProcessingPayment(false)
    }
  }

  const addQuickPayment = () => {
    const paid = payments.reduce((a,p)=>a + (Number(p.amount)||0), 0)
    const remaining = Math.max(0, totals.total - paid)
    if (remaining <= 0) return
    setPayments(prev => {
      if (prev.length) {
        const next = [...prev]
        next[0] = { ...next[0], amount: Number(next[0].amount||0) + remaining }
        return next
      }
      return [...prev, { amount: remaining }]
    })
  }

  // automatically generate bill with cash payment for full amount
  const quickOrder = async () => {
    if (!cart.length) return
    setPayments([{ amount: totals.total }])
    await finalizeCheckout()
  }

  const updatePaymentAmount = (idx, amt) => {
    const value = Math.max(0, Number(amt)||0)
    setPayments(prev => prev.map((p,i)=> i===idx ? { ...p, amount: value } : p))
  }

  const updatePaymentRef = (idx, ref) => {
    setPayments(prev => prev.map((p,i)=> i===idx ? { ...p, reference: ref } : p))
  }

  const removePayment = (idx) => setPayments(prev => prev.filter((_,i)=>i!==idx))

  const paid = useMemo(() => payments.reduce((a,p)=> a + (Number(p.amount)||0), 0), [payments])
  const due = useMemo(() => Math.max(0, totals.total - paid), [totals.total, paid])
  const change = useMemo(() => Math.max(0, paid - totals.total), [paid, totals.total])

  // Keep cashReceived in sync with Cash payment line if present
  useEffect(() => {
    const first = payments[0]
    if (first) {
      const amt = (Number(first.amount)||0).toString()
      if (amt !== cashReceived.toString()) setCashReceived(amt)
    } else if (cashReceived) {
      setCashReceived('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payments])

  // When user edits Cash Received, update or create Cash payment line
  const onCashReceivedChange = (val) => {
    const value = Math.max(0, Number(val)||0)
    setCashReceived(val)
    setPayments(prev => {
      if (prev.length) {
        const next = [...prev]
        next[0] = { ...next[0], amount: value }
        return next
      }
      return [{ amount: value }]
    })
  }

  // Keyboard shortcuts: Enter attempts checkout
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.ctrlKey || e.altKey || e.metaKey) return
      if (e.key === 'Enter') {
        e.preventDefault()
        checkout()
      }
      if (e.key === 'F2' || e.key === 'f2') {
        e.preventDefault()
        barcodeRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [totals.total, payments])

  // Load top customers once
  useEffect(() => {
    (async () => {
      try {
        const top = await listTopCustomers({ limit: 3 })
        setTopCustomers(top)
      } catch (e) {}
    })()
  }, [])

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Point of Sale</h2>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-4 md:col-span-2">
          <div className="flex gap-3 items-start">
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <input className="flex-1 rounded bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-brand-500" placeholder="Search customer (name/phone/code) e.g., CUST-0001" value={customerSearch} onChange={(e)=>setCustomerSearch(e.target.value)} />
                <button type="button" className="btn-primary" onClick={async()=>{
                  try { const data = await listCustomers(customerSearch? { q: customerSearch, limit: 10 } : { limit: 10 }); setCustomerOptions(data); } catch {}
                }}>Find</button>
              </div>
              {customerOptions.length > 0 && (
                <div className="rounded border border-white/10 bg-black/30 max-h-40 overflow-auto">
                  {customerOptions.map(c => (
                    <button key={c._id} type="button" onClick={()=>{ setSelectedCustomer(c); setCustomerOptions([]); setCustomerSearch(''); setCustomerName(c.name); }} className={`w-full text-left px-3 py-2 hover:bg-white/10 ${selectedCustomer?._id===c._id? 'bg-white/10' : ''}`}>
                      <div className="text-sm">{c.name} {c.code? `(${c.code})` : ''}</div>
                      <div className="text-xs text-white/60">{c.phone||''} {c.email? `· ${c.email}`:''}</div>
                    </button>
                  ))}
                </div>
              )}
              <input className="w-full rounded bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-brand-500" placeholder="Customer name (optional)" value={customerName} onChange={(e)=>{ setCustomerName(e.target.value); setSelectedCustomer(null); }} />
              {selectedCustomer && (
                <div className="text-xs text-white/70">
                  Selected: {selectedCustomer.name} {selectedCustomer.code? `· ${selectedCustomer.code}`:''}
                  {isTopCustomer && <span className="ml-2 inline-block rounded bg-brand-500/20 text-brand-200 px-2 py-0.5">Top customer • 5% off</span>}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 items-end">
              <input className="w-40 rounded bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-brand-500" placeholder="Cashier" value={cashier} onChange={(e)=>setCashier(e.target.value)} />
              <label className="flex items-center gap-2 text-sm text-white/80">
                <input type="checkbox" checked={requireCustomer} onChange={(e)=>setRequireCustomer(e.target.checked)} />
                Require customer
              </label>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <input
              className="rounded bg-black/30 border border-white/10 px-3 py-3 outline-none focus:border-brand-500 w-72"
              placeholder="Scan or enter barcode/SKU"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addByCode()}
              ref={barcodeRef}
            />
            <button className="btn-primary" onClick={addByCode}>Add</button>
          </div>

          <div className="mt-4 overflow-auto rounded border border-white/10">
            <table className="min-w-full">
              <thead className="bg-white/5">
                <tr className="text-left text-sm text-white/70">
                  <th className="px-3 py-2">SKU</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Disc</th>
                  <th className="px-3 py-2 text-right">Price</th>
                  <th className="px-3 py-2 text-right">Line Total</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {cart.map((i) => (
                  <motion.tr key={i.sku} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="border-t border-white/5">
                    <td className="px-3 py-2">{i.sku}</td>
                    <td className="px-3 py-2">{i.name}</td>
                    <td className="px-3 py-2 text-right">
                      <input className="w-20 text-right rounded bg-black/30 border border-white/10 px-2 py-1 outline-none focus:border-brand-500" type="number" min={1} value={i.qty} onChange={(e)=>updateQty(i.sku, e.target.value)} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input className="w-24 text-right rounded bg-black/30 border border-white/10 px-2 py-1 outline-none focus:border-brand-500" type="number" min={0} step="0.01" value={i.discount||0} onChange={(e)=>updateDiscount(i.sku, e.target.value)} />
                    </td>
                    <td className="px-3 py-2 text-right">{i.price.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{(i.price * i.qty - (Number(i.discount)||0)).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right"><button className="text-red-300 hover:text-red-200" onClick={()=>removeItem(i.sku)}>Remove</button></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between text-white/80">
            <span>Subtotal</span>
            <span>₹{totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-white/80">
            <span>Discount</span>
            <span>-₹{totals.discount.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-white/80">
            <span>Tax</span>
            <span>₹{totals.tax.toFixed(2)}</span>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex items-center justify-between text-lg font-semibold">
            <span>Total</span>
            <span>₹{totals.total.toFixed(2)}</span>
          </div>

          <div className="mt-3">
            <div className="mb-3">
              <label className="block text-sm text-white/80 mb-2">Payment Method</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex-1 py-2 px-3 rounded border ${paymentMethod === 'cash' ? 'border-brand-500 bg-brand-500/20' : 'border-white/10 bg-black/30'}`}
                >
                  Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 py-2 px-3 rounded border ${paymentMethod === 'card' ? 'border-brand-500 bg-brand-500/20' : 'border-white/10 bg-black/30'}`}
                >
                  Card
                </button>
              </div>
            </div>

            {paymentMethod === 'cash' && (
              <div className="space-y-2">
                {payments.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      className="flex-1 rounded bg-black/30 border border-white/10 px-2 py-1 text-right"
                      type="number" min={0} step="0.01"
                      value={p.amount}
                      onChange={(e)=>updatePaymentAmount(idx, e.target.value)}
                    />
                    <input
                      className="flex-1 rounded bg-black/30 border border-white/10 px-2 py-1"
                      placeholder="Reference"
                      value={p.reference || ''}
                      onChange={(e)=>updatePaymentRef(idx, e.target.value)}
                    />
                    <button type="button" className="text-red-300 hover:text-red-200" onClick={()=>removePayment(idx)}>Remove</button>
                  </div>
                ))}
                {/* Cash received helper */}
                <div className="flex items-center gap-2">
                  <span className="w-28 text-white/80 text-sm">Cash Received</span>
                  <input
                    className="flex-1 rounded bg-black/30 border border-white/10 px-2 py-1 text-right"
                    type="number" min={0} step="0.01"
                    value={cashReceived}
                    onChange={(e)=>onCashReceivedChange(e.target.value)}
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="space-y-2">
                <div className="text-sm text-white/70 mb-2">
                  Card payment will be processed securely via Stripe
                </div>
                <div className="text-lg font-semibold text-center">
                  Amount: ₹{totals.total.toFixed(2)}
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-white/10" />
          <div className="flex items-center justify-between text-white/80">
            <span>Paid</span>
            <span>₹{paid.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-white/80">
            <span>Due</span>
            <span>₹{due.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-white/80">
            <span>Change</span>
            <span>₹{change.toFixed(2)}</span>
          </div>
          <button disabled={saving} onClick={quickOrder} className="btn-secondary w-full py-3 mt-2">Quick Bill</button>
          <button
            disabled={saving || processingPayment}
            onClick={handlePaymentAndCheckout}
            className="btn-primary w-full py-3 mt-2"
          >
            {processingPayment ? 'Processing Payment...' : paymentMethod === 'card' ? 'Pay with Card' : 'Checkout & Print'}
          </button>
        </div>
      </div>

      {showCustomerPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-4 w-full max-w-lg space-y-3">
            <div className="text-lg font-semibold">Select or Create Customer</div>
            <div className="text-white/70 text-sm">{requireCustomer ? 'Customer selection is required.' : 'This is optional. You can continue without linking a customer.'}</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 text-white/80 text-sm">Quick search</div>
              <div className="col-span-2 flex gap-2">
                <input className="flex-1 rounded bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-brand-500" placeholder="Search (name/phone/code) e.g., CUST-0001" value={customerSearch} onChange={(e)=>setCustomerSearch(e.target.value)} />
                <button type="button" className="btn-primary" onClick={async()=>{
                  try { const data = await listCustomers(customerSearch? { q: customerSearch, limit: 10 } : { limit: 10 }); setCustomerOptions(data); } catch {}
                }}>Find</button>
              </div>
              <div className="col-span-2 max-h-40 overflow-auto rounded border border-white/10 bg-black/30">
                {customerOptions.map(c => (
                  <button key={c._id} type="button" onClick={()=>{ setSelectedCustomer(c); setCustomerName(c.name); setShowCustomerPrompt(false); }} className="w-full text-left px-3 py-2 hover:bg-white/10">
                    <div className="text-sm">{c.name} {c.code? `(${c.code})` : ''}</div>
                    <div className="text-xs text-white/60">{c.phone||''} {c.email? `· ${c.email}`:''}</div>
                  </button>
                ))}
                {!customerOptions.length && <div className="px-3 py-2 text-white/50 text-sm">No results</div>}
              </div>
              <div className="col-span-2 text-white/80 text-sm mt-2">Or create new</div>
              <input className="rounded bg-black/30 border border-white/10 px-3 py-2" placeholder="Name" value={newCustomer.name} onChange={(e)=>setNewCustomer(n=>({...n, name:e.target.value}))} />
              <input className="rounded bg-black/30 border border-white/10 px-3 py-2" placeholder="Phone" value={newCustomer.phone} onChange={(e)=>setNewCustomer(n=>({...n, phone:e.target.value}))} />
              <input className="col-span-2 rounded bg-black/30 border border-white/10 px-3 py-2" placeholder="Email" value={newCustomer.email} onChange={(e)=>setNewCustomer(n=>({...n, email:e.target.value}))} />
              <div className="col-span-2 flex justify-end gap-2">
                {!requireCustomer && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={async()=>{ setShowCustomerPrompt(false); await finalizeCheckout() }}
                  >
                    Continue without customer
                  </button>
                )}
                <button type="button" className="btn-primary" disabled={creatingCustomer} onClick={createCustomerInline}>{creatingCustomer? 'Saving...' : 'Create & Select'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPaymentForm && clientSecret && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md space-y-4">
            <div className="text-lg font-semibold text-center">Complete Payment</div>
            <div className="text-center text-white/70">
              Amount: ₹{totals.total.toFixed(2)}
            </div>
            <StripePaymentForm
              clientSecret={clientSecret}
              customerName={selectedCustomer?.name || customerName}
              onSuccess={async (paymentIntent) => {
                // Add the payment to the payments array
                setPayments(prev => [...prev, {
                  amount: paymentIntent.amount / 100,
                  method: 'Card',
                  reference: paymentIntent.id,
                }])
                setShowPaymentForm(false)
                setClientSecret('')
                alert('Payment successful!')
                // Automatically proceed with checkout
                await checkout()
              }}
              onCancel={() => {
                setShowPaymentForm(false)
                setClientSecret('')
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Stripe Payment Form Component
const StripePaymentForm = ({ clientSecret, onSuccess, onCancel, customerName }) => {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)
    try {
      const cardElement = elements.getElement(CardElement)
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: customerName || 'Walk-in Customer',
          },
        },
      })

      if (error) {
        alert('Payment failed: ' + error.message)
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent)
      }
    } catch (error) {
      alert('Payment processing failed: ' + error.message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-white/10 rounded bg-black/30">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#ffffff',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 btn-secondary"
          disabled={processing}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 btn-primary"
          disabled={!stripe || processing}
        >
          {processing ? 'Processing...' : 'Pay Now'}
        </button>
      </div>
    </form>
  )
}

// Main POS Component with Stripe Provider
const POSWithStripe = () => {
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  const [stripePromise, setStripePromise] = useState(null)

  useEffect(() => {
    if (stripeKey) {
      setStripePromise(loadStripe(stripeKey))
    }
  }, [stripeKey])

  if (!stripeKey) {
    return (
      <div className="card p-8 text-center space-y-4">
        <p className="text-red-400 font-semibold">Stripe Publishable Key Missing</p>
        <p className="text-white/60 text-sm">Please set VITE_STRIPE_PUBLISHABLE_KEY in your environment variables.</p>
        <POS />
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise}>
      <POS />
    </Elements>
  )
}

export default POSWithStripe
