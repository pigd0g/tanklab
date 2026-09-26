import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { loadData, saveData } from './lib/storage'
import { emptyData } from './lib/storage'
import type { AppData } from './types'

function seedDemo(): AppData | null {
  const existing = loadData()
  if (existing.tanks.length > 0) return null
  const d = emptyData()
  const now = Date.now()
  const iso = (msAgo: number) => new Date(now - msAgo).toISOString()
  const day = 86_400_000
  const t1 = { id: 'demo-1', name: "Ella's Betta Tank", volumeL: 20, photo: null, setupDate: iso(18 * day), sourceWater: 'tap' as const, feedingSchedule: { timesPerDay: 2, note: '1 pinch betta pellets' }, createdAt: iso(18 * day) }
  const t2 = { id: 'demo-2', name: 'Community 60L', volumeL: 60, photo: null, setupDate: iso(210 * day), sourceWater: 'tap' as const, feedingSchedule: { timesPerDay: 1 }, createdAt: iso(210 * day) }
  d.tanks = [t1, t2]
  const e: AppData['entries'] = []
  // tank 1: cycling, 18 days
  for (let i = 18; i >= 0; i -= 2) {
    const prog = (18 - i) / 18
    e.push({ id: `d1-${i}`, tankId: 'demo-1', date: iso(i * day), kind: 'test', ammonia: i === 0 ? 0 : Number((0.9 * (1 - prog) + Math.random() * 0.05).toFixed(2)), nitrite: Number((0.7 * (1 - prog) * (prog > 0.4 ? 0.6 : 1)).toFixed(2)), nitrate: Number((prog * 12).toFixed(0)), ph: 6.9, waterTemp: 25.1, phosphate: null })
  }
  e.push({ id: 'd1-wc', tankId: 'demo-1', date: iso(4 * day), kind: 'waterChange', percent: 25, litersRemoved: 5, litersAdded: 5, sourceWater: 'tap' })
  e.push({ id: 'd1-f1', tankId: 'demo-1', date: iso(0.2 * day), kind: 'feeding', food: 'Betta pellets', amount: '2 pellets' })
  e.push({ id: 'd1-f2', tankId: 'demo-1', date: iso(6 * 3600_000), kind: 'feeding', food: 'Bloodworms', amount: 'pinch' })
  e.push({ id: 'd1-l1', tankId: 'demo-1', date: iso(17 * day), kind: 'livestock', subtype: 'added', species: 'Betta splendens', count: 1 })
  e.push({ id: 'd1-m1', tankId: 'demo-1', date: iso(8 * day), kind: 'maintenance', maintenanceType: 'conditioner' })
  // tank 2: established
  for (let i = 30; i >= 0; i -= 3) {
    e.push({ id: `d2-${i}`, tankId: 'demo-2', date: iso(i * day), kind: 'test', ammonia: 0, nitrite: 0, nitrate: Number((8 + (30 - i) * 0.5).toFixed(0)), ph: 7.2, waterTemp: 24.5, phosphate: 0.25 })
  }
  e.push({ id: 'd2-wc', tankId: 'demo-2', date: iso(9 * day), kind: 'waterChange', percent: 30, litersRemoved: 18, litersAdded: 18, sourceWater: 'tap' })
  d.entries = e
  return d
}

if (location.hash.slice(1).replace(/^\/+/, '') === 'demo') {
  const seeded = seedDemo()
  if (seeded) {
    saveData(seeded)
    history.replaceState(null, '', location.pathname + location.search)
    location.reload()
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
