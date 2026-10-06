import { useMemo, useState } from 'react'
import type { Entry, Tank } from '../types'
import { useStore } from '../lib/store'
import {
  CYCLE_PHASE_GUIDE, CYCLE_PHASE_LABEL, DAILY_CYCLE_TIP,
  activeFishlessCycle, cycleCompleteReady, suggestDose, todayCycleTodos,
} from '../lib/cycleGuide'
import { fmtNum } from '../lib/utils'
import { Sheet } from '../components/ui'
import { MaintenanceSheet, TestSheet } from './EntrySheets'

export function StartCycleSheet({ tank, onClose }: { tank: Tank; onClose: () => void }) {
  const { updateTank, addEntry } = useStore()
  const suggested = suggestDose(tank.volumeL)
  const [dose, setDose] = useState(String(suggested))
  const [doseNow, setDoseNow] = useState(true)
  return (
    <Sheet title="Start fishless cycle" onClose={onClose}>
      <p className="muted" style={{ marginTop: 0 }}>
        Fishless cycling grows the bacteria that make the tank fish-safe, using pure ammonia instead of fish.
        Expect four to six weeks. Day 1 is the day you first add ammonia.
      </p>
      <label className="f-label">Target ammonia dose (ppm)</label>
      <input type="number" inputMode="decimal" step={0.5} min={0.5} max={4} value={dose} onChange={(e) => setDose(e.target.value)} />
      <div className="faint" style={{ marginTop: 4 }}>
        {tank.volumeL != null && tank.volumeL < 150
          ? 'Tanks under 150 L: aim for 2 ppm (4 ppm above that). Never exceed 5 ppm — it stalls bacteria.'
          : 'Larger tanks aim for 4 ppm. Never exceed 5 ppm — it stalls bacteria.'}
      </div>
      <label className="check-row" style={{ marginTop: 12 }}>
        <input type="checkbox" checked={doseNow} onChange={(e) => setDoseNow(e.target.checked)} style={{ width: 'auto' }} />
        <span>I'm adding the ammonia dose now (starts day 1)</span>
      </label>
      <button
        className="btn btn-primary btn-block"
        style={{ marginTop: 18 }}
        type="button"
        onClick={() => {
          updateTank(tank.id, {
            cycling: { startedAt: new Date().toISOString(), dosePpm: Number(dose) || null, completedAt: null },
          })
          if (doseNow) {
            addEntry({ tankId: tank.id, date: new Date().toISOString(), kind: 'maintenance', maintenanceType: 'ammoniaDose', note: dose ? `Target ${dose} ppm` : undefined })
          }
          onClose()
        }}
      >
        Start cycle
      </button>
    </Sheet>
  )
}

export function StartCycleButton({ tank }: { tank: Tank }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="btn" type="button" onClick={() => setOpen(true)}>Start fishless cycle</button>
      {open && <StartCycleSheet tank={tank} onClose={() => setOpen(false)} />}
    </>
  )
}
function TestNowBtn({ tankId }: { tankId: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="btn" type="button" onClick={() => setOpen(true)}>Log test</button>
      {open && <TestSheet tankId={tankId} onClose={() => setOpen(false)} />}
    </>
  )
}

export default function Cycle({ entries, tank }: { entries: Entry[]; tank: Tank }) {
  const { updateTank } = useStore()
  const cycle = activeFishlessCycle(tank.cycling)
  const todos = useMemo(() => todayCycleTodos(entries, tank), [entries, tank])

  if (!cycle || !todos) return null

  const guide = CYCLE_PHASE_GUIDE[todos.phase.phase]
  const completeReady = cycleCompleteReady(todos)
  const startedMs = new Date(cycle.startedAt).getTime()

  const perDay: { day: number; test?: Entry; dose?: Entry }[] = []
  const tests = entries
    .filter((e) => e.kind === 'test' && new Date(e.date).getTime() >= startedMs - 12 * 3_600_000)
    .sort((a, b) => a.date.localeCompare(b.date))
  const doses = entries
    .filter((e) => e.kind === 'maintenance' && e.maintenanceType === 'ammoniaDose' && new Date(e.date).getTime() >= startedMs - 12 * 3_600_000)
    .sort((a, b) => a.date.localeCompare(b.date))
  for (const t of tests) {
    const d = Math.floor((new Date(new Date(t.date).setHours(0, 0, 0, 0)).getTime() - new Date(new Date(cycle.startedAt).setHours(0, 0, 0, 0)).getTime()) / 86_400_000) + 1
    perDay.push({ day: d, test: t })
  }
  for (const d of doses) {
    const day = Math.floor((new Date(new Date(d.date).setHours(0, 0, 0, 0)).getTime() - new Date(new Date(cycle.startedAt).setHours(0, 0, 0, 0)).getTime()) / 86_400_000) + 1
    const existing = perDay.find((p) => p.day === day)
    if (existing) existing.dose = d
    else perDay.push({ day, dose: d })
  }
  perDay.sort((a, b) => a.day - b.day)

  return (
    <div>
      <div className="card">
        <div className="row">
          <strong style={{ fontFamily: 'var(--display)', fontSize: 20 }}>Day {todos.day}</strong>
          <span className="spacer" />
          <span className="muted">{CYCLE_PHASE_LABEL[todos.phase.phase]}</span>
        </div>
        <div className="faint" style={{ marginTop: 4 }}>
          Step {todos.phase.phase === 'dose' ? 3 : todos.phase.phase === 'nitrite' ? 4 : todos.phase.phase === 'nitrate' ? 5 : 6} of 6 · in this step since day {todos.phase.sinceDay}
        </div>
        {completeReady && (
          <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} type="button" onClick={() => updateTank(tank.id, { cycling: { ...cycle, completedAt: new Date().toISOString() } })}>
            Mark cycle complete 🎉
          </button>
        )}
        {!completeReady && todos.phase.phase === 'confirm' && (
          <div className="muted" style={{ marginTop: 10 }}>
            Today's test isn't clean yet — wait for a test where ammonia and nitrite both read 0.
          </div>
        )}
      </div>

      {todos.warnings.length > 0 && (
        <div className="card" style={{ borderColor: 'rgba(245,184,79,0.35)', background: 'rgba(245,184,79,0.07)' }}>
          {todos.warnings.map((w, i) => (
            <div key={i} className="muted" style={i > 0 ? { marginTop: 8 } : undefined}>⚠️ {w}</div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="row" style={{ marginBottom: 8 }}>
          <strong style={{ fontFamily: 'var(--display)' }}>Today's checklist</strong>
          <span className="spacer" />
          <span className="faint">{DAILY_CYCLE_TIP}</span>
        </div>
        <div className="row" style={{ padding: '8px 0', borderBottom: '1px solid var(--line-soft)' }}>
          <span>
            {todos.doseToday ? '○' : '✓'} Dose ammonia
            {todos.doseToday
              ? ` (optional — only if ammonia reads low)`
              : ` (${todos.dosePpm != null ? `${fmtNum(todos.dosePpm)} ppm target` : 'half dose as needed'})`}
          </span>
          <span className="spacer" />
          <MaintenanceSheetButton tankId={tank.id} dosePpm={todos.dosePpm} />
        </div>
        <div className="row" style={{ padding: '8px 0' }}>
          <span>{todos.testToday ? '○' : '✓'} Test ammonia, nitrite, nitrate</span>
          <span className="spacer" />
          {todos.testToday && <TestNowBtn tankId={tank.id} />}
        </div>
      </div>

      <div className="card">
        <strong style={{ fontFamily: 'var(--display)' }}>While you're in {CYCLE_PHASE_LABEL[todos.phase.phase].toLowerCase()}</strong>
        <ul style={{ margin: '10px 0 0', paddingLeft: 18, lineHeight: 1.55 }}>
          {guide.steps.map((s, i) => (
            <li key={i} className="muted" style={{ marginBottom: 6 }}>{s}</li>
          ))}
        </ul>
      </div>

      <div className="card">
        <strong style={{ fontFamily: 'var(--display)' }}>Cycle log</strong>
        {perDay.length === 0 ? (
          <div className="muted" style={{ marginTop: 8 }}>No results logged since the cycle started.</div>
        ) : (
          <div style={{ marginTop: 10 }}>
            {perDay.map((p) => (
              <div key={p.day} className="row" style={{ padding: '8px 0', borderBottom: '1px solid var(--line-soft)' }}>
                <span className="faint" style={{ width: 56, flexShrink: 0 }}>Day {p.day}</span>
                <span style={{ fontSize: 13.5 }}>
                  {p.test
                    ? `NH₃ ${p.test.ammonia != null ? fmtNum(p.test.ammonia) : '—'} · NO₂ ${p.test.nitrite != null ? fmtNum(p.test.nitrite) : '—'} · NO₃ ${p.test.nitrate != null ? fmtNum(p.test.nitrate, 0) : '—'}${p.test.ph != null ? ` · pH ${fmtNum(p.test.ph, 1)}` : ''}`
                    : 'Ammonia dose'}
                </span>
                <span className="spacer" />
                {p.dose && <span className="faint">dosed</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <strong style={{ fontFamily: 'var(--display)' }}>Finish line</strong>
        <p className="muted" style={{ marginBottom: 0 }}>
          When ammonia and nitrite both read 0 within 24 hours of a full dose, the cycle is complete.
          Then: 30–50% water change before adding fish. If the tank will sit empty, keep dosing a little ammonia daily so the bacteria stay alive.
        </p>
        <button className="btn btn-danger btn-block" style={{ marginTop: 12 }} type="button" onClick={() => updateTank(tank.id, { cycling: null })}>
          Stop tracking this cycle
        </button>
      </div>
    </div>
  )
}

function MaintenanceSheetButton({ tankId, dosePpm }: { tankId: string; dosePpm: number | null }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="btn" type="button" onClick={() => setOpen(true)}>Log dose</button>
      {open && <MaintenanceSheetPrefilled tankId={tankId} dosePpm={dosePpm} onClose={() => setOpen(false)} />}
    </>
  )
}

function MaintenanceSheetPrefilled({ tankId, dosePpm, onClose }: { tankId: string; dosePpm: number | null; onClose: () => void }) {
  return (
    <MaintenanceSheet
      tankId={tankId}
      onClose={onClose}
      preset={{ maintenanceType: 'ammoniaDose', note: dosePpm != null ? `${fmtNum(dosePpm)} ppm target` : undefined }}
    />
  )
}