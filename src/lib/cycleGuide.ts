import type { Entry, FishlessCycle, Tank } from '../types'

export type CyclePhase = 'dose' | 'nitrite' | 'nitrate' | 'confirm'

const PHASE_ORDER: Record<CyclePhase, number> = { dose: 0, nitrite: 1, nitrate: 2, confirm: 3 }

export const CYCLE_PHASE_LABEL: Record<CyclePhase, string> = {
  dose: 'Add ammonia',
  nitrite: 'Watch nitrites',
  nitrate: 'Detect nitrates',
  confirm: 'Confirm the cycle',
}

// Cheat-sheet content distilled from fishlab.com fishless-cycle guide.
export const CYCLE_PHASE_GUIDE: Record<CyclePhase, { steps: string[] }> = {
  dose: {
    steps: [
      'Add pure ammonia (no additives/surfactants) to hit your target ppm, wait an hour, then test to verify.',
      'Test daily. When ammonia begins to drop, the first bacteria colony is growing — move on.',
      'Keep filter, heater and air running 24/7. Bacteria grow fastest at 25–30 °C and pH 6.5–7.5.',
      'Dechlorinate every drop of water you add, even now.',
      'Ammonia over 5 ppm stalls the cycle — do a partial water change to bring it down.',
    ],
  },
  nitrite: {
    steps: [
      'Ammonia is dropping — add half your original dose whenever ammonia falls below 1 ppm; keep it between 1–4 ppm.',
      'Test ammonia and nitrite daily. Rising nitrite means the ammonia-eating bacteria are active.',
      'Never let ammonia sit at 0 — the bacteria starve and the cycle restarts.',
      'Recheck pH every few days; below 7.0 bacteria slow down. A ~20% water change usually restores it.',
    ],
  },
  nitrate: {
    steps: [
      'Nitrite is falling — test ammonia, nitrite and nitrate daily.',
      'Keep ammonia at 1–2 ppm with a half dose every few days.',
      'Rising nitrate means the final bacteria colony is established.',
      'Nearly there: ammonia and nitrite both hit 0 within 24 hours of dosing.',
    ],
  },
  confirm: {
    steps: [
      'The final test: add a full dose — the same amount you added on day 1.',
      'Wait 24 hours, then test ammonia and nitrite.',
      'Both at 0? Your tank is officially cycled — log it with "Mark cycle complete".',
      'Before adding fish: do a 30–50% water change to bring nitrates down.',
      'Not adding fish yet? Dose a little ammonia daily to keep the bacteria alive.',
    ],
  },
}

export const DAILY_CYCLE_TIP = 'Use a liquid test kit (strips are unreliable) and log results every day.'

export type CyclePhaseInfo = { phase: CyclePhase; sinceDay: number }

export type CycleTodos = {
  day: number
  phase: CyclePhaseInfo
  doseToday: boolean
  testToday: boolean
  warnings: string[]
  lastTest: Entry | null
  dosePpm: number | null
}

const startOfLocalDay = (ms: number) => {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function activeFishlessCycle(c: FishlessCycle | null | undefined): FishlessCycle | null {
  return c && c.startedAt && !c.completedAt ? c : null
}

// Day 1 is the local calendar day the ammonia was first added.
export function cycleDay(cycle: FishlessCycle, nowMs: number = Date.now()): number {
  return Math.max(1, Math.floor((startOfLocalDay(nowMs) - startOfLocalDay(new Date(cycle.startedAt).getTime())) / 86_400_000) + 1)
}

export function suggestDose(volumeL: number | null): number {
  return volumeL != null && volumeL >= 150 ? 4 : 2
}

export function sameLocalDay(aIso: string, bMs: number): boolean {
  const a = new Date(aIso)
  const b = new Date(bMs)
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

const CLEAN = 0.25

// Walks the test history to determine which step of the fishlab method the user is on.
export function cyclePhase(tests: Entry[]): CyclePhaseInfo {
  let phase: CyclePhase = 'dose'
  let sinceDay = 1
  let peakAmmo = 0
  let peakNit = 0
  let peakNitrate = 0
  for (const t of tests) {
    const ammo = t.ammonia ?? 0
    const nit = t.nitrite ?? 0
    const ammoDropping = peakAmmo - ammo > CLEAN && peakAmmo > CLEAN
    const nitriteSeen = peakNit > CLEAN || nit > CLEAN
    const nitriteDropping = nitriteSeen && peakNit - nit > CLEAN
    const bothZero = ammo <= CLEAN && nit <= CLEAN
    // Phase can only move forward; 'confirm' requires that nitrates appeared at some point
    // (so an all-zeros test early in the cycle keeps the user in 'dose' with a dose warning).
    const nitrateSeenSoFar = (t.nitrate ?? 0) > 0 || peakNitrate > 0 || nitriteDropping
    const candidate: CyclePhase =
      bothZero && nitrateSeenSoFar ? 'confirm'
        : nitriteDropping ? 'nitrate'
          : nitriteSeen || ammoDropping ? 'nitrite'
            : 'dose'
    const next: CyclePhase = PHASE_ORDER[candidate] >= PHASE_ORDER[phase] ? candidate : phase
    if (next !== phase) {
      phase = next
      sinceDay = Math.max(1, Math.floor((startOfLocalDay(new Date(t.date).getTime()) - startOfLocalDay(new Date(tests[0].date).getTime())) / 86_400_000) + 1)
    }
    peakAmmo = Math.max(peakAmmo, ammo)
    peakNit = Math.max(peakNit, nit)
    peakNitrate = Math.max(peakNitrate, t.nitrate ?? 0)
  }
  return { phase, sinceDay }
}

export function todayCycleTodos(entries: Entry[], tank: Tank, nowMs: number = Date.now()): CycleTodos | null {
  const cycle = activeFishlessCycle(tank.cycling)
  if (!cycle) return null
  const startedMs = new Date(cycle.startedAt).getTime()
  const tests = entries
    .filter((e) => e.kind === 'test' && new Date(e.date).getTime() >= startedMs - 12 * 3_600_000)
    .sort((a, b) => a.date.localeCompare(b.date))
  const doses = entries
    .filter((e) => e.kind === 'maintenance' && e.maintenanceType === 'ammoniaDose' && new Date(e.date).getTime() >= startedMs - 12 * 3_600_000)
    .sort((a, b) => a.date.localeCompare(b.date))
  const day = cycleDay(cycle, nowMs)
  const phase = cyclePhase(tests)
  const doseToday = !doses.some((d) => sameLocalDay(d.date, nowMs))
  const testToday = !tests.some((t) => sameLocalDay(t.date, nowMs))
  const lastTest = tests.length ? tests[tests.length - 1] : null
  const warnings: string[] = []
  if (day - phase.sinceDay > 14) {
    warnings.push(`No progress for over two weeks — the cycle may be stalled. Check pH (keep above 7), temperature (25–30 °C) and that ammonia isn't at 0.`)
  }
  if (lastTest) {
    const ammo = lastTest.ammonia ?? 0
    const nit = lastTest.nitrite ?? 0
    if (ammo > 5) warnings.push(`Ammonia ${ammo} ppm is too high — do a partial water change (over 5 ppm stalls bacteria).`)
    if (lastTest.ph != null && lastTest.ph < 7) warnings.push(`pH ${lastTest.ph} is below 7 — bacteria slow down or die in acidic water. A ~20% water change usually restores it.`)
    if (ammo <= CLEAN && nit <= CLEAN && (phase.phase === 'dose' || phase.phase === 'nitrite')) {
      warnings.push('Ammonia and nitrite are both 0 early on — dose now or the bacteria will starve.')
    }
    if (ammo < 1 && ammo > CLEAN && phase.phase !== 'dose' && phase.phase !== 'confirm') {
      warnings.push('Ammonia below 1 ppm — add a half dose to keep feeding the bacteria.')
    }
  }
  return { day, phase, doseToday, testToday, warnings, lastTest, dosePpm: cycle.dosePpm }
}

// Has this tank finished its fishless cycle (per the 24h full-dose test)?
export function cycleCompleteReady(todos: CycleTodos): boolean {
  if (!todos.lastTest || todos.phase.phase !== 'confirm') return false
  if (!sameLocalDay(todos.lastTest.date, Date.now())) return false
  return (todos.lastTest.ammonia ?? 0) <= CLEAN && (todos.lastTest.nitrite ?? 0) <= CLEAN
}