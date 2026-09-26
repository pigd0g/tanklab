import type { AppData, Tank } from '../types'

const KEY = 'tanklab.v1'

export const emptyData = (): AppData => ({
  version: 1,
  tanks: [],
  entries: [],
  settings: { units: 'metric' },
})

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyData()
    return migrate(JSON.parse(raw) as Partial<AppData>)
  } catch (err) {
    console.error('TankLab: failed to load data', err)
    return emptyData()
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch (err) {
    console.error('TankLab: failed to save data', err)
    throw new Error('Storage is full. Remove tank photos or free up space.')
  }
}

export function validateImport(data: unknown): AppData | null {
  try {
    const d = (typeof data === 'string' ? JSON.parse(data) : data) as Partial<AppData>
    if (!d || typeof d !== 'object') return null
    if (!Array.isArray(d.tanks) || !Array.isArray(d.entries)) return null
    const valid = migrate(d)
    return valid.version && valid.tanks.length + valid.entries.length >= 0 ? valid : null
  } catch {
    return null
  }
}

function migrate(d: Partial<AppData>): AppData {
  const tanks: Tank[] = (d.tanks ?? []).filter((t) => t && typeof t.id === 'string' && typeof t.name === 'string')
  const tankIds = new Set(tanks.map((t) => t.id))
  const entries = (d.entries ?? []).filter(
    (e) => e && typeof e.id === 'string' && typeof e.tankId === 'string' && tankIds.has(e.tankId) && typeof e.date === 'string' && typeof e.kind === 'string',
  )
  return {
    version: 1,
    tanks,
    entries: entries as AppData['entries'],
    settings: { units: d.settings?.units === 'imperial' ? 'imperial' : 'metric' },
  }
}
