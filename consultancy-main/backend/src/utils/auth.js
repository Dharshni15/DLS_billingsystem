export function requireRole(allowed = []) {
  const set = new Set(allowed);
  return (req, res, next) => {
    const role = (req.headers['x-role'] || '').toString().toLowerCase();
    if (!role) return res.status(401).json({ error: 'Missing role' });
    if (!set.size || set.has(role)) {
      req.userRole = role;
      return next();
    }
    return res.status(403).json({ error: 'Forbidden' });
  };
}
