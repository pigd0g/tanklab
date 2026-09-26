import { Suspense, lazy, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Entry } from '../types'
import { useStore } from '../lib/store'
import {
  tankStatus, STATUS_LABEL, metricTrend, cycleStage, CYCLE_LABEL, reminders, freeAmmonia,
} from '../lib/derive'
import { fmtDateTime, fmtDaysAgo, fmtNum, fmtTemp, fmtVolume } from '../lib/utils'
import { Segmented, StatusDot, TrendArrow, useNow } from '../components/ui'
import { TestSheet, WaterChangeSheet, MaintenanceSheet, FeedingSheet, LivestockSheet } from './EntrySheets'
import { EditTankSheet } from './TankForm'
const Charts = lazy(() => import('./Charts'))
import Care from './Care'
import LogView from './LogView'

function Row({ label, value, trend }: { label: string; value: string; trend?: 'up' | 'down' | 'steady' | 'none' }) {
  return (
    <div className="row" style={{ padding: '9px 0', borderBottom: '1px solid var(--line-soft)' }}>
      <span className="muted">{label}</span>
      <span className="spacer" />
      <strong style={{ fontFamily: 'var(--display)', fontSize: 15 }}>{value}</strong>
      {trend && <TrendArrow trend={trend} />}
    </div>
  )
}

function Overview(props: { entries: Entry[]; tank: import('../types').Tank; onOpen: (s: 'test' | 'waterChange' | 'maintenance' | 'feeding' | 'livestock') => void }) {
  const { entries, tank } = props
  const { units } = useStore()
  const now = useNow()
  const { status, reasons, latest } = tankStatus(entries, tank)
  const stage = cycleStage(entries, tank)
  const rem = reminders(entries, tank)
  const nh3 =
    latest && latest.ammonia != null && latest.ph != null && latest.waterTemp != null
      ? freeAmmonia(latest.ammonia, latest.ph, latest.waterTemp)
      : null

  return (
    <div>
      <div className="card">
        <div className="row">
          <StatusDot status={status} />
          <strong style={{ fontFamily: 'var(--display)', fontSize: 17 }}>
            {STATUS_LABEL[status]}
          </strong>
          <span className="spacer" />
          <span className="faint">{CYCLE_LABEL[stage.stage]}</span>
        </div>
        {reasons.length > 0 && (
          <div className="muted" style={{ marginTop: 8 }}>{reasons.join(' · ')}</div>
        )}
        <div style={{ marginTop: 12, height: 6, borderRadius: 3, background: 'var(--bg)', overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.round(stage.progress * 100)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--accent-dim), var(--accent))',
              borderRadius: 3,
              transition: 'width 0.4s',
            }}
          />
        </div>
        <div className="faint" style={{ marginTop: 5 }}>
          {CYCLE_LABEL[stage.stage]} · {Math.round(stage.progress * 100)}%
        </div>
      </div>

      <div className="card">
        {latest ? (
          <>
            <Row
              label="Ammonia (NH₃/NH₄⁺)"
              value={latest.ammonia != null ? `${fmtNum(latest.ammonia)} ppm` : '—'}
              trend={metricTrend(entries, 'ammonia')}
            />
            <Row
              label="Nitrite"
              value={latest.nitrite != null ? `${fmtNum(latest.nitrite)} ppm` : '—'}
              trend={metricTrend(entries, 'nitrite')}
            />
            <Row
              label="Nitrate"
              value={latest.nitrate != null ? `${fmtNum(latest.nitrate, 0)} ppm` : '—'}
              trend={metricTrend(entries, 'nitrate')}
            />
            <Row
              label="Phosphate"
              value={latest.phosphate != null ? `${fmtNum(latest.phosphate)} ppm` : '—'}
              trend={metricTrend(entries, 'phosphate')}
            />
            <Row
              label="pH"
              value={latest.ph != null ? fmtNum(latest.ph, 1) : '—'}
              trend={metricTrend(entries, 'ph')}
            />
            <Row
              label="Water temp"
              value={latest.waterTemp != null ? fmtTemp(latest.waterTemp, units) : '—'}
              trend={metricTrend(entries, 'waterTemp')}
            />
            {nh3 != null && (
              <Row label="Free NH₃ (est.)" value={`${fmtNum(nh3, 3)} ppm`} />
            )}
            <div className="faint" style={{ marginTop: 8 }}>
              Tested {fmtDateTime(latest.entry.date)}
            </div>
          </>
        ) : (
          <div className="muted">
            No tests yet. Log your first water test to see readings and trends here.
          </div>
        )}
      </div>

      <div className="card">
        <div className="row" style={{ padding: '6px 0' }}>
          <span className="muted">Water change</span>
          <span className="spacer" />
          <span className={rem.waterChange.overdue ? '' : 'muted'} style={rem.waterChange.overdue ? { color: 'var(--bad)', fontWeight: 600 } : undefined}>
            {rem.waterChange.overdue ? 'Overdue' : rem.waterChange.due ? 'Due now' : `in ${rem.waterChange.dueIso ? Math.max(0, Math.ceil((new Date(rem.waterChange.dueIso).getTime() - now) / 86400000)) : '?'} d`}
          </span>
        </div>
        <div className="faint">Last: {fmtDaysAgo(rem.waterChange.lastIso)}</div>
        <div className="row" style={{ padding: '6px 0', marginTop: 8 }}>
          <span className="muted">Water test</span>
          <span className="spacer" />
          <span className={rem.test.overdue ? '' : 'muted'} style={rem.test.overdue ? { color: 'var(--bad)', fontWeight: 600 } : undefined}>
            {rem.test.overdue ? 'Overdue' : rem.test.due ? 'Due now' : `in ${rem.test.dueIso ? Math.max(0, Math.ceil((new Date(rem.test.dueIso).getTime() - now) / 86400000)) : '?'} d`}
          </span>
        </div>
        <div className="faint">Last tested: {fmtDaysAgo(rem.test.lastIso)}</div>
        {rem.feeding.timesPerDay > 0 && (
          <div className="row" style={{ padding: '6px 0', marginTop: 8 }}>
            <span className="muted">Feeding</span>
            <span className="spacer" />
            <span className={rem.feeding.dueNow ? 'muted' : 'faint'}>
              {rem.feeding.dueNow ? `${rem.feeding.timesPerDay}× per day` : 'Done today'}
            </span>
          </div>
        )}
      </div>

      <QuickActions onOpen={props.onOpen} />
    </div>
  )
}

export default function TankDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { getTank, tankEntries, units } = useStore()
  const tank = id ? getTank(id) : undefined
  const [tab, setTab] = useState<'overview' | 'charts' | 'log' | 'care'>('overview')
  const [sheet, setSheet] = useState<null | 'test' | 'waterChange' | 'maintenance' | 'feeding' | 'livestock'>(null)
  const [editing, setEditing] = useState(false)
  useNow()

  const entries = useMemo(() => (tank ? tankEntries(tank.id) : []), [tank, tankEntries])

  if (!tank) {
    return (
      <main className="app page">
        <div className="empty">
          <p>Tank not found.</p>
          <button className="btn" type="button" onClick={() => nav('/')}>Back to tanks</button>
        </div>
      </main>
    )
  }

  return (
    <main className="app page">
      <div className="row" style={{ marginBottom: 4 }}>
        <button className="btn btn-ghost" style={{ padding: '6px 12px' }} type="button" onClick={() => nav('/')}>
          ‹ Tanks
        </button>
        <span className="spacer" />
        <button className="btn btn-ghost" style={{ padding: '6px 12px' }} type="button" onClick={() => setEditing(true)}>
          Edit
        </button>
      </div>

      <div style={{ position: 'relative', height: 120, borderRadius: 16, overflow: 'hidden', marginBottom: 14, background: 'linear-gradient(180deg,#10201d,#0b1715)' }}>
        {tank.photo && (
          <img src={tank.photo} alt={tank.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,16,15,0.05), rgba(8,16,15,0.8))' }} />
        <div style={{ position: 'absolute', left: 14, right: 14, bottom: 10 }}>
          <h1 className="h-page" style={{ fontSize: 22, margin: 0 }}>{tank.name}</h1>
          <div className="faint">
            {[
              tank.volumeL ? fmtVolume(tank.volumeL, units) : null,
              tank.setupDate ? `set up ${fmtDaysAgo(tank.setupDate)}` : null,
              tank.sourceWater ? tank.sourceWater : null,
            ].filter(Boolean).join(' · ')}
          </div>
        </div>
      </div>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'overview', label: 'Overview' },
          { value: 'charts', label: 'Charts' },
          { value: 'log', label: 'Log' },
          { value: 'care', label: 'Care' },
        ]}
      />

      {tab === 'overview' && <Overview entries={entries} tank={tank} onOpen={setSheet} />}
      {tab === 'charts' && (
          <Suspense fallback={<div className="muted" style={{ padding: 20 }}>Loading charts…</div>}>
            <Charts entries={entries} tank={tank} />
          </Suspense>
        )}
      {tab === 'log' && <LogView entries={entries} tank={tank} />}
      {tab === 'care' && <Care entries={entries} tank={tank} />}

      <QuickLog onPick={setSheet} />

      {sheet === 'test' && <TestSheet tankId={tank.id} onClose={() => setSheet(null)} />}
      {sheet === 'waterChange' && <WaterChangeSheet tankId={tank.id} onClose={() => setSheet(null)} />}
      {sheet === 'maintenance' && <MaintenanceSheet tankId={tank.id} onClose={() => setSheet(null)} />}
      {sheet === 'feeding' && <FeedingSheet tankId={tank.id} onClose={() => setSheet(null)} />}
      {sheet === 'livestock' && <LivestockSheet tankId={tank.id} onClose={() => setSheet(null)} />}
      {editing && <EditTankSheet tank={tank} onClose={() => setEditing(false)} />}
    </main>
  )
}

function QuickActions({ onOpen }: { onOpen: (s: 'test' | 'waterChange' | 'maintenance' | 'feeding' | 'livestock') => void }) {
  return (
    <div className="btn-grid2">
      <button className="btn btn-primary" type="button" onClick={() => onOpen('test')}>
        Log test
      </button>
      <button className="btn" type="button" onClick={() => onOpen('waterChange')}>
        Water change
      </button>
      <button className="btn" type="button" onClick={() => onOpen('feeding')}>
        Feed
      </button>
      <button className="btn" type="button" onClick={() => onOpen('livestock')}>
        Livestock
      </button>
    </div>
  )
}

function QuickLog({ onPick }: { onPick: (s: 'test' | 'waterChange' | 'maintenance' | 'feeding' | 'livestock') => void }) {
  const [open, setOpen] = useState(false)
  const items: { key: 'test' | 'waterChange' | 'maintenance' | 'feeding' | 'livestock'; icon: string; label: string }[] = [
    { key: 'test', icon: '🧪', label: 'Test' },
    { key: 'waterChange', icon: '💧', label: 'Water change' },
    { key: 'feeding', icon: '🍤', label: 'Fed' },
    { key: 'maintenance', icon: '🔧', label: 'Maintenance' },
    { key: 'livestock', icon: '🐟', label: 'Livestock' },
  ]
  return (
    <div style={{ position: 'fixed', right: 18, bottom: 'calc(var(--tabbar-h) + 18px)', zIndex: 30, display: 'grid', gap: 8, justifyItems: 'center' }}>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: -1 }} onClick={() => setOpen(false)} />
          {items.map((it, i) => (
            <button
              key={it.key}
              type="button"
              className="btn"
              style={{
                margin: 0,
                borderRadius: 999,
                padding: '10px 16px',
                background: 'var(--bg-card-hi)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                animation: `slideUp 0.18s ${i * 0.03}s cubic-bezier(0.2,0.8,0.2,1) both`,
              }}
              onClick={() => {
                setOpen(false)
                onPick(it.key)
              }}
            >
              <span>{it.icon}</span> {it.label}
            </button>
          ))}
        </>
      )}
      <button
        type="button"
        className="tab-center"
        style={{ margin: 0, width: 54, height: 54, fontSize: 28, transform: open ? 'rotate(45deg)' : undefined, transition: 'transform 0.18s' }}
        aria-label="Quick log"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        +
      </button>
    </div>
  )
}
