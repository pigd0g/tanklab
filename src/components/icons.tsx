export function FishLogo({ size = 28, color = '#57d9c2' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M7 24c5-8.8 13.1-14 22-14 2 0 4 .3 5.8.8L40 7c.5 3.4.8 6.8.7 10 2 2.2 3.3 4.5 3.3 7s-1.3 4.8-3.3 7c.1 3.2-.2 6.6-.7 10l-5.2-3.8A26 26 0 0 1 29 38c-8.9 0-17-5.2-22-14Z" fill={color} />
      <circle cx="34" cy="24" r="2.2" fill="#08100f" />
    </svg>
  )
}

export function LogoTile({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ borderRadius: 12, flexShrink: 0 }}>
      <rect width="24" height="24" rx="4" fill="#0e2a26" />
      <path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z" stroke="#57d9c2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 12v.5" stroke="#57d9c2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 17.93a9.77 9.77 0 0 1 0-11.86" stroke="#57d9c2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33" stroke="#57d9c2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.46 7.26C10.2 5.88 9.17 4.24 8 3h5.8a2 2 0 0 1 1.98 1.67l.23 1.4" stroke="#57d9c2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m16.01 17.93-.23 1.4A2 2 0 0 1 13.8 21H9.5a5.96 5.96 0 0 0 1.49-3.98" stroke="#57d9c2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function TanksIcon({ active }: { active?: boolean }) {
  const c = active ? '#57d9c2' : '#5f7a73'
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="13" rx="2" stroke={c} strokeWidth="1.7" />
      <path d="M4 14.5c3-2 6 2 9 0s4-1.4 7-.5" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 12.5c1.5-.8 3.5-.8 5 0" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 21h10M12 18v3" stroke={c} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

export function SettingsIcon({ active }: { active?: boolean }) {
  const c = active ? '#57d9c2' : '#5f7a73'
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z" stroke={c} strokeWidth="1.7" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.36a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.64 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.64 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.64 1.7 1.7 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.14.6.66 1 1.27 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z" stroke={c} strokeWidth="1.5" />
    </svg>
  )
}

export function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1L9 4h6l1.5 2h1A2.5 2.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-9Z" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="13" r="3.4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}