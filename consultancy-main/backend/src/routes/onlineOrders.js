import { Router } from 'express';
import OnlineOrder from '../models/OnlineOrder.js';
import Product from '../models/Product.js';
import { requireAuth, requireRoles } from '../utils/jwt.js';

const router = Router();

// Create online order linked to product (by productId or sku)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { productId, sku, qty = 1, customerName, address, storeId = 'MAIN' } = req.body || {};
    if (!productId && !sku) return res.status(400).json({ error: 'Provide productId or sku' });
    const p = productId ? await Product.findById(productId) : await Product.findOne({ sku });
    if (!p) return res.status(404).json({ error: 'Product not found' });
    const row = (p.stock || []).find(s => String(s.storeId) === String(storeId));
    const available = Number(row?.qty || 0);
    const q = Math.max(1, Number(qty)||1);
    if (available < 1 || available < q) return res.status(400).json({ error: `Out of stock: ${p.name} (available ${available})` });

    const order = await OnlineOrder.create({
      productId: p._id,
      userId: req.user?._id,
      sku: p.sku,
      name: p.name,
      qty: q,
      price: p.price,
      customerName,
      address,
      storeId,
      status: 'PLACED'
    });

    // decrement stock immediately on order placement
    await Product.updateOne(
      { _id: p._id, 'stock.storeId': storeId },
      { $inc: { 'stock.$.qty': -q } }
    );

    res.status(201).json(order);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// List online orders
router.get('/', requireAuth, async (req, res) => {
  try {
    const { limit = 100, status } = req.query;
    const filter = status ? { status } : {};
    // customers see own orders only
    if (req.user?.role === 'customer') filter.userId = req.user._id;
    const items = await OnlineOrder.find(filter).sort({ createdAt: -1 }).limit(Number(limit));
    res.json(items);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Update status
router.put('/:id/status', requireAuth, requireRoles(['admin']), async (req, res) => {
  try {
    const { status } = req.body || {};
    const allowed = new Set(['PLACED','SHIPPED','DELIVERED','CANCELLED']);
    if (!allowed.has(status)) return res.status(400).json({ error: 'Invalid status' });
    const r = await OnlineOrder.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
