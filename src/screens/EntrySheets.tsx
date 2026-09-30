import { useState } from 'react'
import type { Entry, LivestockSubtype, MaintenanceType, SourceWater } from '../types'
import { MAINTENANCE_LABELS, SOURCE_WATER_LABELS } from '../types'
import { useStore } from '../lib/store'
import { nowLocalValue, toIso, isoToLocalValue } from '../lib/utils'
import { Sheet } from '../components/ui'

type SheetProps = { tankId: string; edit?: Entry; onClose: () => void; onDelete?: () => void; preset?: { maintenanceType?: MaintenanceType; note?: string } }

const saveBtn = 'btn btn-primary btn-block'

function NumField(props: {
  label: string
  value: number | null | undefined
  onChange: (v: number | null) => void
  step?: number
  placeholder?: string
  suffix?: string
}) {
  return (
    <div>
      <label className="f-label">{props.label}</label>
      <input
        type="number"
        inputMode="decimal"
        step={props.step ?? 0.01}
        placeholder={props.placeholder ?? '—'}
        value={props.value ?? ''}
        onChange={(e) => props.onChange(e.target.value === '' ? null : Number(e.target.value))}
      />
      {props.suffix && <div className="faint" style={{ marginTop: 4 }}>{props.suffix}</div>}
    </div>
  )
}


function DateField({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  return (
    <div>
      <label className="f-label">Date &amp; time</label>
      <input type="datetime-local" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function NoteField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="f-label">Note (optional)</label>
      <textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Anything worth remembering" />
    </div>
  )
}
function DeleteBtn({ onDelete }: { onDelete?: () => void }) {
  if (!onDelete) return null
  return (
    <button className="btn btn-danger btn-block" type="button" style={{ marginTop: 10 }} onClick={onDelete}>
      Delete entry
    </button>
  )
}

function useEntrySave(tankId: string, onClose: () => void, edit?: Entry) {
  const { addEntry, updateEntry } = useStore()
  return (partial: Omit<Entry, 'id' | 'tankId' | 'date'>, dateIso: string) => {
    if (edit) updateEntry(edit.id, { ...partial, date: dateIso })
    else addEntry({ tankId, date: dateIso, ...partial })
    onClose()
  }
}

export function TestSheet({ tankId, edit, onClose, onDelete }: SheetProps) {
  const { units } = useStore()
  const save = useEntrySave(tankId, onClose, edit)
  const [dt, setDt] = useState(edit ? isoToLocalValue(edit.date) : nowLocalValue())
  const [ammonia, setAmmonia] = useState<number | null>(edit?.ammonia ?? null)
  const [nitrite, setNitrite] = useState<number | null>(edit?.nitrite ?? null)
  const [nitrate, setNitrate] = useState<number | null>(edit?.nitrate ?? null)
  const [phosphate, setPhosphate] = useState<number | null>(edit?.phosphate ?? null)
  const [ph, setPh] = useState<number | null>(edit?.ph ?? null)
  const [waterTemp, setWaterTemp] = useState<number | null>(edit?.waterTemp ?? null)
  const [roomTemp, setRoomTemp] = useState<number | null>(edit?.roomTemp ?? null)
  const [note, setNote] = useState(edit?.note ?? '')
  return (
    <Sheet title={edit ? 'Edit test' : 'Log test'} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save(
            { kind: 'test', ammonia, nitrite, nitrate, phosphate, ph, waterTemp, roomTemp, note: note || undefined },
            toIso(dt),
          )
        }}
      >
        <DateField value={dt} onChange={setDt} />
        <p className="faint" style={{ marginTop: 10 }}>Fill in only what you tested. Leave the rest blank.</p>
        <div className="f-row">
          <NumField label="Ammonia (NH₃/NH₄⁺) ppm" value={ammonia} onChange={setAmmonia} step={0.05} />
          <NumField label="Nitrite ppm" value={nitrite} onChange={setNitrite} step={0.05} />
        </div>
        <div className="f-row">
          <NumField label="Nitrate ppm" value={nitrate} onChange={setNitrate} step={1} />
          <NumField label="Phosphate ppm" value={phosphate} onChange={setPhosphate} step={0.05} />
        </div>
        <div className="f-row">
          <NumField label="pH" value={ph} onChange={setPh} step={0.1} />
          <NumField label={`Water temp °${units === 'metric' ? 'C' : 'F'}`} value={waterTemp} onChange={setWaterTemp} step={0.1} />
        </div>
        <NumField label={`Room temp °${units === 'metric' ? 'C' : 'F'} (optional)`} value={roomTemp} onChange={setRoomTemp} step={0.1} />
        <NoteField value={note} onChange={setNote} />
        <DeleteBtn onDelete={onDelete} />
        <button className={saveBtn} style={{ marginTop: 18 }} type="submit">
          Save test
        </button>
      </form>
    </Sheet>
  )
}

export function WaterChangeSheet({ tankId, edit, onClose, onDelete }: SheetProps) {
  const { units } = useStore()
  const save = useEntrySave(tankId, onClose, edit)
  const [dt, setDt] = useState(edit ? isoToLocalValue(edit.date) : nowLocalValue())
  const [percent, setPercent] = useState<number | null>(edit?.percent ?? null)
  const [removed, setRemoved] = useState<number | null>(edit?.litersRemoved ?? null)
  const [added, setAdded] = useState<number | null>(edit?.litersAdded ?? null)
  const [source, setSource] = useState<SourceWater>(edit?.sourceWater ?? 'tap')
  const [note, setNote] = useState(edit?.note ?? '')
  return (
    <Sheet title={edit ? 'Edit water change' : 'Water change'} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save(
            {
              kind: 'waterChange',
              percent,
              litersRemoved: removed,
              litersAdded: added,
              sourceWater: source,
              note: note || undefined,
            },
            toIso(dt),
          )
        }}
      >
        <DateField value={dt} onChange={setDt} />
        <NumField
          label="Water changed %"
          value={percent}
          onChange={setPercent}
          step={5}
          suffix="Standard practice is 10–30% weekly"
        />
        <div className="f-row">
          <NumField
            label={`Removed (${units === 'metric' ? 'L' : 'gal'})`}
            value={removed}
            onChange={setRemoved}
            step={1}
          />
          <NumField
            label={`Added (${units === 'metric' ? 'L' : 'gal'})`}
            value={added}
            onChange={setAdded}
            step={1}
          />
        </div>
        <div>
          <label className="f-label">Source water</label>
          <select value={source} onChange={(e) => setSource(e.target.value as SourceWater)}>
            {(Object.keys(SOURCE_WATER_LABELS) as SourceWater[]).map((k) => (
              <option key={k} value={k}>
                {SOURCE_WATER_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <NoteField value={note} onChange={setNote} />
        <DeleteBtn onDelete={onDelete} />
        <button className={saveBtn} style={{ marginTop: 18 }} type="submit">
          Save water change
        </button>
      </form>
    </Sheet>
  )
}

export function MaintenanceSheet({ tankId, edit, onClose, onDelete, preset }: SheetProps) {
  const save = useEntrySave(tankId, onClose, edit)
  const [dt, setDt] = useState(edit ? isoToLocalValue(edit.date) : nowLocalValue())
  const [type, setType] = useState<MaintenanceType>(edit?.maintenanceType ?? preset?.maintenanceType ?? 'filterClean')
  const [note, setNote] = useState(edit?.note ?? preset?.note ?? '')
  const isDose = type === 'ammoniaDose'
  return (
    <Sheet title={isDose ? (edit ? 'Edit ammonia dose' : 'Log ammonia dose') : edit ? 'Edit maintenance' : 'Maintenance'} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save({ kind: 'maintenance', maintenanceType: type, note: note || undefined }, toIso(dt))
        }}
      >
        <DateField value={dt} onChange={setDt} />
        <div>
          <label className="f-label">What did you do?</label>
          <select value={type} onChange={(e) => setType(e.target.value as MaintenanceType)}>
            {(Object.keys(MAINTENANCE_LABELS) as MaintenanceType[])
              .filter((k) => k !== 'waterChange')
              .map((k) => (
                <option key={k} value={k}>
                  {MAINTENANCE_LABELS[k]}
                </option>
              ))}
          </select>
        </div>
        <NoteField value={note} onChange={setNote} />
        <DeleteBtn onDelete={onDelete} />
        <button className={saveBtn} style={{ marginTop: 18 }} type="submit">
          Save maintenance
        </button>
      </form>
    </Sheet>
  )
}

export function FeedingSheet({ tankId, edit, onClose, onDelete }: SheetProps) {
  const save = useEntrySave(tankId, onClose, edit)
  const [dt, setDt] = useState(edit ? isoToLocalValue(edit.date) : nowLocalValue())
  const [food, setFood] = useState(edit?.food ?? '')
  const [amount, setAmount] = useState(edit?.amount ?? '')
  const [note, setNote] = useState(edit?.note ?? '')
  return (
    <Sheet title={edit ? 'Edit feeding' : 'Feeding'} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save(
            { kind: 'feeding', food: food || null, amount: amount || null, note: note || undefined },
            toIso(dt),
          )
        }}
      >
        <DateField value={dt} onChange={setDt} />
        <div className="f-row">
          <div>
            <label className="f-label">Food</label>
            <input value={food} onChange={(e) => setFood(e.target.value)} placeholder="Flakes, pellets…" />
          </div>
          <div>
            <label className="f-label">Amount</label>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Pinch, 2 pellets…" />
          </div>
        </div>
        <NoteField value={note} onChange={setNote} />
        <DeleteBtn onDelete={onDelete} />
        <button className={saveBtn} style={{ marginTop: 18 }} type="submit">
          Save feeding
        </button>
      </form>
    </Sheet>
  )
}

export function LivestockSheet({ tankId, edit, onClose, onDelete }: SheetProps) {
  const save = useEntrySave(tankId, onClose, edit)
  const [dt, setDt] = useState(edit ? isoToLocalValue(edit.date) : nowLocalValue())
  const [subtype, setSubtype] = useState<LivestockSubtype>(edit?.subtype ?? 'added')
  const [species, setSpecies] = useState(edit?.species ?? '')
  const [count, setCount] = useState<number | null>(edit?.count ?? null)
  const [note, setNote] = useState(edit?.note ?? '')
  const labels: Record<LivestockSubtype, string> = {
    added: 'Added',
    death: 'Death',
    breeding: 'Breeding / spawning',
    observation: 'Observation',
  }
  return (
    <Sheet title={edit ? 'Edit livestock entry' : 'Livestock'} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save(
            {
              kind: 'livestock',
              subtype,
              species: species || null,
              count,
              note: note || undefined,
            },
            toIso(dt),
          )
        }}
      >
        <DateField value={dt} onChange={setDt} />
        <div>
          <label className="f-label">Type</label>
          <select value={subtype} onChange={(e) => setSubtype(e.target.value as LivestockSubtype)}>
            {(Object.keys(labels) as LivestockSubtype[]).map((k) => (
              <option key={k} value={k}>
                {labels[k]}
              </option>
            ))}
          </select>
        </div>
        <div className="f-row">
          <div>
            <label className="f-label">Species</label>
            <input value={species} onChange={(e) => setSpecies(e.target.value)} placeholder="Betta, corydoras…" />
          </div>
          <NumField label="Number" value={count} onChange={setCount} step={1} />
        </div>
        <NoteField value={note} onChange={setNote} />
        <DeleteBtn onDelete={onDelete} />
        <button className={saveBtn} style={{ marginTop: 18 }} type="submit">
          Save
        </button>
      </form>
    </Sheet>
  )
}
