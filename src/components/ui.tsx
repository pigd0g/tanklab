import { useEffect, useRef, useState, type ReactNode } from 'react'

export function Sheet({ title, onClose, footer, children }: { title: string; onClose: () => void; footer?: ReactNode; children: ReactNode }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])
  return (
    <div className="sheet-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-grab" />
        <div className="sheet-head">
          <h2 className="sheet-title">{title}</h2>
          <button type="button" className="btn btn-ghost" style={{ padding: '6px 14px' }} onClick={onClose}>
            Close
          </button>
        </div>
        {children}
        {footer}
      </div>
    </div>
  )
}

export function Segmented<T extends string>({
  options, value, onChange,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="seg" role="tablist">
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={value === o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function TrendArrow({ trend }: { trend: 'up' | 'down' | 'steady' | 'none' }) {
  const glyph = trend === 'up' ? '↑' : trend === 'down' ? '↓' : trend === 'steady' ? '→' : '·'
  return (
    <span className={`trend ${trend}`} aria-label={`trend ${trend}`}>
      {glyph}
    </span>
  )
}

export function StatusDot({ status }: { status: 'good' | 'watch' | 'action' }) {
  return <span className={`dot ${status}`} />
}

export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now())
  const ref = useRef<number | undefined>(undefined)
  useEffect(() => {
    ref.current = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(ref.current)
  }, [intervalMs])
  return now
}
