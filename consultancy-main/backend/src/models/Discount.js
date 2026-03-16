import mongoose from 'mongoose';

const DiscountSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    description: { type: String },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true }, // percentage (0-100) or fixed amount
    minOrderValue: { type: Number, default: 0 },
    maxUsage: { type: Number }, // null = unlimited
    usageCount: { type: Number, default: 0 },
    applicableProducts: [mongoose.Schema.Types.ObjectId], // null = all products
    applicableCategories: [String],
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    active: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export default mongoose.model('Discount', DiscountSchema);
