import type { Entry, Tank, Units } from '../types'
import { MAINTENANCE_LABELS, SOURCE_WATER_LABELS } from '../types'
import type { Trend } from './derive'
import { CYCLE_LABEL, STATUS_LABEL, cycleStage, freeAmmonia, maintenanceDue, metricTrend, reminders, tankStatus } from './derive'
import { activeFishlessCycle, CYCLE_PHASE_LABEL, todayCycleTodos } from './cycleGuide'
import { cToF, daysAgo, daysUntil, lToGal } from './utils'

const pad = (n: number) => String(n).padStart(2, '0')

const fmtStamp = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const fmtDay = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const num = (v: number | null | undefined, digits = 2) =>
  v == null ? '' : String(Math.round(v * 10 ** digits) / 10 ** digits)

const esc = (s: string) => s.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim()

function mdTable(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const head = `| ${headers.join(' | ')} |`
  const sep = `| ${headers.map(() => '---').join(' | ')} |`
  const body = rows
    .map((r) =>
      r
        .map((c) => {
          const s = c == null ? '' : String(c)
          return s === '' ? '—' : esc(s)
        })
        .join(' | '),
    )
    .map((r) => `| ${r} |`)
    .join('\n')
  return [head, sep, body].join('\n')
}

const TREND_WORD: Record<Trend, string> = { up: 'rising', down: 'falling', steady: 'steady', none: 'no data' }

const LIVESTOCK_LABEL: Record<NonNullable<Entry['subtype']>, string> = {
  added: 'Added',
  death: 'Death',
  breeding: 'Breeding',
  observation: 'Observation',
}

type DueInfo = { due: boolean; overdue: boolean; dueIso: string | null }

const dueWord = (r: DueInfo) =>
  r.overdue ? 'OVERDUE' : r.due ? 'due now' : r.dueIso ? `in ${Math.max(0, daysUntil(r.dueIso))} days` : '—'

export function buildTankMarkdown(tank: Tank, entries: Entry[], units: Units): string {
  const metric = units === 'metric'
  const tempU = metric ? '°C' : '°F'
  const volU = metric ? 'L' : 'gal'
  const tempCell = (c: number | null | undefined) => (c == null ? '' : num(metric ? c : cToF(c)))
  const volCell = (l: number | null | undefined) => (l == null ? '' : num(metric ? l : lToGal(l)))
  const chrono = (a: Entry, b: Entry) => a.date.localeCompare(b.date)

  const out: string[] = []
  out.push(`# Aquarium: ${tank.name}`)
  out.push('')
  out.push(
    `All concentrations in ppm (mg/L). Temperatures in ${tempU}. Volumes in ${volU}. Dates are local time, formatted YYYY-MM-DD HH:MM.`,
  )
  out.push('')

  // ---- Tank profile ----
  out.push('## Tank profile')
  out.push('')
  if (tank.volumeL != null) out.push(`- Volume: ${num(tank.volumeL, tank.volumeL >= 100 ? 0 : 1)} ${volU}`)
  if (tank.setupDate) out.push(`- Set up: ${fmtDay(tank.setupDate)} (${Math.max(0, daysAgo(tank.setupDate))} days ago)`)
  if (tank.sourceWater) out.push(`- Source water: ${SOURCE_WATER_LABELS[tank.sourceWater]}`)
  out.push(`- Already established / cycled: ${tank.established ? 'yes' : 'no'}`)
  if (tank.feedingSchedule) {
    out.push(
      `- Feeding plan: ${tank.feedingSchedule.timesPerDay} time(s) per day${tank.feedingSchedule.note ? ` — ${tank.feedingSchedule.note}` : ''}`,
    )
  }
  out.push('')

  // ---- Fishless cycle ----
  const cycle = tank.cycling
  if (cycle) {
    out.push('## Fishless cycle')
    out.push('')
    out.push(`- Started: ${fmtDay(cycle.startedAt)}`)
    out.push(cycle.dosePpm != null ? `- Target ammonia dose: ${num(cycle.dosePpm, 1)} ppm` : '- Target ammonia dose: not set')
    out.push(`- Completed: ${cycle.completedAt ? fmtDay(cycle.completedAt) : 'not yet'}`)
    if (activeFishlessCycle(cycle)) {
      const todos = todayCycleTodos(entries, tank)
      if (todos) {
        out.push(`- Current day: ${todos.day}`)
        out.push(`- Current phase: ${CYCLE_PHASE_LABEL[todos.phase.phase]}`)
        out.push(`- Ammonia dose due today: ${todos.doseToday ? 'yes' : 'no'}`)
        out.push(`- Water test due today: ${todos.testToday ? 'yes' : 'no'}`)
        for (const w of todos.warnings) out.push(`- Warning: ${w}`)
      }
    }
    out.push('')
  }

  // ---- Maintenance schedule ----
  const schedule = maintenanceDue(entries, tank)
  if (schedule.length > 0) {
    out.push('## Maintenance schedule')
    out.push('')
    out.push(
      mdTable(
        ['Task', 'Interval (days)', 'Last done', 'Next due', 'Status'],
        schedule.map((s) => [
          MAINTENANCE_LABELS[s.item.type],
          s.item.intervalDays,
          s.lastIso ? fmtDay(s.lastIso) : 'never',
          s.dueIso ? fmtDay(s.dueIso) : '—',
          s.overdue ? 'OVERDUE' : s.due ? 'due now' : s.dueIso ? `in ${Math.max(0, daysUntil(s.dueIso))} days` : '—',
        ]),
      ),
    )
    out.push('')
  }

  // ---- Current status ----
  const { status, reasons, latest } = tankStatus(entries, tank)
  const stage = cycleStage(entries, tank)
  const rem = reminders(entries, tank)
  out.push('## Current status')
  out.push('')
  out.push(`- Overall status: ${STATUS_LABEL[status]}`)
  out.push(`- Cycle stage: ${CYCLE_LABEL[stage.stage]} (${Math.round(stage.progress * 100)}%)`)
  for (const r of reasons) out.push(`- Flag: ${r}`)
  if (latest) {
    const readings: string[] = []
    if (latest.ammonia != null) readings.push(`NH₃/NH₄⁺ ${num(latest.ammonia)} ppm`)
    if (latest.nitrite != null) readings.push(`NO₂⁻ ${num(latest.nitrite)} ppm`)
    if (latest.nitrate != null) readings.push(`NO₃⁻ ${num(latest.nitrate, 0)} ppm`)
    if (latest.phosphate != null) readings.push(`PO₄ ${num(latest.phosphate)} ppm`)
    if (latest.ph != null) readings.push(`pH ${num(latest.ph, 1)}`)
    if (latest.waterTemp != null) readings.push(`water temp ${tempCell(latest.waterTemp)}${tempU}`)
    out.push(`- Latest test (${fmtStamp(latest.entry.date)}): ${readings.join(', ') || 'no readings'}`)
    if (latest.ammonia != null && latest.ph != null && latest.waterTemp != null) {
      out.push(`- Free NH₃ (estimated): ${num(freeAmmonia(latest.ammonia, latest.ph, latest.waterTemp), 3)} ppm`)
    }
  } else {
    out.push('- Latest test: none logged yet')
  }
  out.push(`- 14-day trends: ammonia ${TREND_WORD[metricTrend(entries, 'ammonia')]}, nitrite ${TREND_WORD[metricTrend(entries, 'nitrite')]}, nitrate ${TREND_WORD[metricTrend(entries, 'nitrate')]}, pH ${TREND_WORD[metricTrend(entries, 'ph')]}, water temp ${TREND_WORD[metricTrend(entries, 'waterTemp')]}`)
  out.push(`- Water change: last ${rem.waterChange.lastIso ? fmtDay(rem.waterChange.lastIso) : 'never'}, next ${dueWord(rem.waterChange)}`)
  out.push(`- Water test: last ${rem.test.lastIso ? fmtDay(rem.test.lastIso) : 'never'}, next ${dueWord(rem.test)}`)
  if (rem.feeding.timesPerDay > 0) {
    out.push(`- Feeding: ${rem.feeding.timesPerDay}× per day (${rem.feeding.dueNow ? 'not done yet today' : 'done today'})`)
  }
  out.push('')

  // ---- Test history ----
  out.push('## Test history')
  out.push('')
  const tests = entries.filter((e) => e.kind === 'test').sort(chrono)
  if (tests.length === 0) {
    out.push('No tests logged yet.')
  } else {
    const has = (k: 'ammonia' | 'nitrite' | 'nitrate' | 'phosphate' | 'ph' | 'waterTemp' | 'roomTemp') =>
      tests.some((t) => t[k] != null)
    const cols: { label: string; get: (t: Entry) => string | number }[] = [{ label: 'Date', get: (t) => fmtStamp(t.date) }]
    if (has('ammonia')) cols.push({ label: 'NH₃/NH₄⁺ (ppm)', get: (t) => num(t.ammonia) })
    if (has('nitrite')) cols.push({ label: 'NO₂⁻ (ppm)', get: (t) => num(t.nitrite) })
    if (has('nitrate')) cols.push({ label: 'NO₃⁻ (ppm)', get: (t) => num(t.nitrate, 0) })
    if (has('phosphate')) cols.push({ label: 'PO₄ (ppm)', get: (t) => num(t.phosphate) })
    if (has('ph')) cols.push({ label: 'pH', get: (t) => num(t.ph, 1) })
    if (has('waterTemp')) cols.push({ label: `Water temp (${tempU})`, get: (t) => tempCell(t.waterTemp) })
    if (has('roomTemp')) cols.push({ label: `Room temp (${tempU})`, get: (t) => tempCell(t.roomTemp) })
    if (tests.some((t) => t.note)) cols.push({ label: 'Note', get: (t) => t.note ?? '' })
    out.push(mdTable(cols.map((c) => c.label), tests.map((t) => cols.map((c) => c.get(t)))))
  }
  out.push('')

  // ---- Water changes ----
  out.push('## Water changes')
  out.push('')
  const wcs = entries.filter((e) => e.kind === 'waterChange').sort(chrono)
  if (wcs.length === 0) {
    out.push('No water changes logged yet.')
  } else {
    out.push(
      mdTable(
        ['Date', 'Change', `Removed (${volU})`, `Added (${volU})`, 'Source water', 'Note'],
        wcs.map((e) => [
          fmtStamp(e.date),
          e.percent != null ? `${num(e.percent, 0)}%` : '',
          volCell(e.litersRemoved),
          volCell(e.litersAdded),
          e.sourceWater ? SOURCE_WATER_LABELS[e.sourceWater] : '',
          e.note ?? '',
        ]),
      ),
    )
  }
  out.push('')

  // ---- Maintenance log ----
  out.push('## Maintenance log')
  out.push('')
  const maint = entries.filter((e) => e.kind === 'maintenance').sort(chrono)
  if (maint.length === 0) {
    out.push('No maintenance logged yet.')
  } else {
    out.push(
      mdTable(
        ['Date', 'Task', 'Note'],
        maint.map((e) => [fmtStamp(e.date), MAINTENANCE_LABELS[e.maintenanceType ?? 'other'], e.note ?? '']),
      ),
    )
  }
  out.push('')

  // ---- Feeding log ----
  out.push('## Feeding log')
  out.push('')
  const feedings = entries.filter((e) => e.kind === 'feeding').sort(chrono)
  if (feedings.length === 0) {
    out.push('No feedings logged yet.')
  } else {
    out.push(
      mdTable(
        ['Date', 'Food', 'Amount', 'Note'],
        feedings.map((e) => [fmtStamp(e.date), e.food ?? '', e.amount ?? '', e.note ?? '']),
      ),
    )
  }
  out.push('')

  // ---- Livestock log ----
  out.push('## Livestock log')
  out.push('')
  const livestock = entries.filter((e) => e.kind === 'livestock').sort(chrono)
  if (livestock.length === 0) {
    out.push('No livestock records yet.')
  } else {
    out.push(
      mdTable(
        ['Date', 'Event', 'Species', 'Count', 'Note'],
        livestock.map((e) => [
          fmtStamp(e.date),
          LIVESTOCK_LABEL[e.subtype ?? 'observation'],
          e.species ?? '',
          e.count != null ? num(e.count, 0) : '',
          e.note ?? '',
        ]),
      ),
    )
  }
  out.push('')

  out.push('---')
  out.push('')
  out.push(`Exported from TankLab on ${fmtStamp(new Date().toISOString())}.`)

  return out.join('\n')
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // fall through to legacy path
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0.01'
    ta.tabIndex = -1
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  } catch {
    return false
  }
}