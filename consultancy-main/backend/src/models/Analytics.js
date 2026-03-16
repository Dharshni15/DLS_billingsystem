import mongoose from 'mongoose';

const AnalyticsSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    metrics: {
      totalSales: Number,
      totalOrders: Number,
      totalCustomers: Number,
      averageOrderValue: Number,
      totalProducts: Number,
      lowStockProducts: Number,
      pendingInvoices: Number
    },
    topProducts: [
      {
        productId: mongoose.Schema.Types.ObjectId,
        name: String,
        quantity: Number,
        revenue: Number
      }
    ],
    topCustomers: [
      {
        customerId: mongoose.Schema.Types.ObjectId,
        name: String,
        totalSpent: Number,
        orderCount: Number
      }
    ],
    salesByCategory: [
      {
        category: String,
        total: Number,
        count: Number
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model('Analytics', AnalyticsSchema);
