import { Router } from 'express';
import Product from '../models/Product.js';
import { requireRole } from '../utils/auth.js';
import ExcelJS from 'exceljs';

const router = Router();

// Create product (admin only)
router.post('/', requireRole(['admin']), async (req, res) => {
  try {
    const body = req.body || {};
    const payload = { ...body };
    if (body.minStock != null) payload.minStock = Number(body.minStock) || 0;
    if (body.qty != null) payload.stock = [{ storeId: body.storeId || 'MAIN', qty: Number(body.qty) || 0 }];
    const p = await Product.create(payload);
    res.status(201).json(p);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// List/search products (admin or cashier)
router.get('/', requireRole(['admin', 'cashier', 'customer']), async (req, res) => {
  try {
    const { q, limit = 50 } = req.query;
    const filter = q ? { $text: { $search: q } } : {};
    const items = await Product.find(filter).limit(Number(limit)).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Lookup by barcode or sku (must be before /:id)
router.get('/lookup/by-code/:code', requireRole(['admin', 'cashier', 'customer']), async (req, res) => {
  try {
    const { code } = req.params;
    const p = await Product.findOne({ $or: [{ barcode: code }, { sku: code }] });
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// NOTE: specific utility routes must come BEFORE dynamic '/:id'
// Low-stock listing (admin or cashier)
router.get('/utils/low-stock', requireRole(['admin', 'cashier']), async (req, res) => {
  try {
    const { storeId = 'MAIN', threshold } = req.query;
    const products = await Product.find({ active: true }).lean();
    const result = [];
    for (const p of products) {
      const s = (p.stock || []).find((x) => x.storeId === storeId) || { qty: 0 };
      const limit = threshold != null ? Number(threshold) : (p.minStock && p.minStock > 0 ? p.minStock : 3);
      if (s.qty <= limit) {
        result.push({
          _id: p._id,
          sku: p.sku,
          name: p.name,
          storeId,
          qty: s.qty,
          minStock: limit
        });
      }
    }
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Export products to Excel (admin only)
router.get('/export', requireRole(['admin']), async (req, res) => {
  try {
    const { storeId = 'MAIN' } = req.query;
    const items = await Product.find({}).sort({ name: 1 }).lean();

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Products');
    ws.columns = [
      { header: 'SKU', key: 'sku', width: 18 },
      { header: 'Name', key: 'name', width: 32 },
      { header: 'Category', key: 'category', width: 18 },
      { header: 'Price', key: 'price', width: 12 },
      { header: 'Cost', key: 'cost', width: 12 },
      { header: 'Tax %', key: 'taxRate', width: 10 },
      { header: 'Stock (' + storeId + ')', key: 'stock', width: 16 },
      { header: 'Min Stock', key: 'minStock', width: 12 },
      { header: 'Active', key: 'active', width: 10 }
    ];

    for (const p of items) {
      const s = (p.stock || []).find((x) => x.storeId === storeId) || { qty: 0 };
      ws.addRow({
        sku: p.sku,
        name: p.name,
        category: p.category || '',
        price: p.price,
        cost: p.cost || 0,
        taxRate: p.taxRate || 0,
        stock: s.qty,
        minStock: p.minStock || 0,
        active: p.active ? 'Yes' : 'No'
      });
    }

    const buffer = await wb.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="products.xlsx"');
    res.send(buffer);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Get by id
router.get('/:id', requireRole(['admin', 'cashier']), async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Update (admin only)
router.put('/:id', requireRole(['admin']), async (req, res) => {
  try {
    const body = req.body || {};
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });

    // Basic fields
    ['name','sku','barcode','category','price','cost','taxRate','active'].forEach((k)=>{
      if (body[k] != null) p[k] = k === 'active' ? !!body[k] : (['price','cost','taxRate'].includes(k) ? Number(body[k]) : body[k]);
    });
    if (body.minStock != null) p.minStock = Number(body.minStock) || 0;

    // Stock qty for store
    if (body.qty != null) {
      const storeId = body.storeId || 'MAIN';
      const qty = Number(body.qty) || 0;
      const idx = (p.stock || []).findIndex((s) => s.storeId === storeId);
      if (idx >= 0) {
        p.stock[idx].qty = qty;
      } else {
        p.stock.push({ storeId, qty });
      }
    }

    await p.save();
    res.json(p);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Delete (admin only)
router.delete('/:id', requireRole(['admin']), async (req, res) => {
  try {
    const r = await Product.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});


export default router;
