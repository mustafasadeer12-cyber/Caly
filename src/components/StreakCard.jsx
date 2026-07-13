import { Flame } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function StreakCard({ streak, onFire, totalSuccessDays }) {
  const microcopy =
    streak === 0
      ? 'Log a day within your goals to start a streak.'
      : onFire
        ? "You're on fire — keep the ratio."
        : 'Keep it going, one clean day at a time.'

  return (
    <Card className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-terra/10 text-terra">
          <Flame size={18} />
        </div>
        <div>
          <p className="font-serif text-xl leading-none text-ink">
            {streak} day{streak === 1 ? '' : 's'}
            {onFire && ' 🔥'}
          </p>
          <p className="mt-1 text-xs text-mink">{microcopy}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="micro">success days</p>
        <p className="font-serif text-lg text-ink">{totalSuccessDays}</p>
      </div>
    </Card>
  )
}
