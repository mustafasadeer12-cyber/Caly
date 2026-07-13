import { AlertTriangle, X } from 'lucide-react'

const MACROS = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Carbs', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' },
]

export default function GoalAlertBanners({ totals, goal, dismissed, onDismiss }) {
  if (!goal) return null

  const banners = MACROS.filter(({ key }) => {
    const threshold = goal[`alert_${key}_pct`]
    if (!threshold || threshold <= 0 || dismissed[key]) return false
    const pct = goal[key] > 0 ? (totals[key] / goal[key]) * 100 : 0
    return pct >= threshold
  })

  if (banners.length === 0) return null

  return (
    <div className="space-y-2">
      {banners.map(({ key, label }) => {
        const pct = Math.round((totals[key] / goal[key]) * 100)
        return (
          <div
            key={key}
            className="flex animate-fadein items-center justify-between rounded-xl border border-terra/30 bg-terra/10 px-4 py-2.5"
          >
            <div className="flex items-center gap-2 text-sm text-ink">
              <AlertTriangle size={15} className="shrink-0 text-terra" />
              <span>
                {label} has reached <strong>{pct}%</strong> of your daily goal.
              </span>
            </div>
            <button
              onClick={() => onDismiss(key)}
              className="cursor-pointer p-1 text-mink transition-colors duration-200 hover:text-ink"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
