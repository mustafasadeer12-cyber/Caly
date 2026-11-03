import { useState } from 'react'
import { Flame, Plus, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MEAL_CATEGORIES } from '@/lib/calc'
import { cn } from '@/lib/utils'

export default function CaloriesCard({ current, goal, onQuickAdd }) {
  const over = current > goal
  const remaining = Math.round(goal - current)
  const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0

  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [category, setCategory] = useState('dinner')
  const [saving, setSaving] = useState(false)

  const kcal = parseFloat(value) || 0

  async function submit(e) {
    e.preventDefault()
    if (kcal <= 0) return
    setSaving(true)
    try {
      await onQuickAdd(kcal, category)
      setValue('')
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame size={14} className="text-terra" />
          <span className="micro">calories</span>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          title="Quick add calories"
          className="cursor-pointer rounded-full p-1 text-mink transition-colors duration-200 hover:text-ink"
        >
          {open ? <X size={16} /> : <Plus size={16} />}
        </button>
      </div>

      {/* Quick add: just a number, no food search */}
      {open && (
        <form onSubmit={submit} className="animate-fadein mb-4 space-y-2">
          <div className="flex gap-1.5">
            {MEAL_CATEGORIES.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  'flex-1 cursor-pointer rounded-lg border px-2 py-1 text-xs capitalize transition-all duration-200',
                  category === c
                    ? 'border-terra bg-terra/10 text-ink'
                    : 'border-hairline text-mink hover:text-ink'
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 360"
              className="h-9 w-32"
            />
            <span className="text-xs text-mink">kcal</span>
            <Button size="sm" type="submit" disabled={kcal <= 0 || saving}>
              {saving ? 'Adding…' : 'Add'}
            </Button>
          </div>
        </form>
      )}

      <div className="flex items-end justify-between">
        <div>
          <span className="font-serif text-5xl leading-none text-ink">
            {Math.round(current)}
          </span>
          <span className="ml-2 text-sm text-mink">of {Math.round(goal)} kcal</span>
        </div>
        <span className={cn('text-sm font-medium', over ? 'text-red-600' : 'text-mink')}>
          {over ? `${Math.abs(remaining)} kcal over goal` : `${remaining} kcal left`}
        </span>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-hairline">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            over
              ? 'bg-red-500'
              : 'bg-gradient-to-r from-terra/80 to-terra'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </Card>
  )
}
