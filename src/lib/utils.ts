export const uid = () =>
  (crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`)

export const nowLocalValue = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const toIso = (localValue: string) => new Date(localValue).toISOString()

export const isoToLocalValue = (iso: string) => {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const fmtDateTime = (iso: string) => {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())} ${d.toLocaleString('en', { month: 'short' })} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const fmtDate = (iso: string) => {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())} ${d.toLocaleString('en', { month: 'short' })} ${d.getFullYear()}`
}

export const fmtShortDate = (iso: string) => {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())} ${d.toLocaleString('en', { month: 'short' })}`
}

export const daysAgo = (iso: string) =>
  Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)

export const fmtDaysAgo = (iso: string | null | undefined) => {
  if (!iso) return 'never'
  const d = daysAgo(iso)
  if (d <= 0) return 'today'
  if (d === 1) return 'yesterday'
  return `${d} days ago`
}

export const daysUntil = (iso: string) =>
  Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)

export const addDaysIso = (base: string, days: number) =>
  new Date(new Date(base).getTime() + days * 86_400_000).toISOString()

export const fmtNum = (n: number, digits = 2) => {
  const r = Math.round(n * 10 ** digits) / 10 ** digits
  return String(r)
}

// ---- units ----
export const lToGal = (l: number) => l / 3.785411784
export const cToF = (c: number) => c * 1.8 + 32

export const fmtVolume = (litres: number, units: 'metric' | 'imperial') =>
  units === 'metric' ? `${fmtNum(litres, litres >= 100 ? 0 : 1)} L` : `${fmtNum(lToGal(litres), 1)} gal`

export const fmtTemp = (celsius: number, units: 'metric' | 'imperial') =>
  units === 'metric' ? `${fmtNum(celsius, 1)}°C` : `${fmtNum(cToF(celsius), 1)}°F`

export const volInputStep = (units: 'metric' | 'imperial') => (units === 'metric' ? 1 : 0.5)

// ---- photo ----
const PHOTO_MAX = 720
const PHOTO_QUALITY = 0.72

export async function resizeImageFile(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, PHOTO_MAX / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', PHOTO_QUALITY)
}
