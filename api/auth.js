import bcrypt from 'bcryptjs'
import { connectDB } from './_lib/db.js'
import { User } from './_lib/models.js'
import { signToken } from './_lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    await connectDB()
    const { action, email, password, full_name } = req.body || {}
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

    if (action === 'register') {
      const existing = await User.findOne({ email: email.toLowerCase() })
      if (existing) return res.status(409).json({ error: 'An account with this email already exists' })
      const password_hash = await bcrypt.hash(password, 10)
      const user = await User.create({ email, password_hash, full_name: full_name || '' })
      return res.status(201).json({ token: signToken(user), user: user.toJSON() })
    }

    if (action === 'login') {
      const user = await User.findOne({ email: email.toLowerCase() })
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ error: 'Invalid email or password' })
      }
      return res.status(200).json({ token: signToken(user), user: user.toJSON() })
    }

    return res.status(400).json({ error: 'Unknown action' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}
