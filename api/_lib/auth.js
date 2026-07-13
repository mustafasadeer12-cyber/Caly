import jwt from 'jsonwebtoken'

// Wraps a handler: verifies the Bearer token and attaches req.user.
// Every query in the wrapped handler must scope by req.user.id.
export function requireAuth(handler) {
  return async (req, res) => {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) return res.status(401).json({ error: 'Missing token' })
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET)
      req.user = { id: payload.sub, email: payload.email }
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }
    try {
      return await handler(req, res)
    } catch (err) {
      console.error(err)
      return res.status(500).json({ error: 'Server error' })
    }
  }
}

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  })
}
