import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Plus, Upload, Pencil, Trash2 } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { Card } from '@/components/ui/card'
import { Input, Label } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { api } from '@/lib/api'
import { foodMacros, round1 } from '@/lib/calc'

const EMPTY_FORM = {
  name: '',
  brand: '',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
  unit_name: '',
  unit_weight_grams: '',
}

// Minimal CSV parser that handles quoted fields
function parseCSV(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      field = ''
      if (row.some((c) => c !== '')) rows.push(row)
      row = []
    } else {
      field += ch
    }
  }
  if (field !== '' || row.length) {
    row.push(field)
    if (row.some((c) => c !== '')) rows.push(row)
  }
  return rows
}

const MD_SEPARATOR_RE = /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?$/

// Parses a GitHub-style markdown table into the same row-array shape as parseCSV
function parseMarkdownTable(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith('|'))

  return lines
    .filter((line) => !MD_SEPARATOR_RE.test(line))
    .map((line) =>
      line
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((cell) => cell.trim())
    )
}

function rowsToFoods(rows) {
  if (rows.length < 2) return []
  const headers = rows[0].map((h) => String(h).trim().toLowerCase().replace(/\s+/g, '_'))
  return rows
    .slice(1)
    .map((cells) => {
      const obj = {}
      headers.forEach((h, i) => (obj[h] = cells[i]))
      const food = {
        name: String(obj.name || '').trim(),
        brand: String(obj.brand || '').trim(),
        calories: parseFloat(obj.calories),
        protein: parseFloat(obj.protein),
        carbs: parseFloat(obj.carbs),
        fat: parseFloat(obj.fat),
      }
      if (obj.unit_name) food.unit_name = String(obj.unit_name).trim()
      if (obj.unit_weight_grams) food.unit_weight_grams = parseFloat(obj.unit_weight_grams)
      return food
    })
    .filter(
      (f) =>
        f.name &&
        [f.calories, f.protein, f.carbs, f.fat].every((n) => Number.isFinite(n))
    )
}

export default function FoodDatabase() {
  const [foods, setFoods] = useState([])
  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const fileRef = useRef(null)

  const load = () => api.get('/food-items').then(setFoods).catch(console.error)
  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return foods
    return foods.filter(
      (f) => f.name.toLowerCase().includes(q) || (f.brand || '').toLowerCase().includes(q)
    )
  }, [foods, query])

  function openForm(food) {
    setEditing(food || null)
    setForm(
      food
        ? {
            name: food.name,
            brand: food.brand || '',
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
            unit_name: food.unit_name || '',
            unit_weight_grams: food.unit_weight_grams || '',
          }
        : EMPTY_FORM
    )
    setFormOpen(true)
  }

  // After editing a food, recalc recipes that use it (with user confirmation)
  async function syncRecipes(updatedFood) {
    const recipes = await api.get('/recipes')
    const affected = recipes.filter((r) =>
      (r.ingredients || []).some((ing) => ing.food_item_id === updatedFood.id)
    )
    if (affected.length === 0) return
    const ok = window.confirm(
      `"${updatedFood.name}" is used in ${affected.length} recipe(s). Recalculate their macros now?`
    )
    if (!ok) return
    for (const recipe of affected) {
      const ingredients = recipe.ingredients.map((ing) =>
        ing.food_item_id === updatedFood.id
          ? { ...ing, ...foodMacros(updatedFood, ing.grams) }
          : ing
      )
      const totals = ingredients.reduce(
        (acc, ing) => ({
          total_calories: acc.total_calories + (ing.calories || 0),
          total_protein: round1(acc.total_protein + (ing.protein || 0)),
          total_carbs: round1(acc.total_carbs + (ing.carbs || 0)),
          total_fat: round1(acc.total_fat + (ing.fat || 0)),
        }),
        { total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 }
      )
      await api.put(`/recipes?id=${recipe.id}`, { ingredients, ...totals })
    }
    setNotice(`Recalculated ${affected.length} recipe(s).`)
  }

  async function save() {
    setBusy(true)
    try {
      const payload = {
        name: form.name.trim(),
        brand: form.brand.trim(),
        calories: parseFloat(form.calories) || 0,
        protein: parseFloat(form.protein) || 0,
        carbs: parseFloat(form.carbs) || 0,
        fat: parseFloat(form.fat) || 0,
        unit_name: form.unit_name.trim(),
        unit_weight_grams: parseFloat(form.unit_weight_grams) || null,
      }
      if (!payload.name) return
      if (editing) {
        const updated = await api.put(`/food-items?id=${editing.id}`, payload)
        await syncRecipes(updated)
      } else {
        await api.post('/food-items', payload)
      }
      setFormOpen(false)
      load()
    } catch (e) {
      setNotice(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(food) {
    if (!window.confirm(`Delete "${food.name}"?`)) return
    await api.del(`/food-items?id=${food.id}`)
    load()
  }

  async function handleImport(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setNotice('')
    try {
      let rows
      if (/\.(xlsx|xls)$/i.test(file.name)) {
        const XLSX = await import('xlsx')
        const wb = XLSX.read(await file.arrayBuffer())
        const sheet = wb.Sheets[wb.SheetNames[0]]
        rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false })
      } else if (/\.md$/i.test(file.name)) {
        rows = parseMarkdownTable(await file.text())
      } else {
        rows = parseCSV(await file.text())
      }
      const items = rowsToFoods(rows)
      if (items.length === 0) {
        setNotice('No valid rows found. Expected headers: name, calories, protein, carbs, fat.')
        return
      }
      await api.post('/food-items', items)
      setNotice(`Imported ${items.length} food(s).`)
      load()
    } catch (err) {
      setNotice(`Import failed: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-[640px] px-4 pb-16">
      <PageHeader title="Food Database">
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          <Upload size={14} /> Import
        </Button>
        <Button size="sm" onClick={() => openForm(null)}>
          <Plus size={14} /> Add food
        </Button>
      </PageHeader>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.xlsx,.xls,.md"
        className="hidden"
        onChange={handleImport}
      />

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mink" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search foods…"
          className="bg-card pl-9"
        />
      </div>

      {notice && <p className="mb-3 animate-fadein text-xs text-terra">{notice}</p>}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-mink/30 p-8 text-center">
          <p className="text-sm text-mink">
            {foods.length === 0 ? 'No foods yet — add one or import a CSV.' : 'No matches.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((food) => (
            <Card key={food.id} className="flex items-center justify-between p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  {food.name}
                  {food.brand && <span className="ml-1.5 text-xs text-mink">{food.brand}</span>}
                </p>
                <p className="text-xs text-mink">
                  {food.calories} kcal · P {food.protein} · C {food.carbs} · F {food.fat} / 100g
                  {food.unit_name && food.unit_weight_grams
                    ? ` · 1 ${food.unit_name} = ${food.unit_weight_grams}g`
                    : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => openForm(food)}
                  className="cursor-pointer p-2 text-mink transition-colors duration-200 hover:text-ink"
                  title="Edit"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => remove(food)}
                  className="cursor-pointer p-2 text-mink transition-colors duration-200 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent title={editing ? 'Edit food' : 'Add food'}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Brand</Label>
                <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
              </div>
            </div>
            <p className="micro">per 100g</p>
            <div className="grid grid-cols-4 gap-2">
              {['calories', 'protein', 'carbs', 'fat'].map((key) => (
                <div key={key}>
                  <Label className="capitalize">{key}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <p className="micro">optional unit</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Unit name (e.g. egg)</Label>
                <Input
                  value={form.unit_name}
                  onChange={(e) => setForm({ ...form, unit_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Unit weight (g)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.unit_weight_grams}
                  onChange={(e) => setForm({ ...form, unit_weight_grams: e.target.value })}
                />
              </div>
            </div>
            <Button className="w-full" onClick={save} disabled={busy || !form.name.trim()}>
              {busy ? 'Saving…' : 'Save food'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
