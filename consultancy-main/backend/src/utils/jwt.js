import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'

export function signToken(user) {
  return jwt.sign({ sub: user._id, role: user.role, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers['authorization'] || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) return res.status(401).json({ error: 'Unauthorized' })
    const payload = jwt.verify(token, JWT_SECRET)
    const user = await User.findById(payload.sub).lean()
    if (!user) return res.status(401).json({ error: 'Unauthorized' })
    req.user = { _id: user._id.toString(), role: user.role, name: user.name, email: user.email }
    next()
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

export function requireRoles(roles = []) {
  const set = new Set(roles)
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
    if (set.size === 0 || set.has(req.user.role)) return next()
    return res.status(403).json({ error: 'Forbidden' })
  }
}

// Alias for compatibility
export const verifyJWT = requireAuth
