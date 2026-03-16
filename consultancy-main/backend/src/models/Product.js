import mongoose from 'mongoose';

const StockSchema = new mongoose.Schema(
  {
    storeId: { type: String, default: 'MAIN' },
    qty: { type: Number, default: 0 }
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    barcode: { type: String },
    category: { type: String },
    price: { type: Number, required: true },
    cost: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 }, // percent
    minStock: { type: Number, default: 0 },
    stock: { type: [StockSchema], default: [{ storeId: 'MAIN', qty: 0 }] },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

ProductSchema.index({ name: 'text', sku: 'text', barcode: 'text' });

export default mongoose.model('Product', ProductSchema);
