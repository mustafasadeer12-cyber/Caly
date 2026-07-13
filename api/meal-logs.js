import { connectDB } from './_lib/db.js'
import { MealLog } from './_lib/models.js'
import { requireAuth } from './_lib/auth.js'

export default requireAuth(async function handler(req, res) {
  await connectDB()
  const userId = req.user.id

  if (req.method === 'GET') {
    const { date } = req.query
    const filter = { userId }
    if (date) filter.date = date
    const logs = await MealLog.find(filter).sort({ created_date: 1 })
    return res.status(200).json(logs)
  }

  if (req.method === 'POST') {
    const body = req.body
    // Supports single entry or array (multi-item meal save)
    if (Array.isArray(body)) {
      const docs = await MealLog.insertMany(body.map((l) => ({ ...l, userId })))
      return res.status(201).json(docs)
    }
    const doc = await MealLog.create({ ...body, userId })
    return res.status(201).json(doc)
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    const doc = await MealLog.findOneAndDelete({ _id: id, userId })
    if (!doc) return res.status(404).json({ error: 'Log entry not found' })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
})
