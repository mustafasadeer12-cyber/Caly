import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, UtensilsCrossed, Search, X } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { Card } from '@/components/ui/card'
import { Input, Label } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { api } from '@/lib/api'
import { foodMacros, recipeMacros, round1, todayStr, MEAL_CATEGORIES } from '@/lib/calc'
import { cn } from '@/lib/utils'

function sumIngredients(ingredients) {
  return ingredients.reduce(
    (acc, ing) => ({
      total_calories: acc.total_calories + (ing.calories || 0),
      total_protein: round1(acc.total_protein + (ing.protein || 0)),
      total_carbs: round1(acc.total_carbs + (ing.carbs || 0)),
      total_fat: round1(acc.total_fat + (ing.fat || 0)),
    }),
    { total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 }
  )
}

// Mounted only while open, so state seeds from the recipe prop on each open
function RecipeBuilder({ open, onOpenChange, recipe, foods, onSaved }) {
  const [name, setName] = useState(recipe?.name || '')
  const [description, setDescription] = useState(recipe?.description || '')
  const [servings, setServings] = useState(String(recipe?.servings || 1))
  const [ingredients, setIngredients] = useState(recipe?.ingredients || [])
  const [query, setQuery] = useState('')
  const [pendingFood, setPendingFood] = useState(null)
  const [grams, setGrams] = useState('100')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return foods
      .filter((f) => f.name.toLowerCase().includes(q) || (f.brand || '').toLowerCase().includes(q))
      .slice(0, 8)
  }, [query, foods])

  const totals = useMemo(() => sumIngredients(ingredients), [ingredients])

  function addIngredient() {
    const g = parseFloat(grams)
    if (!pendingFood || !g || g <= 0) return
    setIngredients((prev) => [
      ...prev,
      {
        food_item_id: pendingFood.id,
        food_name: pendingFood.name,
        grams: g,
        ...foodMacros(pendingFood, g),
      },
    ])
    setPendingFood(null)
    setQuery('')
    setGrams('100')
  }

  async function save() {
    if (!name.trim() || ingredients.length === 0) return
    setBusy(true)
    setError('')
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        ingredients,
        ...totals,
        servings: parseFloat(servings) || 1,
      }
      if (recipe) await api.put(`/recipes?id=${recipe.id}`, payload)
      else await api.post('/recipes', payload)
      onSaved()
      onOpenChange(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={recipe ? 'Edit recipe' : 'New recipe'}>
        <div className="space-y-3">
          <div>
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <Label>Servings</Label>
            <Input
              type="number"
              min="0.5"
              step="0.5"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              className="w-28"
            />
          </div>

          <div className="relative">
            <Label>Add ingredient</Label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mink" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search foods…"
                className="pl-9"
              />
            </div>
            {results.length > 0 && !pendingFood && (
              <div className="absolute z-10 mt-1 max-h-44 w-full overflow-y-auto rounded-lg border border-hairline bg-card shadow-sm">
                {results.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setPendingFood(f)}
                    className="block w-full cursor-pointer px-3 py-2 text-left transition-colors duration-150 hover:bg-page"
                  >
                    <p className="text-sm text-ink">{f.name}</p>
                    <p className="text-xs text-mink">{f.calories} kcal / 100g</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {pendingFood && (
            <div className="flex animate-fadein items-center gap-2 rounded-lg border border-hairline bg-page p-3">
              <span className="min-w-0 flex-1 truncate text-sm text-ink">{pendingFood.name}</span>
              <Input
                type="number"
                min="0"
                value={grams}
                onChange={(e) => setGrams(e.target.value)}
                className="h-9 w-24 bg-card"
              />
              <span className="text-xs text-mink">g</span>
              <Button size="sm" onClick={addIngredient}>
                Add
              </Button>
              <button
                onClick={() => setPendingFood(null)}
                className="cursor-pointer p-1 text-mink hover:text-ink"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {ingredients.length > 0 && (
            <ul className="divide-y divide-hairline rounded-lg border border-hairline">
              {ingredients.map((ing, i) => (
                <li key={i} className="flex items-center justify-between px-3 py-2">
                  <div>
                    <p className="text-sm text-ink">{ing.food_name}</p>
                    <p className="text-xs text-mink">
                      {ing.grams}g · {ing.calories} kcal
                    </p>
                  </div>
                  <button
                    onClick={() => setIngredients((prev) => prev.filter((_, j) => j !== i))}
                    className="cursor-pointer p-1 text-mink hover:text-red-600"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {ingredients.length > 0 && (
            <p className="text-right text-xs text-mink">
              Total: <strong className="text-ink">{Math.round(totals.total_calories)} kcal</strong>{' '}
              · P {totals.total_protein} · C {totals.total_carbs} · F {totals.total_fat}
            </p>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}

          <Button
            className="w-full"
            onClick={save}
            disabled={busy || !name.trim() || ingredients.length === 0}
          >
            {busy ? 'Saving…' : 'Save recipe'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function LogRecipeModal({ recipe, onOpenChange, onLogged }) {
  const [category, setCategory] = useState('lunch')
  const [servings, setServings] = useState('1')
  const [busy, setBusy] = useState(false)

  const preview = recipe ? recipeMacros(recipe, parseFloat(servings) || 0) : null

  async function log() {
    const n = parseFloat(servings)
    if (!recipe || !n || n <= 0) return
    setBusy(true)
    try {
      await api.post('/meal-logs', {
        date: todayStr(),
        meal_category: category,
        food_item_id: recipe.id,
        food_name: recipe.name,
        servings: n,
        unit: 'srv',
        ...recipeMacros(recipe, n),
      })
      onLogged()
      onOpenChange(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={!!recipe} onOpenChange={onOpenChange}>
      <DialogContent title={`Log "${recipe?.name || ''}"`}>
        <div className="space-y-4">
          <div>
            <Label>Meal</Label>
            <div className="flex gap-1.5">
              {MEAL_CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    'flex-1 cursor-pointer rounded-lg border px-2 py-1.5 text-xs capitalize transition-all duration-200',
                    category === c
                      ? 'border-terra bg-terra/10 text-ink'
                      : 'border-hairline text-mink hover:text-ink'
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Servings</Label>
            <Input
              type="number"
              min="0.25"
              step="0.25"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              className="w-28"
            />
          </div>
          {preview && (
            <p className="text-xs text-mink">
              <strong className="text-ink">{preview.calories} kcal</strong> · P {preview.protein} ·
              C {preview.carbs} · F {preview.fat}
            </p>
          )}
          <Button className="w-full" onClick={log} disabled={busy}>
            {busy ? 'Logging…' : 'Log to today'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function Recipes() {
  const [recipes, setRecipes] = useState([])
  const [foods, setFoods] = useState([])
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [logging, setLogging] = useState(null)
  const [notice, setNotice] = useState('')

  const load = () => api.get('/recipes').then(setRecipes).catch(console.error)
  useEffect(() => {
    load()
    api.get('/food-items').then(setFoods).catch(console.error)
  }, [])

  async function remove(recipe) {
    if (!window.confirm(`Delete "${recipe.name}"?`)) return
    await api.del(`/recipes?id=${recipe.id}`)
    load()
  }

  return (
    <div className="mx-auto min-h-screen max-w-[640px] px-4 pb-16">
      <PageHeader title="Recipes">
        <Button
          size="sm"
          onClick={() => {
            setEditing(null)
            setBuilderOpen(true)
          }}
        >
          <Plus size={14} /> New recipe
        </Button>
      </PageHeader>

      {notice && <p className="mb-3 animate-fadein text-xs text-terra">{notice}</p>}

      {recipes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-mink/30 p-8 text-center">
          <p className="text-sm text-mink">No recipes yet — build one from your foods.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {recipes.map((recipe) => {
            const perServing = recipeMacros(recipe, 1)
            return (
              <Card key={recipe.id} className="flex flex-col p-4">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-ink">
                    <UtensilsCrossed size={13} className="mr-1 inline text-terra" />
                    {recipe.name}
                  </p>
                  <div className="flex shrink-0 gap-0.5">
                    <button
                      onClick={() => {
                        setEditing(recipe)
                        setBuilderOpen(true)
                      }}
                      className="cursor-pointer p-1.5 text-mink transition-colors duration-200 hover:text-ink"
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => remove(recipe)}
                      className="cursor-pointer p-1.5 text-mink transition-colors duration-200 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {recipe.description && (
                  <p className="mb-2 text-xs text-mink">{recipe.description}</p>
                )}
                <p className="text-xs text-mink">
                  {recipe.servings} serving{recipe.servings === 1 ? '' : 's'} ·{' '}
                  {(recipe.ingredients || []).length} ingredients
                </p>
                <p className="mb-3 mt-1 text-xs text-mink">
                  <strong className="text-ink">{perServing.calories} kcal</strong> / serving · P{' '}
                  {perServing.protein} · C {perServing.carbs} · F {perServing.fat}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-auto"
                  onClick={() => setLogging(recipe)}
                >
                  Log recipe
                </Button>
              </Card>
            )
          })}
        </div>
      )}

      {builderOpen && (
        <RecipeBuilder
          open={builderOpen}
          onOpenChange={setBuilderOpen}
          recipe={editing}
          foods={foods}
          onSaved={load}
        />
      )}
      <LogRecipeModal
        recipe={logging}
        onOpenChange={(open) => !open && setLogging(null)}
        onLogged={() => setNotice('Logged to today.')}
      />
    </div>
  )
}
