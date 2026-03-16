import express from 'express';
import Inventory from '../models/Inventory.js';
import Product from '../models/Product.js';
import { verifyJWT } from '../utils/jwt.js';

const router = express.Router();

// Middleware to verify admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get all inventory
router.get('/', verifyJWT, isAdmin, async (req, res) => {
  try {
    const { storeId } = req.query;
    let query = {};
    if (storeId) query.storeId = storeId;
    const inventory = await Inventory.find(query).populate('productId');
    res.json(inventory);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get low stock items
router.get('/low-stock', verifyJWT, isAdmin, async (req, res) => {
  try {
    const inventory = await Inventory.find({ $expr: { $lt: ['$quantity', '$minThreshold'] } }).populate('productId');
    res.json(inventory);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get inventory by product
router.get('/product/:productId', verifyJWT, async (req, res) => {
  try {
    const inventory = await Inventory.find({ productId: req.params.productId });
    res.json(inventory);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update inventory (admin only)
router.put('/:id', verifyJWT, isAdmin, async (req, res) => {
  try {
    const { quantity, movement } = req.body;
    const inventory = await Inventory.findById(req.params.id);
    
    if (!inventory) return res.status(404).json({ error: 'Inventory not found' });
    
    if (quantity !== undefined) {
      inventory.quantity = quantity;
      inventory.available = inventory.quantity - inventory.reserved;
    }
    
    if (movement) {
      movement.userId = req.user._id;
      movement.date = new Date();
      inventory.movements.push(movement);
      
      // Update quantity based on movement type
      if (movement.type === 'in') {
        inventory.quantity += movement.quantity;
      } else if (movement.type === 'out') {
        inventory.quantity -= movement.quantity;
      }
      
      inventory.available = inventory.quantity - inventory.reserved;
      
      if (movement.type === 'in') {
        inventory.lastRestockDate = new Date();
      }
    }
    
    await inventory.save();
    res.json(inventory);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Reserve inventory
router.post('/:id/reserve', verifyJWT, async (req, res) => {
  try {
    const { quantity } = req.body;
    const inventory = await Inventory.findById(req.params.id);
    
    if (!inventory) return res.status(404).json({ error: 'Inventory not found' });
    if (inventory.available < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }
    
    inventory.reserved += quantity;
    inventory.available -= quantity;
    await inventory.save();
    
    res.json(inventory);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
