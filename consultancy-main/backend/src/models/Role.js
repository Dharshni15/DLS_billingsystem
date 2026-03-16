import mongoose from 'mongoose';

const RoleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    permissions: [
      {
        resource: { type: String }, // 'products', 'customers', 'invoices', etc.
        actions: [String] // ['create', 'read', 'update', 'delete']
      }
    ],
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model('Role', RoleSchema);
