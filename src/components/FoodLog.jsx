import { Sunrise, Sun, Moon, Cookie, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { round1 } from '@/lib/calc'

const CATEGORIES = [
  { key: 'breakfast', label: 'Breakfast', icon: Sunrise },
  { key: 'lunch', label: 'Lunch', icon: Sun },
  { key: 'dinner', label: 'Dinner', icon: Moon },
  { key: 'snacks', label: 'Snacks', icon: Cookie },
]

export default function FoodLog({ logs, onDelete }) {
  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-mink/30 p-8 text-center">
        <p className="text-sm text-mink">Tap + to add your first meal</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {CATEGORIES.map(({ key, label, icon: Icon }) => {
        const items = logs.filter((l) => l.meal_category === key)
        if (items.length === 0) return null
        const kcal = Math.round(items.reduce((sum, l) => sum + l.calories, 0))
        return (
          <Card key={key} className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon size={14} className="text-mink" />
                <span className="micro">{label}</span>
              </div>
              <span className="text-xs font-medium text-mink">{kcal} kcal</span>
            </div>
            <ul className="divide-y divide-hairline">
              {items.map((item) => (
                <li key={item.id} className="group flex items-center justify-between py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink">{item.food_name}</p>
                    <p className="text-xs text-mink">
                      {item.servings}
                      {item.unit === 'srv' ? ' srv' : 'g'} · P {round1(item.protein)} · C{' '}
                      {round1(item.carbs)} · F {round1(item.fat)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-ink">
                      {Math.round(item.calories)}
                    </span>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="cursor-pointer p-1 text-mink/50 transition-colors duration-200 hover:text-red-600"
                      title="Delete entry"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )
      })}
    </div>
  )
}
