import { connectDB } from './_lib/db.js'
import { FoodItem } from './_lib/models.js'
import { requireAuth } from './_lib/auth.js'

export default requireAuth(async function handler(req, res) {
  await connectDB()
  const userId = req.user.id

  if (req.method === 'GET') {
    const { q } = req.query
    const filter = { userId }
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      filter.$or = [{ name: rx }, { brand: rx }]
    }
    const items = await FoodItem.find(filter).sort({ name: 1 })
    return res.status(200).json(items)
  }

  if (req.method === 'POST') {
    const body = req.body
    // Supports single object or array (bulk import)
    if (Array.isArray(body)) {
      const docs = await FoodItem.insertMany(body.map((f) => ({ ...f, userId })))
      return res.status(201).json(docs)
    }
    const doc = await FoodItem.create({ ...body, userId })
    return res.status(201).json(doc)
  }

  if (req.method === 'PUT') {
    const { id } = req.query
    const fields = { ...(req.body || {}) }
    delete fields.userId
    delete fields.id
    const doc = await FoodItem.findOneAndUpdate({ _id: id, userId }, { $set: fields }, { new: true })
    if (!doc) return res.status(404).json({ error: 'Food not found' })
    return res.status(200).json(doc)
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    const doc = await FoodItem.findOneAndDelete({ _id: id, userId })
    if (!doc) return res.status(404).json({ error: 'Food not found' })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
})
