import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SourceWater, Tank } from '../types'
import { SOURCE_WATER_LABELS } from '../types'
import { useStore } from '../lib/store'
import { resizeImageFile, nowLocalValue, toIso } from '../lib/utils'
import { Sheet } from '../components/ui'
import { CameraIcon } from '../components/icons'

export function NewTankForm({ onClose }: { onClose: () => void }) {
  const { addTank } = useStore()
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [volume, setVolume] = useState('')
  const [setup, setSetup] = useState(nowLocalValue().slice(0, 10))
  const [established, setEstablished] = useState(false)
  const [source, setSource] = useState<SourceWater | ''>('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function pick(file: File | undefined) {
    if (!file) return
    setBusy(true)
    try {
      setPhoto(await resizeImageFile(file))
    } catch {
      alert('Could not read that image.')
    }
    setBusy(false)
  }

  return (
    <Sheet title="New tank" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          const t = addTank({
            name: name.trim(),
            volumeL: volume ? Number(volume) : null,
            photo,
            setupDate: setup ? toIso(`${setup}T12:00`) : null,
            sourceWater: source || null,
            feedingSchedule: null,
            established,
            cycling: null,
            maintenanceSchedule: [],
          })
          onClose()
          nav(`/tank/${t.id}`)
        }}
      >
        <label className="f-label">Tank name</label>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ella's Betta Tank" />
        <div className="f-row">
          <div>
            <label className="f-label">Volume (L)</label>
            <input type="number" inputMode="decimal" value={volume} onChange={(e) => setVolume(e.target.value)} placeholder="20" />
          </div>
          <div>
            <label className="f-label">Set up on</label>
            <input type="date" value={setup} onChange={(e) => setSetup(e.target.value)} />
          </div>
        </div>
        <label className="check-row" style={{ marginTop: 12 }}>
          <input
            type="checkbox"
            checked={established}
            onChange={(e) => setEstablished(e.target.checked)}
            style={{ width: 'auto' }}
          />
          <span>
            Already established / cycled
            <span className="faint" style={{ display: 'block' }}>For adopted tanks that are already running — skips new-tank assumptions</span>
          </span>
        </label>
        <div>
          <label className="f-label">Source water</label>
          <select value={source} onChange={(e) => setSource(e.target.value as SourceWater)}>
            <option value="">Not set</option>
            {(Object.keys(SOURCE_WATER_LABELS) as SourceWater[]).map((k) => (
              <option key={k} value={k}>{SOURCE_WATER_LABELS[k]}</option>
            ))}
          </select>
        </div>
        <label className="f-label">Photo</label>
        <label className="btn btn-block" style={{ position: 'relative', overflow: 'hidden' }}>
          <CameraIcon />
          {busy ? 'Processing…' : photo ? 'Replace photo' : 'Add photo (camera or gallery)'}
          <input
            type="file"
            accept="image/*"

            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
            onChange={(e) => pick(e.target.files?.[0])}
          />
        </label>
        {photo && (
          <img src={photo} alt="Tank preview" style={{ width: '100%', marginTop: 10, borderRadius: 12, border: '1px solid var(--line)' }} />
        )}
        <button className="btn btn-primary btn-block" style={{ marginTop: 18 }} type="submit" disabled={!name.trim()}>
          Create tank
        </button>
      </form>
    </Sheet>
  )
}

export function EditTankSheet({ tank, onClose }: { tank: Tank; onClose: () => void }) {
  const { updateTank, units } = useStore()
  const nav = useNavigate()
  const [name, setName] = useState(tank.name)
  const [volume, setVolume] = useState(tank.volumeL ? String(tank.volumeL) : '')
  const [setup, setSetup] = useState(() => {
    if (!tank.setupDate) return ''
    const d = new Date(tank.setupDate)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  })
  const [source, setSource] = useState<SourceWater | ''>(tank.sourceWater ?? '')
  const [established, setEstablished] = useState(Boolean(tank.established))
  const [photo, setPhoto] = useState<string | null | undefined>(tank.photo)
  const [busy, setBusy] = useState(false)

  async function pick(file: File | undefined) {
    if (!file) return
    setBusy(true)
    try {
      setPhoto(await resizeImageFile(file))
    } catch {
      alert('Could not read that image.')
    }
    setBusy(false)
  }

  return (
    <Sheet title="Edit tank" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          updateTank(tank.id, {
            name: name.trim(),
            volumeL: volume ? Number(volume) : null,
            setupDate: setup ? toIso(`${setup}T12:00`) : null,
            sourceWater: (source || null) as SourceWater | null,
            photo: photo ?? null,
            established,
          })
          onClose()
          nav(`/tank/${tank.id}`)
        }}
      >
        <label className="f-label">Tank name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
        <div className="f-row">
          <div>
            <label className="f-label">Volume ({units === 'metric' ? 'L' : 'gal'})</label>
            <input type="number" inputMode="decimal" value={volume} onChange={(e) => setVolume(e.target.value)} />
          </div>
          <div>
            <label className="f-label">Set up on</label>
            <input type="date" value={setup} onChange={(e) => setSetup(e.target.value)} />
          </div>
        </div>
        <label className="check-row" style={{ marginTop: 12 }}>
          <input
            type="checkbox"
            checked={established}
            onChange={(e) => setEstablished(e.target.checked)}
            style={{ width: 'auto' }}
          />
          <span>
            Already established / cycled
            <span className="faint" style={{ display: 'block' }}>For adopted tanks that are already running — skips new-tank assumptions</span>
          </span>
        </label>
        <div>
          <label className="f-label">Source water</label>
          <select value={source} onChange={(e) => setSource(e.target.value as SourceWater)}>
            <option value="">Not set</option>
            {(Object.keys(SOURCE_WATER_LABELS) as SourceWater[]).map((k) => (
              <option key={k} value={k}>{SOURCE_WATER_LABELS[k]}</option>
            ))}
          </select>
        </div>
        <label className="f-label">Photo</label>
        <label className="btn btn-block" style={{ position: 'relative', overflow: 'hidden' }}>
          <CameraIcon />
          {busy ? 'Processing…' : photo ? 'Change photo' : 'Add photo'}
          <input
            type="file"
            accept="image/*"
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
            onChange={(e) => pick(e.target.files?.[0])}
          />
        </label>
        {photo && (
          <div style={{ marginTop: 10, textAlign: 'center' }}>
            <img src={photo} alt="Tank" style={{ width: '100%', borderRadius: 12, border: '1px solid var(--line)' }} />
            <button type="button" className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => setPhoto(null)}>
              Remove photo
            </button>
          </div>
        )}
        <button className="btn btn-primary btn-block" style={{ marginTop: 18 }} type="submit">
          Save changes
        </button>
      </form>
    </Sheet>
  )
}
