import { useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input, Label } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

const DAILY_FIELDS = [
  { key: 'calories', label: 'Calories (kcal)' },
  { key: 'protein', label: 'Protein (g)' },
  { key: 'carbs', label: 'Carbs (g)' },
  { key: 'fat', label: 'Fat (g)' },
]

const DEFAULTS = { calories: 2000, protein: 150, carbs: 200, fat: 70 }

// Mounted only while open, so state seeds from the latest goal on each open
export default function GoalSetupModal(props) {
  if (!props.open) return null
  return <GoalSetupModalInner {...props} />
}

function GoalSetupModalInner({ open, onOpenChange, goal, onSaved }) {
  const [daily, setDaily] = useState(() =>
    goal
      ? { calories: goal.calories, protein: goal.protein, carbs: goal.carbs, fat: goal.fat }
      : DEFAULTS
  )
  const [alerts, setAlerts] = useState(() => ({
    calories: goal?.alert_calories_pct || 0,
    protein: goal?.alert_protein_pct || 0,
    carbs: goal?.alert_carbs_pct || 0,
    fat: goal?.alert_fat_pct || 0,
  }))
  const [theme, setTheme] = useState(() => localStorage.getItem('caly-theme') || 'light')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function applyTheme(next) {
    setTheme(next)
    localStorage.setItem('caly-theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  async function save() {
    setSaving(true)
    setError('')
    try {
      const payload = {
        calories: Number(daily.calories) || 0,
        protein: Number(daily.protein) || 0,
        carbs: Number(daily.carbs) || 0,
        fat: Number(daily.fat) || 0,
        weekly_calories: (Number(daily.calories) || 0) * 7,
        weekly_protein: (Number(daily.protein) || 0) * 7,
        weekly_carbs: (Number(daily.carbs) || 0) * 7,
        weekly_fat: (Number(daily.fat) || 0) * 7,
        alert_calories_pct: alerts.calories,
        alert_protein_pct: alerts.protein,
        alert_carbs_pct: alerts.carbs,
        alert_fat_pct: alerts.fat,
      }
      const saved = await api.post('/macro-goals', payload)
      onSaved(saved)
      onOpenChange(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Goals & settings">
        <Tabs defaultValue="daily">
          <TabsList>
            <TabsTrigger value="daily">Daily Goals</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-3">
            {DAILY_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <Label>{label}</Label>
                <Input
                  type="number"
                  min="0"
                  value={daily[key]}
                  onChange={(e) => setDaily((d) => ({ ...d, [key]: e.target.value }))}
                />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="weekly">
            <p className="mb-3 text-xs text-mink">
              Weekly averages are calculated automatically from your daily goals.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DAILY_FIELDS.map(({ key, label }) => (
                <div key={key} className="rounded-lg border border-hairline bg-page p-3">
                  <p className="micro">{label.split(' ')[0]}</p>
                  <p className="font-serif text-lg text-ink">
                    {((Number(daily[key]) || 0) * 7).toLocaleString()}
                  </p>
                  <p className="text-xs text-mink">per week</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <p className="text-xs text-mink">
              Get a banner when a macro reaches a percentage of its goal. Set to 0 to turn off.
            </p>
            {DAILY_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium text-mink">{label.split(' ')[0]}</span>
                  <span className="text-ink">
                    {alerts[key] > 0 ? `${alerts[key]}%` : 'Off'}
                  </span>
                </div>
                <Slider
                  min={0}
                  max={150}
                  step={5}
                  value={[alerts[key]]}
                  onValueChange={([v]) => setAlerts((a) => ({ ...a, [key]: v }))}
                />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="theme">
            <p className="mb-3 text-xs text-mink">Choose how Caly looks on this device.</p>
            <div className="flex gap-2">
              {[
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => applyTheme(value)}
                  className={cn(
                    'flex flex-1 cursor-pointer flex-col items-center gap-1.5 rounded-lg border p-4 transition-all duration-200',
                    theme === value
                      ? 'border-terra bg-terra/10 text-ink'
                      : 'border-hairline text-mink hover:text-ink'
                  )}
                >
                  <Icon size={18} />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

        <Button className="mt-4 w-full" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save Goals'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
