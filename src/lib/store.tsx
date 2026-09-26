import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AppData, Entry, Tank, Units } from '../types'
import { emptyData, loadData, saveData, validateImport } from './storage'

type Store = {
  data: AppData
  tanks: Tank[]
  entries: Entry[]
  units: Units
  getTank: (id: string) => Tank | undefined
  tankEntries: (tankId: string) => Entry[]
  addTank: (t: Omit<Tank, 'id' | 'createdAt'>) => Tank
  updateTank: (id: string, patch: Partial<Tank>) => void
  deleteTank: (id: string) => void
  addEntry: (e: Omit<Entry, 'id'>) => void
  updateEntry: (id: string, patch: Partial<Entry>) => void
  deleteEntry: (id: string) => void
  setUnits: (u: Units) => void
  exportJson: () => string
  importJson: (raw: string, mode: 'replace' | 'merge') => boolean
  replaceAll: (d: AppData) => void
  clearAll: () => void
}

const StoreCtx = createContext<Store | null>(null)

const uid = () =>
  (crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData())

  useEffect(() => {
    try {
      saveData(data)
    } catch {
      // surface on next save; forms show alert on throw
    }
  }, [data])

  const store = useMemo<Store>(() => {
    const getTank = (id: string) => data.tanks.find((t) => t.id === id)
    const tankEntries = (tankId: string) =>
      data.entries.filter((e) => e.tankId === tankId).sort((a, b) => b.date.localeCompare(a.date))

    return {
      data,
      tanks: [...data.tanks].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      entries: data.entries,
      units: data.settings.units,
      getTank,
      tankEntries,
      addTank: (t) => {
        const tank: Tank = { ...t, id: uid(), createdAt: new Date().toISOString() }
        setData((d) => ({ ...d, tanks: [...d.tanks, tank] }))
        return tank
      },
      updateTank: (id, patch) =>
        setData((d) => ({
          ...d,
          tanks: d.tanks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      deleteTank: (id) =>
        setData((d) => ({
          ...d,
          tanks: d.tanks.filter((t) => t.id !== id),
          entries: d.entries.filter((e) => e.tankId !== id),
        })),
      addEntry: (e) =>
        setData((d) => ({ ...d, entries: [...d.entries, { ...e, id: uid() }] })),
      updateEntry: (id, patch) =>
        setData((d) => ({
          ...d,
          entries: d.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),
      deleteEntry: (id) =>
        setData((d) => ({ ...d, entries: d.entries.filter((e) => e.id !== id) })),
      setUnits: (u) => setData((d) => ({ ...d, settings: { ...d.settings, units: u } })),
      exportJson: () => JSON.stringify(data, null, 2),
      importJson: (raw, mode) => {
        const parsed = validateImport(raw)
        if (!parsed) return false
        if (mode === 'replace') {
          setData(parsed)
        } else {
          setData((d) => {
            const tankById = new Map(d.tanks.map((t) => [t.id, t]))
            for (const t of parsed.tanks) tankById.set(t.id, t)
            const entryIds = new Set(d.entries.map((e) => e.id))
            const merged = [...d.entries]
            for (const e of parsed.entries) {
              if (!entryIds.has(e.id)) merged.push(e)
            }
            return { ...d, tanks: [...tankById.values()], entries: merged }
          })
        }
        return true
      },
      replaceAll: (d) => setData(d),
      clearAll: () => setData(emptyData()),
    }
  }, [data])

  return <StoreCtx.Provider value={store}>{children}</StoreCtx.Provider>
}

export function useStore(): Store {
  const s = useContext(StoreCtx)
  if (!s) throw new Error('useStore outside provider')
  return s
}
