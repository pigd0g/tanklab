import { useState } from 'react'
import type { Entry, MaintenanceType, Tank } from '../types'
import { MAINTENANCE_LABELS, SOURCE_WATER_LABELS } from '../types'
import { useStore } from '../lib/store'
import { maintenanceDue } from '../lib/derive'
import { fmtDateTime, fmtNum, fmtShortDate, daysUntil, uid } from '../lib/utils'
import { Sheet } from '../components/ui'
import { FeedingSheet, LivestockSheet, MaintenanceSheet, WaterChangeSheet } from './EntrySheets'

function fmtWhen(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function ListOf({ items, empty }: { items: { id: string; when: string; what: string }[]; empty: string }) {
  if (!items.length) return <div className="muted" style={{ padding: '6px 2px' }}>{empty}</div>
  return (
    <div>
      {items.map((i) => (
        <div key={i.id} className="row" style={{ padding: '8px 2px', borderBottom: '1px solid var(--line-soft)' }}>
          <span className="faint" style={{ width: 88, flexShrink: 0 }}>{i.when}</span>
          <span style={{ fontSize: 13.5 }}>{i.what}</span>
        </div>
      ))}
    </div>
  )
}

function FeedingPlan({ tank, onClose }: { tank: Tank; onClose: () => void }) {
  const { updateTank } = useStore()
  const [times, setTimes] = useState(String(tank.feedingSchedule?.timesPerDay ?? 1))
  const [note, setNote] = useState(tank.feedingSchedule?.note ?? '')
  return (
    <Sheet title="Feeding plan" onClose={onClose}>
      <label className="f-label">Feedings per day</label>
      <input type="number" inputMode="numeric" min={0} max={6} value={times} onChange={(e) => setTimes(e.target.value)} />
      <label className="f-label">Note (what / how much)</label>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="1 pinch of pellets" />
      <button
        className="btn btn-primary btn-block"
        style={{ marginTop: 18 }}
        type="button"
        onClick={() => {
          const n = Math.max(0, Math.min(6, Number(times) || 0))
          updateTank(tank.id, { feedingSchedule: n > 0 ? { timesPerDay: n, note: note || undefined } : null })
          onClose()
        }}
      >
        Save plan
      </button>
    </Sheet>
  )
}

const SCHEDULE_PRESETS: { type: MaintenanceType; intervalDays: number }[] = [
  { type: 'filterClean', intervalDays: 14 },
  { type: 'substrate', intervalDays: 28 },
  { type: 'rootTabs', intervalDays: 30 },
  { type: 'equipment', intervalDays: 90 },
]

const SCHEDULABLE_TYPES = (Object.keys(MAINTENANCE_LABELS) as MaintenanceType[]).filter(
  (k) => k !== 'waterChange' && k !== 'ammoniaDose',
)

function MaintPlanSheet({ tank, onClose }: { tank: Tank; onClose: () => void }) {
  const { updateTank } = useStore()
  const [items, setItems] = useState(tank.maintenanceSchedule ?? [])
  const [type, setType] = useState<MaintenanceType>('filterClean')
  const [days, setDays] = useState('14')

  const save = (next: typeof items) => {
    setItems(next)
    updateTank(tank.id, { maintenanceSchedule: next })
  }

  return (
    <Sheet title="Maintenance plan" onClose={onClose}>
      <p className="muted" style={{ marginTop: 0 }}>
        Set a repeating interval for each task — TankLab reminds you when it's due or overdue based on your logged maintenance.
      </p>
      {items.length === 0 && (
        <div className="faint" style={{ marginBottom: 8 }}>Nothing scheduled yet. Quick presets:</div>
      )}
      {items.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {items.map((it) => (
            <div key={it.id} className="row" style={{ padding: '7px 0', borderBottom: '1px solid var(--line-soft)' }}>
              <span style={{ fontSize: 13.5 }}>{MAINTENANCE_LABELS[it.type]}</span>
              <span className="spacer" />
              <span className="faint">every {it.intervalDays} d</span>
              <button
                className="btn btn-ghost"
                style={{ padding: '4px 10px', fontSize: 12.5 }}
                type="button"
                onClick={() => save(items.filter((x) => x.id !== it.id))}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
      {items.length === 0 && (
        <div className="btn-grid2" style={{ marginTop: 0 }}>
          {SCHEDULE_PRESETS.map((p) => (
            <button
              key={p.type}
              className="btn"
              type="button"
              onClick={() => save([...items, { id: uid(), type: p.type, intervalDays: p.intervalDays }])}
            >
              {MAINTENANCE_LABELS[p.type]} · {p.intervalDays}d
            </button>
          ))}
        </div>
      )}
      <label className="f-label">Add custom task</label>
      <div className="f-row">
        <div>
          <select value={type} onChange={(e) => setType(e.target.value as MaintenanceType)}>
            {SCHEDULABLE_TYPES.map((k) => (
              <option key={k} value={k}>{MAINTENANCE_LABELS[k]}</option>
            ))}
          </select>
        </div>
        <div>
          <input type="number" inputMode="numeric" min={1} value={days} onChange={(e) => setDays(e.target.value)} placeholder="Days" />
        </div>
      </div>
      <button
        className="btn btn-block"
        style={{ marginTop: 10 }}
        type="button"
        onClick={() => {
          const d = Math.max(1, Math.round(Number(days) || 0))
          if (!d || items.some((x) => x.type === type)) return
          save([...items, { id: uid(), type, intervalDays: d }])
        }}
      >
        Add task
      </button>
      <button className="btn btn-primary btn-block" style={{ marginTop: 18 }} type="button" onClick={onClose}>
        Done
      </button>
    </Sheet>
  )
}

export default function Care({ entries, tank }: { entries: Entry[]; tank: Tank }) {
  const [sheet, setSheet] = useState<null | 'maintenance' | 'feeding' | 'livestock' | 'waterChange' | 'plan' | 'maintPlan'>(null)

  const maintenance = entries
    .filter((e) => e.kind === 'maintenance')
    .sort((a, b) => b.date.localeCompare(a.date))
  const feedings = entries.filter((e) => e.kind === 'feeding').sort((a, b) => b.date.localeCompare(a.date))
  const livestock = entries.filter((e) => e.kind === 'livestock').sort((a, b) => b.date.localeCompare(a.date))
  const schedule = maintenanceDue(entries, tank)

  const liveLabels = { added: 'Added', death: 'Death', breeding: 'Breeding', observation: 'Observation' } as const

  return (
    <div>
      <h2 className="h-section">Water changes</h2>
      <div className="card">
        <button className="btn btn-primary btn-block" type="button" onClick={() => setSheet('waterChange')}>
          Log water change
        </button>
        <div style={{ marginTop: 10 }}>
          <ListOf
            items={entries
              .filter((e) => e.kind === 'waterChange')
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 5)
              .map((e) => ({
                id: e.id,
                when: fmtWhen(e.date),
                what: [
                  e.percent != null ? `${e.percent}%` : null,
                  e.litersRemoved != null ? `−${fmtNum(e.litersRemoved, 1)}L` : null,
                  e.litersAdded != null ? `+${fmtNum(e.litersAdded, 1)}L` : null,
                  e.sourceWater ? SOURCE_WATER_LABELS[e.sourceWater] : null,
                ].filter(Boolean).join(' · '),
              }))}
            empty="No water changes logged yet. Weekly 10–30% is a good routine."
          />
        </div>
      </div>

      <h2 className="h-section">Feeding</h2>
      <div className="card">
        <div className="row">
          <span className="muted">
            Plan: {tank.feedingSchedule ? `${tank.feedingSchedule.timesPerDay}× per day` : 'not set'}
          </span>
          <span className="spacer" />
          <button className="btn btn-ghost" style={{ padding: '6px 12px' }} type="button" onClick={() => setSheet('plan')}>
            Edit plan
          </button>
        </div>
        <button className="btn btn-block" style={{ marginTop: 10 }} type="button" onClick={() => setSheet('feeding')}>
          Log feeding
        </button>
        <div style={{ marginTop: 10 }}>
          <ListOf
            items={feedings.slice(0, 5).map((e) => ({
              id: e.id,
              when: fmtWhen(e.date),
              what: [e.food, e.amount].filter(Boolean).join(' · ') || 'Fed',
            }))}
            empty="No feedings logged yet."
          />
        </div>
      </div>

      <h2 className="h-section">Maintenance</h2>
      <div className="card">
        <div className="row" style={{ padding: '2px 0 10px' }}>
          <span className="muted">Plan: {schedule.length ? `${schedule.length} scheduled` : 'not set'}</span>
          <span className="spacer" />
          <button className="btn btn-ghost" style={{ padding: '6px 12px' }} type="button" onClick={() => setSheet('maintPlan')}>
            {schedule.length ? 'Edit plan' : 'Set up plan'}
          </button>
        </div>
        {schedule.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {schedule.map((s) => (
              <div key={s.item.id} className="row" style={{ padding: '7px 0', borderBottom: '1px solid var(--line-soft)' }}>
                <span style={{ fontSize: 13.5 }}>{MAINTENANCE_LABELS[s.item.type]}</span>
                <span className="spacer" />
                <span className="faint">last {fmtShortDate(s.lastIso ?? '')}</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: s.overdue ? 'var(--bad)' : s.due ? 'var(--warn)' : 'var(--ink-faint)',
                  }}
                >
                  {s.overdue ? 'Overdue' : s.due ? 'Due now' : s.dueIso ? `in ${Math.max(0, daysUntil(s.dueIso))} d` : `every ${s.item.intervalDays} d`}
                </span>
              </div>
            ))}
          </div>
        )}
        <button className="btn btn-block" type="button" onClick={() => setSheet('maintenance')}>
          Log maintenance
        </button>
        <div style={{ marginTop: 10 }}>
          <ListOf
            items={maintenance.slice(0, 6).map((e) => ({
              id: e.id,
              when: fmtWhen(e.date),
              what: MAINTENANCE_LABELS[e.maintenanceType ?? 'other'],
            }))}
            empty="No maintenance logged yet."
          />
        </div>
      </div>

      <h2 className="h-section">Livestock</h2>
      <div className="card">
        <button className="btn btn-block" type="button" onClick={() => setSheet('livestock')}>
          Add livestock entry
        </button>
        <div style={{ marginTop: 10 }}>
          <ListOf
            items={livestock.slice(0, 6).map((e) => ({
              id: e.id,
              when: fmtWhen(e.date),
              what: [
                liveLabels[e.subtype ?? 'observation'],
                e.species,
                e.count != null ? `×${e.count}` : null,
              ].filter(Boolean).join(' · '),
            }))}
            empty="No livestock records yet."
          />
        </div>
      </div>

      <h2 className="h-section">Recent activity</h2>
      <div className="card">
        <ListOf
          items={entries.slice(0, 8).map((e) => ({
            id: e.id,
            when: fmtDateTime(e.date).slice(0, 11),
            what:
              e.kind === 'maintenance'
                ? MAINTENANCE_LABELS[e.maintenanceType ?? 'other']
                : e.kind === 'feeding'
                  ? 'Fed'
                  : e.kind === 'waterChange'
                    ? 'Water change'
                    : e.kind === 'test'
                      ? 'Water test'
                      : 'Livestock',
          }))}
          empty="Nothing logged yet."
        />
      </div>

      {sheet === 'waterChange' && <WaterChangeSheet tankId={tank.id} onClose={() => setSheet(null)} />}
      {sheet === 'maintenance' && <MaintenanceSheet tankId={tank.id} onClose={() => setSheet(null)} />}
      {sheet === 'feeding' && <FeedingSheet tankId={tank.id} onClose={() => setSheet(null)} />}
      {sheet === 'livestock' && <LivestockSheet tankId={tank.id} onClose={() => setSheet(null)} />}
      {sheet === 'plan' && <FeedingPlan tank={tank} onClose={() => setSheet(null)} />}
      {sheet === 'maintPlan' && <MaintPlanSheet tank={tank} onClose={() => setSheet(null)} />}
    </div>
  )
}
