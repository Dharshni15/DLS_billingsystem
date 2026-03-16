import mongoose from 'mongoose';

const InventorySchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    storeId: { type: String, default: 'MAIN' },
    quantity: { type: Number, required: true, default: 0 },
    reserved: { type: Number, default: 0 }, // for pending orders
    available: { type: Number, default: 0 },
    minThreshold: { type: Number, default: 0 },
    reorderQuantity: { type: Number, default: 0 },
    lastRestockDate: { type: Date },
    movements: [
      {
        type: { type: String, enum: ['in', 'out', 'adjustment', 'return'] },
        quantity: Number,
        reference: String, // invoice/order ID
        reason: String,
        date: { type: Date, default: Date.now },
        userId: mongoose.Schema.Types.ObjectId
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model('Inventory', InventorySchema);
