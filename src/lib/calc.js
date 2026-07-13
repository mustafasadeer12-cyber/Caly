import { format, subDays, parseISO } from 'date-fns'

export const todayStr = () => format(new Date(), 'yyyy-MM-dd')
export const round1 = (n) => Math.round(n * 10) / 10

// Food → macros for a given gram amount (per-100g data)
export function foodMacros(food, grams) {
  const ratio = grams / 100
  return {
    calories: Math.round(food.calories * ratio),
    protein: round1(food.protein * ratio),
    carbs: round1(food.carbs * ratio),
    fat: round1(food.fat * ratio),
  }
}

// Recipe → macros scaled by desired servings
export function recipeMacros(recipe, servings) {
  const ratio = servings / (recipe.servings || 1)
  return {
    calories: Math.round((recipe.total_calories || 0) * ratio),
    protein: round1((recipe.total_protein || 0) * ratio),
    carbs: round1((recipe.total_carbs || 0) * ratio),
    fat: round1((recipe.total_fat || 0) * ratio),
  }
}

export function sumLogs(logs) {
  return logs.reduce(
    (acc, l) => ({
      calories: acc.calories + (l.calories || 0),
      protein: acc.protein + (l.protein || 0),
      carbs: acc.carbs + (l.carbs || 0),
      fat: acc.fat + (l.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

export function groupTotalsByDate(allLogs) {
  const map = {}
  for (const l of allLogs) {
    if (!map[l.date]) map[l.date] = { calories: 0, protein: 0, carbs: 0, fat: 0 }
    const t = map[l.date]
    t.calories += l.calories || 0
    t.protein += l.protein || 0
    t.carbs += l.carbs || 0
    t.fat += l.fat || 0
  }
  return map
}

// A day is successful if within 105% of every goal and non-empty
export function isSuccessDay(totals, goal) {
  if (!totals || !goal) return false
  return (
    totals.calories > 0 &&
    totals.calories <= goal.calories * 1.05 &&
    totals.protein <= goal.protein * 1.05 &&
    totals.carbs <= goal.carbs * 1.05 &&
    totals.fat <= goal.fat * 1.05
  )
}

export function calcStreak(allLogs, goal, selectedDate, ruinedDays) {
  if (!goal) return { streak: 0, onFire: false, totalSuccessDays: 0 }
  const totals = groupTotalsByDate(allLogs)

  let streak = 0
  let d = selectedDate
  let guard = 0
  for (;;) {
    if (++guard > 3650) break
    if (ruinedDays.includes(d)) {
      streak = 0
      break
    }
    const t = totals[d]
    if (isSuccessDay(t, goal)) {
      streak++
    } else if (d === selectedDate && (!t || t.calories === 0)) {
      // in-progress day: skip, keep walking back
    } else {
      break
    }
    d = format(subDays(parseISO(d), 1), 'yyyy-MM-dd')
  }

  const totalSuccessDays = Object.entries(totals).filter(
    ([date, t]) => !ruinedDays.includes(date) && isSuccessDay(t, goal)
  ).length

  return { streak, onFire: streak >= 3, totalSuccessDays }
}

// Ruined days live in localStorage, keyed exactly as the original app
const RUINED_KEY = 'macroflow-ruined-days'

export function getRuinedDays() {
  try {
    return JSON.parse(localStorage.getItem(RUINED_KEY)) || []
  } catch {
    return []
  }
}

export function toggleRuinedDay(date) {
  const days = getRuinedDays()
  const next = days.includes(date) ? days.filter((d) => d !== date) : [...days, date]
  localStorage.setItem(RUINED_KEY, JSON.stringify(next))
  return next
}

export const MEAL_CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snacks']
