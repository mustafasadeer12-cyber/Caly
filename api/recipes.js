import { connectDB } from './_lib/db.js'
import { Recipe } from './_lib/models.js'
import { requireAuth } from './_lib/auth.js'

export default requireAuth(async function handler(req, res) {
  await connectDB()
  const userId = req.user.id

  if (req.method === 'GET') {
    const recipes = await Recipe.find({ userId }).sort({ created_date: -1 })
    return res.status(200).json(recipes)
  }

  if (req.method === 'POST') {
    const fields = { ...(req.body || {}) }
    delete fields.userId
    delete fields.id
    const doc = await Recipe.create({ ...fields, userId })
    return res.status(201).json(doc)
  }

  if (req.method === 'PUT') {
    const { id } = req.query
    const fields = { ...(req.body || {}) }
    delete fields.userId
    delete fields.id
    const doc = await Recipe.findOneAndUpdate({ _id: id, userId }, { $set: fields }, { new: true })
    if (!doc) return res.status(404).json({ error: 'Recipe not found' })
    return res.status(200).json(doc)
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    const doc = await Recipe.findOneAndDelete({ _id: id, userId })
    if (!doc) return res.status(404).json({ error: 'Recipe not found' })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
})
