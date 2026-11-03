import { Flame } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function CaloriesCard({ current, goal }) {
  const over = current > goal
  const remaining = Math.round(goal - current)
  const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <Flame size={14} className="text-terra" />
        <span className="micro">calories</span>
      </div>

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
