import { useEffect } from 'react'
import { useQuickLog } from '../lib/quickLog'

export type QuickLogItem = { key: string; icon: string; label: string }

export function QuickLogMenu({ items, onPick }: { items: QuickLogItem[]; onPick: (key: string) => void }) {
  const { open, setOpen } = useQuickLog()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  if (!open) return null
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 29 }} onClick={() => setOpen(false)} />
      <div
        style={{
          position: 'fixed',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: 'calc(var(--tabbar-h) + 14px)',
          zIndex: 30,
          display: 'grid',
          gap: 8,
          justifyItems: 'stretch',
          minWidth: 200,
        }}
      >
        {items.map((it, i) => (
          <button
            key={it.key}
            type="button"
            className="btn"
            style={{
              margin: 0,
              justifyContent: 'flex-start',
              borderRadius: 999,
              padding: '10px 18px',
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
      </div>
    </>
  )
}