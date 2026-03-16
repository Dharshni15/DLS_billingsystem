import express from 'express';
import ExcelJS from 'exceljs';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';
import { verifyJWT } from '../utils/jwt.js';

const router = express.Router();

// Middleware to verify admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Export products
router.get('/products/export', verifyJWT, isAdmin, async (req, res) => {
  try {
    const products = await Product.find({});
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products');
    
    worksheet.columns = [
      { header: 'ID', key: '_id', width: 20 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Barcode', key: 'barcode', width: 15 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Price', key: 'price', width: 12 },
      { header: 'Cost', key: 'cost', width: 12 },
      { header: 'Tax Rate', key: 'taxRate', width: 10 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: 'Min Stock', key: 'minStock', width: 10 }
    ];
    
    products.forEach(product => {
      const stock = product.stock?.[0]?.qty || 0;
      worksheet.addRow({
        _id: product._id.toString(),
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        category: product.category,
        price: product.price,
        cost: product.cost,
        taxRate: product.taxRate,
        stock,
        minStock: product.minStock
      });
    });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=products.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Export customers
router.get('/customers/export', verifyJWT, isAdmin, async (req, res) => {
  try {
    const customers = await Customer.find({});
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Customers');
    
    worksheet.columns = [
      { header: 'ID', key: '_id', width: 20 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Address', key: 'address', width: 30 },
      { header: 'City', key: 'city', width: 15 },
      { header: 'State', key: 'state', width: 10 },
      { header: 'Zip', key: 'zip', width: 10 }
    ];
    
    customers.forEach(customer => {
      worksheet.addRow({
        _id: customer._id.toString(),
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zip: customer.zip
      });
    });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=customers.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Export invoices
router.get('/invoices/export', verifyJWT, isAdmin, async (req, res) => {
  try {
    const invoices = await Invoice.find({}).populate('customerId').populate('items.productId');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Invoices');
    
    worksheet.columns = [
      { header: 'Invoice ID', key: 'invoiceNumber', width: 15 },
      { header: 'Customer', key: 'customerName', width: 25 },
      { header: 'Date', key: 'createdAt', width: 12 },
      { header: 'Total', key: 'total', width: 12 },
      { header: 'Status', key: 'paymentStatus', width: 12 }
    ];
    
    invoices.forEach(invoice => {
      worksheet.addRow({
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerId?.name || 'N/A',
        createdAt: new Date(invoice.createdAt).toLocaleDateString(),
        total: invoice.total,
        paymentStatus: invoice.paymentStatus
      });
    });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=invoices.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Import products
router.post('/products/import', verifyJWT, isAdmin, async (req, res) => {
  try {
    const { data } = req.body; // Expects array of product objects
    
    let imported = 0;
    let failed = 0;
    const errors = [];
    
    for (const productData of data) {
      try {
        const existing = await Product.findOne({ sku: productData.sku });
        if (existing) {
          // Update existing
          Object.assign(existing, productData);
          await existing.save();
        } else {
          // Create new
          const product = new Product(productData);
          await product.save();
        }
        imported++;
      } catch (e) {
        failed++;
        errors.push({ sku: productData.sku, error: e.message });
      }
    }
    
    res.json({ imported, failed, errors });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Import customers
router.post('/customers/import', verifyJWT, isAdmin, async (req, res) => {
  try {
    const { data } = req.body;
    
    let imported = 0;
    let failed = 0;
    const errors = [];
    
    for (const customerData of data) {
      try {
        const existing = await Customer.findOne({ email: customerData.email });
        if (existing) {
          Object.assign(existing, customerData);
          await existing.save();
        } else {
          const customer = new Customer(customerData);
          await customer.save();
        }
        imported++;
      } catch (e) {
        failed++;
        errors.push({ email: customerData.email, error: e.message });
      }
    }
    
    res.json({ imported, failed, errors });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
