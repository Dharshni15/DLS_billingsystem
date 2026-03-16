import { Router } from 'express';
import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';

const router = Router();

function calcTotals(items) {
  let subtotal = 0;
  let tax = 0;
  let discount = 0;
  for (const it of items) {
    const line = it.price * it.qty;
    const lineDiscount = it.discount || 0;
    const taxable = line - lineDiscount;
    const lineTax = Math.round((taxable * (it.taxRate || 0)) ) / 100; // taxRate as percent
    subtotal += taxable;
    tax += lineTax;
    discount += lineDiscount;
  }
  const total = subtotal + tax;
  return { subtotal, tax, discount, total };
}

async function nextInvoiceNumber() {
  const date = new Date();
  const y = String(date.getFullYear());
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = `INV-${y}${m}-`;
  const last = await Invoice.findOne({ number: { $regex: `^${prefix}` } })
    .sort({ createdAt: -1 })
    .lean();
  let seq = 1;
  if (last) {
    const num = parseInt(last.number.split('-').pop(), 10);
    if (!isNaN(num)) seq = num + 1;
  }
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

// Create invoice (sale)
router.post('/', async (req, res) => {
  try {
    const { items = [], payments = [], customerId, customerName, storeId = 'MAIN', cashier } = req.body;
    if (!items.length) return res.status(400).json({ error: 'No items' });

    // enrich items with product data
    const enriched = [];
    for (const it of items) {
      let product = null;
      if (it.productId) product = await Product.findById(it.productId);
      if (!product && it.sku) product = await Product.findOne({ sku: it.sku });
      if (!product) return res.status(400).json({ error: `Product not found for ${it.sku || it.productId}` });
      enriched.push({
        productId: product._id,
        sku: product.sku,
        name: product.name,
        qty: it.qty,
        price: it.price ?? product.price,
        taxRate: it.taxRate ?? product.taxRate ?? 0,
        discount: it.discount ?? 0
      });
    }

    // Validate stock availability per item for the requested store before creating invoice
    for (const it of enriched) {
      const prod = await Product.findById(it.productId).lean();
      if (!prod) return res.status(400).json({ error: `Product not found for item ${it.sku || it.productId}` });
      const row = (prod.stock || []).find(s => String(s.storeId) === String(storeId));
      const available = Number(row?.qty || 0);
      if (available < 1 || available < Number(it.qty || 0)) {
        return res.status(400).json({ error: `Out of stock: ${it.name || it.sku} (available ${available})` });
      }
    }

    const totals = calcTotals(enriched);

    const number = await nextInvoiceNumber();
    const inv = await Invoice.create({
      number,
      storeId,
      cashier,
      customerId,
      customerName,
      items: enriched,
      ...totals,
      payments,
      status: payments.reduce((a, p) => a + p.amount, 0) >= totals.total ? 'PAID' : payments.length ? 'PARTIAL' : 'UNPAID'
    });

    // decrement stock
    for (const it of enriched) {
      await Product.updateOne(
        { _id: it.productId, 'stock.storeId': storeId },
        { $inc: { 'stock.$.qty': -it.qty } }
      );
    }

    // award loyalty points: 1 point per ₹10 of invoice total (rounded down)
    if (customerId) {
      try {
        const pts = Math.floor((totals.total || 0) / 10);
        if (pts > 0) {
          await Customer.updateOne({ _id: customerId }, { $inc: { points: pts } });
        }
      } catch (e) {
        console.warn('Failed to award points', e.message);
      }
    }

    res.status(201).json(inv);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
});

// List invoices
router.get('/', async (req, res) => {
  try {
    const { from, to, limit = 100, customerId } = req.query;
    const q = {};
    if (from) q.date = { ...(q.date || {}), $gte: new Date(from) };
    if (to) q.date = { ...(q.date || {}), $lte: new Date(to) };
    if (customerId) q.customerId = customerId;
    const items = await Invoice.find(q).sort({ date: -1 }).limit(Number(limit));
    res.json(items);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Get invoice by id (for receipt)
router.get('/:id', async (req, res) => {
  try {
    const inv = await Invoice.findById(req.params.id);
    if (!inv) return res.status(404).json({ error: 'Not found' });
    res.json(inv);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
