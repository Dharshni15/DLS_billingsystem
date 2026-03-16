import express from 'express';
import Analytics from '../models/Analytics.js';
import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import { verifyJWT } from '../utils/jwt.js';

const router = express.Router();

// Middleware to verify admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get dashboard metrics
router.get('/dashboard', verifyJWT, isAdmin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const invoices = await Invoice.find({ createdAt: { $gte: today } });
    const totalSales = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalOrders = invoices.length;
    
    const products = await Product.find({});
    const lowStockProducts = products.filter(p => {
      const stock = p.stock?.[0]?.qty || 0;
      return stock < (p.minStock || 0);
    }).length;
    
    const pendingInvoices = await Invoice.countDocuments({ paymentStatus: { $ne: 'paid' } });
    const totalCustomers = await Customer.countDocuments({});
    const totalProducts = products.length;
    
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    res.json({
      totalSales,
      totalOrders,
      totalCustomers,
      totalProducts,
      avgOrderValue,
      lowStockProducts,
      pendingInvoices,
      date: today
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get analytics for date range
router.get('/range', verifyJWT, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const invoices = await Invoice.find(query).populate('customerId').populate('items.productId');
    
    // Calculate metrics
    const totalSales = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalOrders = invoices.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    // Top products
    const productMap = {};
    invoices.forEach(inv => {
      (inv.items || []).forEach(item => {
        const productId = item.productId?._id || item.productId;
        if (!productMap[productId]) {
          productMap[productId] = { name: item.productId?.name || 'Unknown', quantity: 0, revenue: 0 };
        }
        productMap[productId].quantity += item.quantity || 0;
        productMap[productId].revenue += (item.price || 0) * (item.quantity || 0);
      });
    });
    
    const topProducts = Object.entries(productMap)
      .map(([id, data]) => ({ productId: id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    // Top customers
    const customerMap = {};
    invoices.forEach(inv => {
      const customerId = inv.customerId?._id || inv.customerId;
      if (!customerMap[customerId]) {
        customerMap[customerId] = { name: inv.customerId?.name || 'Unknown', totalSpent: 0, orderCount: 0 };
      }
      customerMap[customerId].totalSpent += inv.total || 0;
      customerMap[customerId].orderCount++;
    });
    
    const topCustomers = Object.entries(customerMap)
      .map(([id, data]) => ({ customerId: id, ...data }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);
    
    res.json({
      totalSales,
      totalOrders,
      avgOrderValue,
      topProducts,
      topCustomers,
      startDate,
      endDate
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get sales trends
router.get('/trends', verifyJWT, isAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const invoices = await Invoice.find({ createdAt: { $gte: startDate } });
    
    const trends = {};
    invoices.forEach(inv => {
      const date = new Date(inv.createdAt).toISOString().split('T')[0];
      if (!trends[date]) trends[date] = { sales: 0, orders: 0 };
      trends[date].sales += inv.total || 0;
      trends[date].orders++;
    });
    
    const data = Object.entries(trends).map(([date, metrics]) => ({ date, ...metrics }));
    res.json(data.sort((a, b) => new Date(a.date) - new Date(b.date)));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get category breakdown
router.get('/categories', verifyJWT, isAdmin, async (req, res) => {
  try {
    const invoices = await Invoice.find({}).populate('items.productId');
    
    const categoryMap = {};
    invoices.forEach(inv => {
      (inv.items || []).forEach(item => {
        const category = item.productId?.category || 'Uncategorized';
        if (!categoryMap[category]) {
          categoryMap[category] = { total: 0, count: 0 };
        }
        categoryMap[category].total += (item.price || 0) * (item.qty || 0);
        categoryMap[category].count += item.qty || 0;
      });
    });
    
    const categories = Object.entries(categoryMap).map(([category, metrics]) => ({
      category,
      ...metrics
    }));
    
    res.json(categories.sort((a, b) => b.total - a.total));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
