import type { Entry, Tank } from '../types'

export type Status = 'good' | 'watch' | 'action'

export const STATUS_LABEL: Record<Status, string> = {
  good: 'Good',
  watch: 'Watch',
  action: 'Action needed',
}

export type Trend = 'up' | 'down' | 'steady' | 'none'

export type Latest = {
  entry: Entry
  ammonia: number | null
  nitrite: number | null
  nitrate: number | null
  phosphate: number | null
  ph: number | null
  waterTemp: number | null
  nh3: number | null
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

export function latestTest(entries: Entry[]): Latest | null {
  const tests = entries
    .filter((e) => e.kind === 'test')
    .sort((a, b) => b.date.localeCompare(a.date))
  if (!tests.length) return null
  const entry = tests[0]
  return {
    entry,
    ammonia: entry.ammonia ?? null,
    nitrite: entry.nitrite ?? null,
    nitrate: entry.nitrate ?? null,
    phosphate: entry.phosphate ?? null,
    ph: entry.ph ?? null,
    waterTemp: entry.waterTemp ?? null,
    nh3: null,
  }
}

// Emerson equation: fraction of total ammonia as free NH3 depends on pH and temperature.
export function freeAmmonia(totalAmmonia: number, ph: number, tempC: number): number {
  const pKa = 0.09018 + 2729.92 / (273.2 + tempC)
  const fraction = 1 / (1 + 10 ** (pKa - ph))
  return totalAmmonia * fraction
}

function slopeTrend(values: { t: number; v: number }[]): Trend {
  if (values.length < 2) return 'none'
  const n = values.length
  const sumX = values.reduce((s, p) => s + p.t, 0)
  const sumY = values.reduce((s, p) => s + p.v, 0)
  const sumXY = values.reduce((s, p) => s + p.t * p.v, 0)
  const sumXX = values.reduce((s, p) => s + p.t * p.t, 0)
  const denom = n * sumXX - sumX * sumX
  if (denom === 0) return 'steady'
  const slope = (n * sumXY - sumX * sumY) / denom
  const scale = Math.max(...values.map((p) => Math.abs(p.v)), 1)
  const norm = (slope * (values[n - 1].t - values[0].t)) / scale
  if (norm > 0.04) return 'up'
  if (norm < -0.04) return 'down'
  return 'steady'
}

export function metricTrend(entries: Entry[], key: 'ammonia' | 'nitrite' | 'nitrate' | 'phosphate' | 'ph' | 'waterTemp'): Trend {
  const WINDOW = 86_400_000 * 14
  const cutoff = Date.now() - WINDOW
  const values = entries
    .filter((e) => e.kind === 'test' && isNum(e[key]) && new Date(e.date).getTime() >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({ t: new Date(e.date).getTime(), v: e[key] as number }))
  return slopeTrend(values)
}

export function tankStatus(entries: Entry[], tank: Tank): { status: Status; reasons: string[]; latest: Latest | null } {
  const latest = latestTest(entries)
  const reasons: string[] = []
  if (!latest) {
    const fresh = tank.setupDate && (Date.now() - new Date(tank.setupDate).getTime()) / 86_400_000 < 45
    return { status: fresh ? 'watch' : 'good', reasons: fresh ? ['New tank, no tests yet'] : [], latest }
  }
  const cycling = latest.ammonia !== null || (latest.nitrite ?? 0) > 0 || latest.nitrate === null
  if (isNum(latest.ammonia)) {
    const threshold = cycling ? 1.0 : 0.25
    if (latest.ammonia >= threshold) reasons.push(`Ammonia ${latest.ammonia} ppm`)
    else if (latest.ammonia > 0.1) reasons.push('Trace ammonia')
  }
  if (isNum(latest.nitrite)) {
    const threshold = cycling ? 2.0 : 0.25
    if (latest.nitrite >= threshold) reasons.push(`Nitrite ${latest.nitrite} ppm`)
    else if (latest.nitrite > 0.1) reasons.push('Trace nitrite')
  }
  if (isNum(latest.nitrate)) {
    if (latest.nitrate > 40) reasons.push(`Nitrate high (${latest.nitrate})`)
    else if (latest.nitrate > 20) reasons.push('Nitrate rising')
  }
  if (isNum(latest.ph) && (latest.ph < 6.4 || latest.ph > 8.4)) reasons.push(`pH ${latest.ph}`)
  if (isNum(latest.waterTemp) && (latest.waterTemp < 20 || latest.waterTemp > 29)) reasons.push('Temperature out of range')
  let status: Status = 'good'
  if (reasons.length) status = latest.ammonia !== null && latest.ammonia >= (cycling ? 1.0 : 0.25) || latest.nitrite !== null && latest.nitrite >= (cycling ? 2.0 : 0.25) || (latest.nitrate ?? 0) > 40 ? 'action' : 'watch'
  return { status, reasons, latest }
}

export type CycleStage = 'cycling' | 'establishing' | 'cycled' | 'stable'

export const CYCLE_LABEL: Record<CycleStage, string> = {
  cycling: 'Cycling',
  establishing: 'Establishing',
  cycled: 'Cycled',
  stable: 'Stable',
}

export function cycleStage(entries: Entry[], tank: Tank): { stage: CycleStage; progress: number } {
  const ageDays = tank.setupDate ? (Date.now() - new Date(tank.setupDate).getTime()) / 86_400_000 : null
  const tests = entries.filter((e) => e.kind === 'test').sort((a, b) => a.date.localeCompare(b.date))
  if (!tests.length || ageDays === null) {
    return { stage: 'cycling', progress: tests.length ? 0.05 : 0 }
  }
  const recent = tests.slice(-5)
  const maxAmmo = Math.max(...recent.map((e) => e.ammonia ?? 0))
  const maxNit = Math.max(...recent.map((e) => e.nitrite ?? 0))
  const last = tests[tests.length - 1]
  const hasTests = (k: 'ammonia' | 'nitrite' | 'nitrate') => recent.some((e) => isNum(e[k]))
  const nitrateSeen = hasTests('nitrate')

  if (maxAmmo > 0.5 || maxNit > 0.5) {
    return { stage: 'cycling', progress: Math.min(0.45, ageDays / 45 + 0.1) }
  }
  if (ageDays < 21 || !nitrateSeen || !hasTests('ammonia')) {
    return { stage: 'establishing', progress: Math.min(0.75, 0.3 + ageDays / 60) }
  }
  if ((last.ammonia ?? 0) <= 0.25 && (last.nitrite ?? 0) <= 0.25 && (last.nitrate ?? 0) <= 10 && ageDays >= 60) {
    return { stage: 'stable', progress: 1 }
  }
  return { stage: 'cycled', progress: 0.85 }
}

export type Reminders = {
  waterChange: { due: boolean; overdue: boolean; lastIso: string | null; dueIso: string | null }
  test: { due: boolean; overdue: boolean; lastIso: string | null; dueIso: string | null }
  feeding: { dueNow: boolean; timesPerDay: number }
}

export function reminders(entries: Entry[], tank: Tank): Reminders {
  const now = Date.now()
  const wcs = entries.filter((e) => e.kind === 'waterChange' || (e.kind === 'maintenance' && e.maintenanceType === 'waterChange')).sort((a, b) => b.date.localeCompare(a.date))
  const lastWc = wcs[0]?.date ?? tank.setupDate ?? null
  const wcDueMs = lastWc ? new Date(lastWc).getTime() + 7 * 86_400_000 : null
  const tests = entries.filter((e) => e.kind === 'test').sort((a, b) => b.date.localeCompare(a.date))
  const lastTest = tests[0]?.date ?? null
  const cyclingish = !lastTest || tests.slice(0, 3).some((t) => (t.ammonia ?? 0) > 0.25 || (t.nitrite ?? 0) > 0.25) || (tank.setupDate && now - new Date(tank.setupDate).getTime() < 45 * 86_400_000)
  const gap = cyclingish ? 2 : 7
  const testDueMs = lastTest ? new Date(lastTest).getTime() + gap * 86_400_000 : null
  const times = tank.feedingSchedule?.timesPerDay ?? 0
  const todaysFeedings = entries.filter((e) => e.kind === 'feeding' && sameDay(e.date, now)).length
  return {
    waterChange: {
      due: wcDueMs !== null && wcDueMs - now < 12 * 3_600_000,
      overdue: wcDueMs !== null && wcDueMs < now,
      lastIso: lastWc,
      dueIso: wcDueMs ? new Date(wcDueMs).toISOString() : null,
    },
    test: {
      due: testDueMs !== null && testDueMs - now < 12 * 3_600_000,
      overdue: testDueMs !== null && testDueMs < now,
      lastIso: lastTest,
      dueIso: testDueMs ? new Date(testDueMs).toISOString() : null,
    },
    feeding: { dueNow: times > 0 && todaysFeedings < times, timesPerDay: times },
  }
}

function sameDay(iso: string, nowMs: number) {
  const a = new Date(iso)
  const b = new Date(nowMs)
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
