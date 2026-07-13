import { useEffect, useMemo, useState } from 'react'
import { format, subDays, parseISO } from 'date-fns'
import { Download } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'
import PageHeader from '@/components/PageHeader'
import { Card } from '@/components/ui/card'
import { Input, Label } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { api } from '@/lib/api'
import { groupTotalsByDate, isSuccessDay, round1, todayStr } from '@/lib/calc'

const CHART = {
  cal: 'var(--chart-cal)',
  protein: 'var(--chart-protein)',
  carbs: 'var(--chart-carbs)',
  fat: 'var(--chart-fat)',
}

const axisProps = {
  tick: { fontSize: 10, fill: 'var(--mink)' },
  axisLine: { stroke: 'var(--hairline)' },
  tickLine: false,
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-hairline bg-card px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 font-medium text-ink">{format(parseISO(label), 'EEE, MMM d')}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-mink">
          <span
            className="mr-1.5 inline-block h-2 w-2 rounded-full"
            style={{ background: p.color || p.fill }}
          />
          {p.name}: <strong className="text-ink">{round1(p.value)}</strong>
        </p>
      ))}
    </div>
  )
}

function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function History() {
  const [allLogs, setAllLogs] = useState([])
  const [goal, setGoal] = useState(null)
  const today = todayStr()
  const [from, setFrom] = useState(format(subDays(new Date(), 29), 'yyyy-MM-dd'))
  const [to, setTo] = useState(today)

  useEffect(() => {
    api.get('/meal-logs').then(setAllLogs).catch(console.error)
    api.get('/macro-goals').then(setGoal).catch(console.error)
  }, [])

  const totalsByDate = useMemo(() => groupTotalsByDate(allLogs), [allLogs])

  // Last 30 days, zero-filled, oldest → newest
  const last30 = useMemo(() => {
    const days = []
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
      const t = totalsByDate[d] || { calories: 0, protein: 0, carbs: 0, fat: 0 }
      days.push({ date: d, ...t })
    }
    return days
  }, [totalsByDate])

  const weeklyAvg = useMemo(() => {
    const week = last30.slice(-7).filter((d) => d.calories > 0)
    if (week.length === 0) return null
    const sum = week.reduce(
      (a, d) => ({
        calories: a.calories + d.calories,
        protein: a.protein + d.protein,
        carbs: a.carbs + d.carbs,
        fat: a.fat + d.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )
    return {
      days: week.length,
      calories: Math.round(sum.calories / week.length),
      protein: round1(sum.protein / week.length),
      carbs: round1(sum.carbs / week.length),
      fat: round1(sum.fat / week.length),
    }
  }, [last30])

  const dailySummaries = useMemo(
    () =>
      Object.entries(totalsByDate)
        .sort(([a], [b]) => (a < b ? 1 : -1))
        .map(([date, t]) => ({ date, ...t })),
    [totalsByDate]
  )

  function rowsInRange(fromDate, toDate) {
    return dailySummaries
      .filter((d) => d.date >= fromDate && d.date <= toDate)
      .sort((a, b) => (a.date < b.date ? -1 : 1))
  }

  function exportAs(kind, allTime = false) {
    const rows = allTime
      ? [...dailySummaries].sort((a, b) => (a.date < b.date ? -1 : 1))
      : rowsInRange(from, to)
    if (rows.length === 0) return
    const stamp = allTime ? 'all-time' : `${from}_${to}`
    if (kind === 'csv') {
      const csv = [
        'date,calories,protein,carbs,fat',
        ...rows.map(
          (r) => `${r.date},${Math.round(r.calories)},${round1(r.protein)},${round1(r.carbs)},${round1(r.fat)}`
        ),
      ].join('\n')
      download(`caly-${stamp}.csv`, csv, 'text/csv')
    } else if (kind === 'json') {
      download(`caly-${stamp}.json`, JSON.stringify(rows, null, 2), 'application/json')
    } else {
      const md = [
        '| Date | Calories | Protein | Carbs | Fat |',
        '|---|---|---|---|---|',
        ...rows.map(
          (r) =>
            `| ${r.date} | ${Math.round(r.calories)} | ${round1(r.protein)} | ${round1(r.carbs)} | ${round1(r.fat)} |`
        ),
      ].join('\n')
      download(`caly-${stamp}.md`, md, 'text/markdown')
    }
  }

  const tickFormatter = (d) => format(parseISO(d), 'MMM d')

  return (
    <div className="mx-auto min-h-screen max-w-[640px] px-4 pb-16">
      <PageHeader title="History" />

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          {/* 30-day calorie line chart */}
          <Card className="p-4">
            <p className="micro mb-3">calories · last 30 days</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={last30} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="var(--hairline)" vertical={false} />
                <XAxis dataKey="date" {...axisProps} tickFormatter={tickFormatter} interval={6} />
                <YAxis {...axisProps} width={52} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--mink)', strokeWidth: 1 }} />
                {goal && (
                  <ReferenceLine
                    y={goal.calories}
                    stroke="var(--mink)"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="calories"
                  name="Calories"
                  stroke={CHART.cal}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, stroke: 'var(--card)', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Weekly average */}
          <Card className="p-4">
            <p className="micro mb-2">weekly average</p>
            {weeklyAvg ? (
              <div className="flex items-end justify-between">
                <div>
                  <span className="font-serif text-3xl text-ink">{weeklyAvg.calories}</span>
                  <span className="ml-1.5 text-xs text-mink">kcal / day</span>
                </div>
                <p className="text-xs text-mink">
                  P {weeklyAvg.protein} · C {weeklyAvg.carbs} · F {weeklyAvg.fat} · {weeklyAvg.days}{' '}
                  logged day{weeklyAvg.days === 1 ? '' : 's'}
                </p>
              </div>
            ) : (
              <p className="text-xs text-mink">No logs in the past 7 days.</p>
            )}
          </Card>

          {/* Export */}
          <Card className="p-4">
            <p className="micro mb-3">export</p>
            <div className="mb-3 flex items-end gap-2">
              <div className="flex-1">
                <Label>From</Label>
                <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="flex-1">
                <Label>To</Label>
                <Input type="date" value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} />
              </div>
              <Button variant="outline" size="sm" className="h-10" onClick={() => exportAs('csv', true)}>
                All Time
              </Button>
            </div>
            <div className="flex gap-2">
              {['csv', 'json', 'markdown'].map((kind) => (
                <Button key={kind} variant="outline" size="sm" onClick={() => exportAs(kind)}>
                  <Download size={13} /> {kind.toUpperCase()}
                </Button>
              ))}
            </div>
          </Card>

          {/* Daily summaries */}
          <Card className="p-4">
            <p className="micro mb-2">daily summary</p>
            {dailySummaries.length === 0 ? (
              <p className="text-xs text-mink">Nothing logged yet.</p>
            ) : (
              <ul className="divide-y divide-hairline">
                {dailySummaries.map((d) => {
                  const success = goal && isSuccessDay(d, goal)
                  return (
                    <li key={d.date} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: success ? 'var(--fatm)' : 'var(--hairline)' }}
                          title={success ? 'Within goals' : 'Outside goals'}
                        />
                        <span className="text-sm text-ink">
                          {format(parseISO(d.date), 'EEE, MMM d yyyy')}
                        </span>
                      </div>
                      <span className="text-xs text-mink">
                        <strong className="text-ink">{Math.round(d.calories)}</strong> kcal · P{' '}
                        {round1(d.protein)} · C {round1(d.carbs)} · F {round1(d.fat)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {/* 30-day calorie bar chart */}
          <Card className="p-4">
            <p className="micro mb-3">calories · last 30 days</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={last30} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="var(--hairline)" vertical={false} />
                <XAxis dataKey="date" {...axisProps} tickFormatter={tickFormatter} interval={6} />
                <YAxis {...axisProps} width={52} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--hairline)', opacity: 0.5 }} />
                <Bar
                  dataKey="calories"
                  name="Calories"
                  fill={CHART.cal}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={14}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* 30-day macro trends */}
          <Card className="p-4">
            <p className="micro mb-3">macro trends · last 30 days</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={last30} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="var(--hairline)" vertical={false} />
                <XAxis dataKey="date" {...axisProps} tickFormatter={tickFormatter} interval={6} />
                <YAxis {...axisProps} width={52} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--mink)', strokeWidth: 1 }} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ color: 'var(--mink)', fontSize: 11 }}>{value}</span>
                  )}
                />
                <Line type="monotone" dataKey="protein" name="Protein" stroke={CHART.protein} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="carbs" name="Carbs" stroke={CHART.carbs} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="fat" name="Fat" stroke={CHART.fat} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
