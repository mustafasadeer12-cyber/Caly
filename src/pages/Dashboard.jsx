import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { api } from '@/lib/api'
import {
  todayStr,
  sumLogs,
  calcStreak,
  getRuinedDays,
  toggleRuinedDay,
} from '@/lib/calc'
import { cn } from '@/lib/utils'
import Header from '@/components/Header'
import DateNavigator from '@/components/DateNavigator'
import GoalAlertBanners from '@/components/GoalAlertBanners'
import StreakCard from '@/components/StreakCard'
import RuinedDayCard from '@/components/RuinedDayCard'
import CaloriesCard from '@/components/CaloriesCard'
import MacroRings from '@/components/MacroRings'
import SupplementsCard from '@/components/SupplementsCard'
import FoodLog from '@/components/FoodLog'
import AddFoodModal from '@/components/AddFoodModal'
import GoalSetupModal from '@/components/GoalSetupModal'

export default function Dashboard() {
  const [date, setDate] = useState(todayStr())
  const [goal, setGoal] = useState(null)
  const [goalLoaded, setGoalLoaded] = useState(false)
  const [allLogs, setAllLogs] = useState([])
  const [dailyLog, setDailyLog] = useState(null)
  const [ruinedDays, setRuinedDays] = useState(getRuinedDays)
  const [addOpen, setAddOpen] = useState(false)
  const [goalOpen, setGoalOpen] = useState(false)
  const [dismissed, setDismissed] = useState({})

  const loadLogs = useCallback(() => {
    api.get('/meal-logs').then(setAllLogs).catch(console.error)
  }, [])

  useEffect(() => {
    api
      .get('/macro-goals')
      .then((g) => {
        setGoal(g)
        setGoalLoaded(true)
        if (!g) setGoalOpen(true) // first visit: prompt goal setup
      })
      .catch(() => setGoalLoaded(true))
    loadLogs()
  }, [loadLogs])

  // Supplements: independent cycle, auto-created server-side per date
  useEffect(() => {
    api.get(`/daily-logs?date=${date}`).then(setDailyLog).catch(console.error)
  }, [date])

  function changeDate(next) {
    setDate(next)
    setDailyLog(null) // clear stale supplements while the new date loads
    setDismissed({})
  }

  const logs = useMemo(() => allLogs.filter((l) => l.date === date), [allLogs, date])
  const totals = useMemo(() => sumLogs(logs), [logs])
  const streak = useMemo(
    () => calcStreak(allLogs, goal, date, ruinedDays),
    [allLogs, goal, date, ruinedDays]
  )
  const isRuined = ruinedDays.includes(date)

  async function deleteLog(id) {
    await api.del(`/meal-logs?id=${id}`)
    loadLogs()
  }

  async function updateSupplements(supplements) {
    // Optimistic update, then persist
    setDailyLog((d) => ({ ...d, supplements }))
    try {
      const saved = await api.put(`/daily-logs?id=${dailyLog.id}`, { supplements })
      setDailyLog(saved)
    } catch (e) {
      console.error(e)
      api.get(`/daily-logs?date=${date}`).then(setDailyLog)
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-[640px] px-4 pb-28">
      <Header onOpenSettings={() => setGoalOpen(true)} />

      <div className="space-y-4">
        <DateNavigator
          date={date}
          onChange={changeDate}
          isRuined={isRuined}
          onToggleRuined={() => setRuinedDays(toggleRuinedDay(date))}
        />

        {!isRuined && (
          <GoalAlertBanners
            totals={totals}
            goal={goal}
            dismissed={dismissed}
            onDismiss={(key) => setDismissed((d) => ({ ...d, [key]: true }))}
          />
        )}

        {goal && <StreakCard {...streak} />}

        {isRuined ? (
          <RuinedDayCard onUndo={() => setRuinedDays(toggleRuinedDay(date))} />
        ) : goal ? (
          <>
            <CaloriesCard current={totals.calories} goal={goal.calories} />
            <MacroRings totals={totals} goal={goal} />
          </>
        ) : (
          goalLoaded && (
            <button
              onClick={() => setGoalOpen(true)}
              className="w-full cursor-pointer rounded-xl border border-dashed border-mink/30 p-8 text-center text-sm text-mink transition-colors duration-200 hover:text-ink"
            >
              Set your daily macro goals to start tracking
            </button>
          )
        )}

        <SupplementsCard dailyLog={dailyLog} onUpdate={updateSupplements} />

        {!isRuined && <FoodLog logs={logs} onDelete={deleteLog} />}
      </div>

      {/* FAB */}
      <button
        onClick={() => setAddOpen(true)}
        disabled={isRuined}
        title="Add food"
        className={cn(
          'fixed bottom-6 right-6 z-30 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-ink to-ink/80 text-card shadow-lg transition-all duration-200 hover:opacity-90 min-[720px]:right-[calc(50%-336px)]',
          isRuined && 'pointer-events-none opacity-30'
        )}
      >
        <Plus size={24} />
      </button>

      <AddFoodModal
        open={addOpen}
        onOpenChange={setAddOpen}
        date={date}
        todayTotals={totals}
        goal={goal}
        onSaved={loadLogs}
      />
      <GoalSetupModal open={goalOpen} onOpenChange={setGoalOpen} goal={goal} onSaved={setGoal} />
    </div>
  )
}
