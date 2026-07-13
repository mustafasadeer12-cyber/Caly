import { connectDB } from './_lib/db.js'
import { DailyLog } from './_lib/models.js'
import { requireAuth } from './_lib/auth.js'

const DEFAULT_SUPPLEMENTS = [
  { name: 'Creatine', isTaken: false },
  { name: 'Omega-3', isTaken: false },
  { name: 'Zinc', isTaken: false },
]

export default requireAuth(async function handler(req, res) {
  await connectDB()
  const userId = req.user.id

  if (req.method === 'GET') {
    const { date } = req.query
    if (!date) return res.status(400).json({ error: 'date is required' })
    // Auto-create with default supplements on first visit for a date
    let log = await DailyLog.findOne({ userId, date })
    if (!log) log = await DailyLog.create({ userId, date, supplements: DEFAULT_SUPPLEMENTS })
    return res.status(200).json(log)
  }

  if (req.method === 'PUT') {
    const { id } = req.query
    const { supplements } = req.body || {}
    const doc = await DailyLog.findOneAndUpdate(
      { _id: id, userId },
      { $set: { supplements } },
      { new: true }
    )
    if (!doc) return res.status(404).json({ error: 'Daily log not found' })
    return res.status(200).json(doc)
  }

  return res.status(405).json({ error: 'Method not allowed' })
})
