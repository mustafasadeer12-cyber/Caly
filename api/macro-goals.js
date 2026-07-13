import { connectDB } from './_lib/db.js'
import { MacroGoal } from './_lib/models.js'
import { requireAuth } from './_lib/auth.js'

export default requireAuth(async function handler(req, res) {
  await connectDB()
  const userId = req.user.id

  if (req.method === 'GET') {
    // Only one active goal at a time: fetch latest
    const goal = await MacroGoal.findOne({ userId }).sort({ created_date: -1 })
    return res.status(200).json(goal)
  }

  if (req.method === 'POST') {
    const fields = { ...(req.body || {}) }
    delete fields.userId
    delete fields.id
    // Update in place if one exists, otherwise create
    const goal = await MacroGoal.findOneAndUpdate(
      { userId },
      { $set: { ...fields, userId } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
    return res.status(200).json(goal)
  }

  return res.status(405).json({ error: 'Method not allowed' })
})
