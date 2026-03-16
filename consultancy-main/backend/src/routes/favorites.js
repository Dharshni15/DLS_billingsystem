import express from 'express'
import Favorite from '../models/Favorite.js'
import Product from '../models/Product.js'
import { requireAuth } from '../utils/jwt.js'

const router = express.Router()

// List current user's favorites
router.get('/', requireAuth, async (req, res) => {
  try {
    const items = await Favorite.find({ userId: req.user.id }).populate({ path: 'productId', select: 'name sku price taxRate' }).sort({ createdAt: -1 })
    res.json(items.map(f => ({ _id: f._id, product: f.productId })))
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Toggle favorite for a product
router.post('/:productId', requireAuth, async (req, res) => {
  try {
    const { productId } = req.params
    const prod = await Product.findById(productId)
    if (!prod) return res.status(404).json({ error: 'Product not found' })

    const existing = await Favorite.findOne({ userId: req.user.id, productId })
    if (existing) {
      await Favorite.deleteOne({ _id: existing._id })
      return res.json({ ok: true, favorited: false })
    }
    await Favorite.create({ userId: req.user.id, productId })
    res.json({ ok: true, favorited: true })
  } catch (e) {
    if (e.code === 11000) return res.json({ ok: true, favorited: true })
    res.status(400).json({ error: e.message })
  }
})

export default router
