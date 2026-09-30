import { useState } from 'react'
import type { Entry, Tank } from '../types'
import { MAINTENANCE_LABELS, SOURCE_WATER_LABELS } from '../types'
import { useStore } from '../lib/store'
import { fmtNum, isoToLocalValue } from '../lib/utils'
import { TestSheet, WaterChangeSheet, MaintenanceSheet, FeedingSheet, LivestockSheet } from './EntrySheets'

type Filter = 'all' | Entry['kind']

const FILTER_LABEL: Record<Filter, string> = {
  all: 'All',
  test: 'Tests',
  waterChange: 'Water changes',
  maintenance: 'Maintenance',
  feeding: 'Feeding',
  livestock: 'Livestock',
}

function describe(e: Entry): string {
  switch (e.kind) {
    case 'test': {
      const parts: string[] = []
      if (e.ammonia != null) parts.push(`NH₃/NH₄⁺ ${fmtNum(e.ammonia)}`)
      if (e.nitrite != null) parts.push(`NO₂⁻ ${fmtNum(e.nitrite)}`)
      if (e.nitrate != null) parts.push(`NO₃⁻ ${fmtNum(e.nitrate, 0)}`)
      if (e.phosphate != null) parts.push(`PO₄ ${fmtNum(e.phosphate)}`)
      if (e.ph != null) parts.push(`pH ${fmtNum(e.ph, 1)}`)
      if (e.waterTemp != null) parts.push(`${fmtNum(e.waterTemp, 1)}°C`)
      return parts.join(' · ') || 'Test'
    }
    case 'waterChange':
      return [
        e.percent != null ? `${e.percent}%` : null,
        e.litersRemoved != null ? `−${fmtNum(e.litersRemoved, 1)} L` : null,
        e.litersAdded != null ? `+${fmtNum(e.litersAdded, 1)} L` : null,
        e.sourceWater ? SOURCE_WATER_LABELS[e.sourceWater] : null,
      ].filter(Boolean).join(' · ') || 'Water change'
    case 'maintenance':
      return MAINTENANCE_LABELS[e.maintenanceType ?? 'other']
    case 'feeding':
      return [e.food, e.amount].filter(Boolean).join(' · ') || 'Fed'
    case 'livestock': {
      const label = { added: 'Added', death: 'Death', breeding: 'Breeding', observation: 'Observation' }[e.subtype ?? 'observation']
      return [label, e.species, e.count != null ? `×${e.count}` : null].filter(Boolean).join(' · ')
    }
  }
}

const kindIcon: Record<Entry['kind'], string> = {
  test: '🧪',
  waterChange: '💧',
  maintenance: '🔧',
  feeding: '🍤',
  livestock: '🐟',
}

export default function LogView({ entries, tank }: { entries: Entry[]; tank: Tank }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [editing, setEditing] = useState<Entry | null>(null)
  const { deleteEntry } = useStore()

  const filtered = entries.filter((e) => filter === 'all' || e.kind === filter)
  const groups = new Map<string, Entry[]>()
  for (const e of filtered) {
    const day = isoToLocalValue(e.date).slice(0, 10)
    const list = groups.get(day) ?? []
    list.push(e)
    groups.set(day, list)
  }

  return (
    <div>
      <div className="chips">
        {(Object.keys(FILTER_LABEL) as Filter[]).map((f) => (
          <button key={f} type="button" className={`chip ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>
            {FILTER_LABEL[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <div className="empty"><p>Nothing logged here yet.</p></div>}

      {[...groups.entries()].map(([day, list]) => (
        <div key={day}>
          <div className="faint" style={{ margin: '14px 2px 6px' }}>{day}</div>
          {list.map((e) => (
            <button
              key={e.id}
              type="button"
              className="card"
              style={{ display: 'block', width: '100%', textAlign: 'left', marginTop: 8, padding: '12px 14px' }}
              onClick={() => setEditing(e)}
            >
              <div className="row">
                <span>{kindIcon[e.kind]}</span>
                <strong style={{ fontSize: 14 }}>{describe(e)}</strong>
                <span className="spacer" />
                <span className="faint">{isoToLocalValue(e.date).slice(11, 16)}</span>
              </div>
              {e.note && <div className="muted" style={{ marginTop: 5, fontSize: 13 }}>{e.note}</div>}
            </button>
          ))}
        </div>
      ))}

      {editing && (
        <EditSwitch
          entry={editing}
          tankId={tank.id}
          onDone={() => setEditing(null)}
          onDelete={() => {
            deleteEntry(editing.id)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function EditSwitch(props: { entry: Entry; tankId: string; onDone: () => void; onDelete: () => void }) {
  const { entry, onDone, onDelete } = props
  const common = { tankId: props.tankId, edit: entry, onClose: onDone, onDelete }
  if (entry.kind === 'test') return <TestSheet {...common} />
  if (entry.kind === 'waterChange') return <WaterChangeSheet {...common} />
  if (entry.kind === 'maintenance') return <MaintenanceSheet {...common} />
  if (entry.kind === 'feeding') return <FeedingSheet {...common} />
  return <LivestockSheet {...common} />
}
