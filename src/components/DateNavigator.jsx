import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { format, parseISO, addDays } from 'date-fns'
import { todayStr } from '@/lib/calc'
import { cn } from '@/lib/utils'

export default function DateNavigator({ date, onChange, isRuined, onToggleRuined }) {
  const today = todayStr()
  const isToday = date === today
  const label = isToday ? 'Today' : format(parseISO(date), 'EEEE, MMM d')

  const shift = (days) => onChange(format(addDays(parseISO(date), days), 'yyyy-MM-dd'))

  return (
    <div className="flex items-center justify-between rounded-xl border border-hairline bg-card px-2 py-1.5">
      <button
        onClick={() => shift(-1)}
        className="cursor-pointer rounded-lg p-2 text-mink transition-colors duration-200 hover:text-ink"
        title="Previous day"
      >
        <ChevronLeft size={18} />
      </button>

      <span className="text-sm font-medium text-ink">{label}</span>

      <div className="flex items-center gap-1">
        <button
          onClick={onToggleRuined}
          title={isRuined ? 'Unmark ruined day' : 'Mark as ruined day'}
          className={cn(
            'cursor-pointer rounded-lg p-2 transition-colors duration-200',
            isRuined ? 'text-terra' : 'text-mink/60 hover:text-ink'
          )}
        >
          <X size={15} />
        </button>
        <button
          onClick={() => shift(1)}
          disabled={isToday}
          className="cursor-pointer rounded-lg p-2 text-mink transition-colors duration-200 hover:text-ink disabled:pointer-events-none disabled:opacity-30"
          title="Next day"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
