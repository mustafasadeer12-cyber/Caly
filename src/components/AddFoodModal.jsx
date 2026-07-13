import { useEffect, useMemo, useState } from 'react'
import { Search, UtensilsCrossed, Plus, X } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input, Label } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { foodMacros, recipeMacros, round1, MEAL_CATEGORIES } from '@/lib/calc'
import { cn } from '@/lib/utils'

const MACRO_BARS = [
  { key: 'calories', label: 'Calories', colorVar: '--terra' },
  { key: 'protein', label: 'Protein', colorVar: '--protein' },
  { key: 'carbs', label: 'Carbs', colorVar: '--carbs' },
  { key: 'fat', label: 'Fat', colorVar: '--fatm' },
]

function MacroPreview({ macros }) {
  return (
    <div className="flex gap-3 text-xs text-mink">
      <span>
        <strong className="text-ink">{macros.calories}</strong> kcal
      </span>
      <span>P {macros.protein}</span>
      <span>C {macros.carbs}</span>
      <span>F {macros.fat}</span>
    </div>
  )
}

// Mounted only while open, so all state initializes fresh on each open
export default function AddFoodModal(props) {
  if (!props.open) return null
  return <AddFoodModalInner {...props} />
}

function AddFoodModalInner({ open, onOpenChange, date, todayTotals, goal, onSaved }) {
  const [category, setCategory] = useState('breakfast')
  const [query, setQuery] = useState('')
  const [foods, setFoods] = useState([])
  const [recipes, setRecipes] = useState([])
  const [selected, setSelected] = useState(null) // { type: 'food'|'recipe', item }
  const [inputMode, setInputMode] = useState('grams')
  const [amount, setAmount] = useState('')
  const [mealItems, setMealItems] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.get('/food-items'), api.get('/recipes')])
      .then(([f, r]) => {
        setFoods(f || [])
        setRecipes(r || [])
      })
      .catch((e) => setError(e.message))
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const recipeHits = recipes
      .filter((r) => r.name.toLowerCase().includes(q))
      .map((item) => ({ type: 'recipe', item }))
    const foodHits = foods
      .filter((f) => f.name.toLowerCase().includes(q) || (f.brand || '').toLowerCase().includes(q))
      .map((item) => ({ type: 'food', item }))
    return [...recipeHits, ...foodHits].slice(0, 12)
  }, [query, foods, recipes])

  const numAmount = parseFloat(amount) || 0

  const preview = useMemo(() => {
    if (!selected || numAmount <= 0) return null
    if (selected.type === 'recipe') return recipeMacros(selected.item, numAmount)
    const grams =
      inputMode === 'units' ? numAmount * (selected.item.unit_weight_grams || 0) : numAmount
    return foodMacros(selected.item, grams)
  }, [selected, numAmount, inputMode])

  const itemTotals = useMemo(
    () =>
      mealItems.reduce(
        (acc, i) => ({
          calories: acc.calories + i.calories,
          protein: round1(acc.protein + i.protein),
          carbs: round1(acc.carbs + i.carbs),
          fat: round1(acc.fat + i.fat),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      ),
    [mealItems]
  )

  function selectResult(result) {
    setSelected(result)
    setQuery('')
    setAmount(result.type === 'recipe' ? '1' : '100')
    setInputMode('grams')
  }

  function addToMeal() {
    if (!selected || !preview) return
    if (selected.type === 'recipe') {
      setMealItems((prev) => [
        ...prev,
        {
          food_item_id: selected.item.id,
          food_name: selected.item.name,
          servings: numAmount,
          unit: 'srv',
          ...preview,
        },
      ])
    } else {
      const grams =
        inputMode === 'units' ? numAmount * (selected.item.unit_weight_grams || 0) : numAmount
      setMealItems((prev) => [
        ...prev,
        {
          food_item_id: selected.item.id,
          food_name: selected.item.name,
          servings: round1(grams),
          unit: 'g',
          ...preview,
        },
      ])
    }
    setSelected(null)
    setAmount('')
  }

  async function saveMeal() {
    if (mealItems.length === 0) return
    setSaving(true)
    setError('')
    try {
      await api.post(
        '/meal-logs',
        mealItems.map((i) => ({ ...i, date, meal_category: category }))
      )
      onSaved()
      onOpenChange(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const hasUnits =
    selected?.type === 'food' && selected.item.unit_name && selected.item.unit_weight_grams > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Add food">
        <div className="space-y-4">
          {/* Meal category */}
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

          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mink" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search foods and recipes…"
              className="pl-9"
            />
            {results.length > 0 && (
              <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-hairline bg-card shadow-sm">
                {results.map(({ type, item }) => (
                  <button
                    key={`${type}-${item.id}`}
                    onClick={() => selectResult({ type, item })}
                    className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left transition-colors duration-150 hover:bg-page"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-ink">
                        {type === 'recipe' && '🍴 '}
                        {item.name}
                        {type === 'food' && item.brand && (
                          <span className="ml-1 text-xs text-mink">{item.brand}</span>
                        )}
                      </p>
                      <p className="text-xs text-mink">
                        {type === 'recipe'
                          ? `${Math.round(item.total_calories / (item.servings || 1))} kcal / serving`
                          : `${item.calories} kcal / 100g${
                              item.unit_name ? ` · 1 ${item.unit_name} = ${item.unit_weight_grams}g` : ''
                            }`}
                      </p>
                    </div>
                    {type === 'recipe' && (
                      <span className="ml-2 shrink-0 rounded-full bg-terra/10 px-2 py-0.5 text-[10px] font-medium text-terra">
                        Recipe
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected item panel */}
          {selected && (
            <div className="animate-fadein space-y-3 rounded-lg border border-hairline bg-page p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink">
                  {selected.type === 'recipe' && (
                    <UtensilsCrossed size={13} className="mr-1 inline text-terra" />
                  )}
                  {selected.item.name}
                </p>
                <button
                  onClick={() => setSelected(null)}
                  className="cursor-pointer text-mink hover:text-ink"
                >
                  <X size={14} />
                </button>
              </div>

              {selected.type === 'food' && hasUnits && (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setInputMode('grams')}
                    className={cn(
                      'cursor-pointer rounded-md border px-2.5 py-1 text-xs transition-all duration-200',
                      inputMode === 'grams'
                        ? 'border-terra bg-terra/10 text-ink'
                        : 'border-hairline text-mink'
                    )}
                  >
                    grams
                  </button>
                  <button
                    onClick={() => setInputMode('units')}
                    className={cn(
                      'cursor-pointer rounded-md border px-2.5 py-1 text-xs transition-all duration-200',
                      inputMode === 'units'
                        ? 'border-terra bg-terra/10 text-ink'
                        : 'border-hairline text-mink'
                    )}
                  >
                    {selected.item.unit_name}s
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-9 w-28 bg-card"
                />
                <span className="text-xs text-mink">
                  {selected.type === 'recipe'
                    ? 'servings'
                    : inputMode === 'units'
                      ? selected.item.unit_name + '(s)'
                      : 'grams'}
                </span>
              </div>

              {preview && <MacroPreview macros={preview} />}

              <Button size="sm" onClick={addToMeal} disabled={!preview}>
                <Plus size={14} /> Add to Meal
              </Button>
            </div>
          )}

          {/* Meal items list */}
          {mealItems.length > 0 && (
            <div className="animate-fadein space-y-1">
              <Label>This meal</Label>
              <ul className="divide-y divide-hairline rounded-lg border border-hairline">
                {mealItems.map((item, i) => (
                  <li key={i} className="flex items-center justify-between px-3 py-2">
                    <div>
                      <p className="text-sm text-ink">{item.food_name}</p>
                      <p className="text-xs text-mink">
                        {item.servings}
                        {item.unit === 'srv' ? ' srv' : 'g'} · {item.calories} kcal
                      </p>
                    </div>
                    <button
                      onClick={() => setMealItems((prev) => prev.filter((_, j) => j !== i))}
                      className="cursor-pointer p-1 text-mink hover:text-red-600"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
              <p className="pt-1 text-right text-xs text-mink">
                Total: <strong className="text-ink">{itemTotals.calories} kcal</strong> · P{' '}
                {itemTotals.protein} · C {itemTotals.carbs} · F {itemTotals.fat}
              </p>
            </div>
          )}

          {/* Today's progress: logged + projected dual-segment bars */}
          {goal && mealItems.length > 0 && (
            <div className="animate-fadein space-y-2 rounded-lg border border-hairline bg-page p-3">
              <p className="micro">today's progress</p>
              {MACRO_BARS.map(({ key, label, colorVar }) => {
                const goalVal = goal[key] || 1
                const loggedPct = Math.min(100, (todayTotals[key] / goalVal) * 100)
                const projectedPct = Math.min(
                  100 - loggedPct,
                  (itemTotals[key] / goalVal) * 100
                )
                const total = todayTotals[key] + itemTotals[key]
                const over = total > goalVal
                return (
                  <div key={key}>
                    <div className="mb-0.5 flex justify-between text-xs">
                      <span className="text-mink">{label}</span>
                      <span className={over ? 'font-medium text-red-600' : 'text-mink'}>
                        {key === 'calories' ? Math.round(total) : round1(total)} /{' '}
                        {goalVal}
                        {key === 'calories' ? ' kcal' : 'g'}
                      </span>
                    </div>
                    <div className="flex h-1.5 overflow-hidden rounded-full bg-hairline">
                      <div
                        className="h-full transition-all duration-700 ease-out"
                        style={{ width: `${loggedPct}%`, background: `var(${colorVar})` }}
                      />
                      <div
                        className="h-full transition-all duration-700 ease-out"
                        style={{
                          width: `${projectedPct}%`,
                          background: `var(${colorVar})`,
                          opacity: 0.45,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}

          <Button className="w-full" onClick={saveMeal} disabled={mealItems.length === 0 || saving}>
            {saving ? 'Saving…' : 'Save Meal'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
