import { CloudOff } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function RuinedDayCard({ onUndo }) {
  return (
    <Card className="flex flex-col items-center gap-3 bg-ink p-8 text-center">
      <CloudOff size={28} className="text-card/70" />
      <p className="micro !text-card/60">ruined day</p>
      <p className="text-sm text-card/80">Calculations paused for this day.</p>
      <Button variant="outline" size="sm" onClick={onUndo} className="mt-1">
        Undo
      </Button>
    </Card>
  )
}
