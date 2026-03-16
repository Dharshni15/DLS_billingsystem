import mongoose from 'mongoose'

const FavoriteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }
  },
  { timestamps: true }
)

FavoriteSchema.index({ userId: 1, productId: 1 }, { unique: true })

export default mongoose.model('Favorite', FavoriteSchema)
