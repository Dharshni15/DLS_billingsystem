import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import productsRouter from './routes/products.js';
import customersRouter from './routes/customers.js';
import invoicesRouter from './routes/invoices.js';
import onlineOrdersRouter from './routes/onlineOrders.js';
import authRouter from './routes/auth.js';
import favoritesRouter from './routes/favorites.js';
import rolesRouter from './routes/roles.js';
import discountsRouter from './routes/discounts.js';
import inventoryRouter from './routes/inventory.js';
import analyticsRouter from './routes/analytics.js';
import importExportRouter from './routes/import-export.js';
import paymentsRouter from './routes/payments.js';
import User from './models/User.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 5001;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sellsmart';

// allow specific origin (production-ready)
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// MongoDB connection
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected');
    // Seed default admin if missing
    const adminEmail = 'admin';
    const exists = await User.findOne({ email: adminEmail });
    if (!exists) {
      try {
        await User.create({ name: 'Admin', email: adminEmail, password: 'admin123', role: 'admin' });
        console.log('Seeded default admin: admin / admin123');
      } catch (e) {
        console.error('Failed to seed admin:', e.message);
      }
    }
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/products', productsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/online-orders', onlineOrdersRouter);
app.use('/api/auth', authRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/discounts', discountsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/import-export', importExportRouter);
app.use('/api/payments', paymentsRouter);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
