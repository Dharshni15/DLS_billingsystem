import express from 'express';
import Discount from '../models/Discount.js';
import { verifyJWT } from '../utils/jwt.js';

const router = express.Router();

// Middleware to verify admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get all active discounts
router.get('/', async (req, res) => {
  try {
    const { code, active } = req.query;
    let query = { active: active !== 'false' };
    if (code) query.code = code;
    const discounts = await Discount.find(query).populate('createdBy', 'name email');
    res.json(discounts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Validate discount code
router.post('/validate', async (req, res) => {
  try {
    const { code, orderValue, productIds } = req.body;
    const discount = await Discount.findOne({ code: code.toUpperCase(), active: true });
    
    if (!discount) return res.status(404).json({ error: 'Discount code not found' });
    
    const now = new Date();
    if (now < discount.validFrom || now > discount.validUntil) {
      return res.status(400).json({ error: 'Discount code expired' });
    }
    
    if (discount.maxUsage && discount.usageCount >= discount.maxUsage) {
      return res.status(400).json({ error: 'Discount code max usage reached' });
    }
    
    if (discount.minOrderValue && orderValue < discount.minOrderValue) {
      return res.status(400).json({ error: `Minimum order value ${discount.minOrderValue} required` });
    }
    
    res.json(discount);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create discount (admin only)
router.post('/', verifyJWT, isAdmin, async (req, res) => {
  try {
    req.body.createdBy = req.user._id;
    const discount = new Discount(req.body);
    await discount.save();
    res.status(201).json(discount);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Update discount (admin only)
router.put('/:id', verifyJWT, isAdmin, async (req, res) => {
  try {
    const discount = await Discount.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!discount) return res.status(404).json({ error: 'Discount not found' });
    res.json(discount);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Delete discount (admin only)
router.delete('/:id', verifyJWT, isAdmin, async (req, res) => {
  try {
    const discount = await Discount.findByIdAndDelete(req.params.id);
    if (!discount) return res.status(404).json({ error: 'Discount not found' });
    res.json({ message: 'Discount deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
