import mongoose from 'mongoose';

const OnlineOrderSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    customerName: { type: String },
    address: { type: String },
    status: { type: String, enum: ['PLACED', 'SHIPPED', 'DELIVERED', 'CANCELLED'], default: 'PLACED' },
    storeId: { type: String, default: 'MAIN' }
  },
  { timestamps: true }
);

export default mongoose.model('OnlineOrder', OnlineOrderSchema);
