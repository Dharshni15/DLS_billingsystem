import mongoose from 'mongoose';

const InvoiceItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String },
    name: { type: String, required: true },
    qty: { type: Number, required: true },
    price: { type: Number, required: true },
    taxRate: { type: Number, default: 0 },
    discount: { type: Number, default: 0 }
  },
  { _id: false }
);

const PaymentSchema = new mongoose.Schema(
  {
    method: { type: String, enum: ['Cash', 'Card', 'UPI', 'Wallet', 'Other'], required: true },
    amount: { type: Number, required: true },
    reference: { type: String }
  },
  { _id: false }
);

const InvoiceSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true },
    date: { type: Date, default: Date.now },
    storeId: { type: String, default: 'MAIN' },
    cashier: { type: String },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String },
    items: { type: [InvoiceItemSchema], required: true },
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    payments: { type: [PaymentSchema], default: [] },
    status: { type: String, enum: ['PAID', 'PARTIAL', 'UNPAID', 'VOID'], default: 'PAID' }
  },
  { timestamps: true }
);

InvoiceSchema.index({ number: 1 });

export default mongoose.model('Invoice', InvoiceSchema);
