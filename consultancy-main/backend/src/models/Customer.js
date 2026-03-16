import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true },
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    taxId: { type: String }, // GST/VAT
    creditLimit: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

CustomerSchema.index({ name: 'text', phone: 'text', email: 'text', code: 'text' });

// Auto-generate human-friendly unique customer code if missing
CustomerSchema.pre('save', async function (next) {
  if (this.code) return next();
  try {
    const prefix = 'CUST-';
    // Find last code
    const last = await this.constructor.findOne({ code: { $regex: `^${prefix}` } }).sort({ createdAt: -1 }).lean();
    let seq = 1;
    if (last?.code) {
      const num = parseInt(last.code.replace(prefix, ''), 10);
      if (!isNaN(num)) seq = num + 1;
    }
    this.code = prefix + String(seq).padStart(4, '0');
    next();
  } catch (e) {
    next(e);
  }
});

export default mongoose.model('Customer', CustomerSchema);
