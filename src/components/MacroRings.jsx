import { Beef, Wheat, Droplets } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { round1 } from '@/lib/calc'

const RING_SIZE = 92
const RADIUS = 38
const STROKE = 6
const CIRC = 2 * Math.PI * RADIUS

function Ring({ label, icon: Icon, current, goal, colorVar }) {
  const pct = goal > 0 ? Math.min(1, current / goal) : 0
  const gradId = `ring-${label}`
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
        <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={`var(${colorVar})`} stopOpacity="0.65" />
              <stop offset="100%" stopColor={`var(${colorVar})`} />
            </linearGradient>
          </defs>
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--hairline)"
            strokeWidth={STROKE}
          />
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - pct)}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon size={18} style={{ color: `var(${colorVar})` }} />
        </div>
      </div>
      <p className="micro mt-2">{label}</p>
      <p className="text-xs text-mink">
        <span className="font-medium text-ink">{round1(current)}</span> / {goal}g
      </p>
    </div>
  )
}

export default function MacroRings({ totals, goal }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-around">
        <Ring label="protein" icon={Beef} current={totals.protein} goal={goal.protein} colorVar="--protein" />
        <Ring label="carbs" icon={Wheat} current={totals.carbs} goal={goal.carbs} colorVar="--carbs" />
        <Ring label="fat" icon={Droplets} current={totals.fat} goal={goal.fat} colorVar="--fatm" />
      </div>
    </Card>
  )
}
