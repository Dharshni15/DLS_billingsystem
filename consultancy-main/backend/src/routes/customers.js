import { Router } from 'express';
import Customer from '../models/Customer.js';

const router = Router();

// Create
router.post('/', async (req, res) => {
  try {
    const c = await Customer.create(req.body);
    res.status(201).json(c);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// List/search
router.get('/', async (req, res) => {
  try {
    const { q, limit = 50 } = req.query;
    const filter = q ? { $text: { $search: q } } : {};
    const items = await Customer.find(filter).limit(Number(limit)).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Top customers by points
router.get('/utils/top', async (req, res) => {
  try {
    const { limit = 3 } = req.query;
    const items = await Customer.find({ points: { $gt: 0 } })
      .sort({ points: -1, createdAt: 1 })
      .limit(Number(limit))
      .select({ name: 1, code: 1, points: 1, phone: 1, email: 1 });
    res.json(items);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Get by id
router.get('/:id', async (req, res) => {
  try {
    const c = await Customer.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Not found' });
    res.json(c);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Update
router.put('/:id', async (req, res) => {
  try {
    const c = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!c) return res.status(404).json({ error: 'Not found' });
    res.json(c);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Delete
router.delete('/:id', async (req, res) => {
  try {
    const r = await Customer.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
