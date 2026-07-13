import { useState } from 'react'
import { Pill, Plus, Check, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function SupplementsCard({ dailyLog, onUpdate }) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  if (!dailyLog) return null
  const supplements = dailyLog.supplements || []
  const takenCount = supplements.filter((s) => s.isTaken).length
  const allTaken = supplements.length > 0 && takenCount === supplements.length

  const toggle = (index) => {
    const next = supplements.map((s, i) => (i === index ? { ...s, isTaken: !s.isTaken } : s))
    onUpdate(next)
  }

  const remove = (index) => {
    onUpdate(supplements.filter((_, i) => i !== index))
  }

  const add = () => {
    const name = newName.trim()
    if (!name) return
    onUpdate([...supplements, { name, isTaken: false }])
    setNewName('')
    setAdding(false)
  }

  return (
    <Card
      className={cn(
        'p-5 transition-colors duration-700',
        allTaken && 'bg-gradient-to-br from-terra/10 to-carbs/10'
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pill size={14} className="text-terra" />
          <span className="micro">daily supplements</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-mink">
            {takenCount} of {supplements.length} taken
          </span>
          <button
            onClick={() => setAdding((v) => !v)}
            className="cursor-pointer rounded-lg p-1 text-mink transition-colors duration-200 hover:text-ink"
            title="Add supplement"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {adding && (
        <div className="mb-3 flex animate-fadein gap-2">
          <Input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Supplement name"
            className="h-9"
          />
          <Button size="sm" className="h-9" onClick={add}>
            Add
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {supplements.map((s, i) => (
          <div key={`${s.name}-${i}`} className="group relative">
            <button
              onClick={() => toggle(i)}
              className={cn(
                'flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm transition-all duration-200',
                s.isTaken
                  ? 'border-transparent bg-gradient-to-br from-ink to-ink/80 text-card opacity-80'
                  : 'border-hairline bg-card text-ink hover:border-mink/40'
              )}
            >
              {s.isTaken && <Check size={13} />}
              {s.name}
            </button>
            <button
              onClick={() => remove(i)}
              className="absolute -right-1 -top-1 hidden h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-red-500 text-white group-hover:flex"
              title={`Remove ${s.name}`}
            >
              <X size={10} />
            </button>
          </div>
        ))}
        {supplements.length === 0 && (
          <p className="text-xs text-mink">No supplements yet — tap + to add one.</p>
        )}
      </div>
    </Card>
  )
}
