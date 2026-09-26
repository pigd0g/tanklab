export function FishLogo({ size = 28, color = '#57d9c2' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M43 24c-4.8-7.2-12.4-11.4-20.2-11.4-4.1 0-8.1 1.1-11.6 3.3L4 12.5c.6 3.2 1.8 6.2 3.5 8.9A23.6 23.6 0 0 0 4 33.4l7.2-3.4a22.6 22.6 0 0 0 11.6 3.4C30.6 33.4 38.2 29.9 43 24Z" fill={color} />
      <circle cx="35.4" cy="22.6" r="2" fill="#08100f" />
      <path d="M43 24c1.8-2.7 3.4-6.3 3.4-9.4-2.5.5-5 1.5-7.2 3" stroke={color} strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path d="M15 14.5c-2.5 5.8-2.5 12.4 0 18.2" stroke="#08100f" strokeOpacity="0.35" strokeWidth="2" fill="none" />
    </svg>
  )
}

export function LogoTile({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true" style={{ borderRadius: 12, flexShrink: 0 }}>
      <rect width="48" height="48" rx="12" fill="#0e2a26" />
      <path d="M8 10c3 4 3 10 0 14M15 8c3 4 3 10 0 14" stroke="#57d9c2" strokeOpacity="0.22" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M40 27c-3.4-5-8.7-8-14.2-8-2.9 0-5.7.8-8.2 2.3l-4.9-2.2c.4 2.2 1.3 4.3 2.5 6.2a16.6 16.6 0 0 0-2.5 7.3l4.9-2.4a16.1 16.1 0 0 0 8.2 2.4c5.5 0 10.8-2.5 14.2-5.6Z" fill="#57d9c2" />
      <circle cx="33.5" cy="25.9" r="1.4" fill="#08100f" />
      <path d="M40 27c1.3-1.9 2.4-4.4 2.4-6.6-1.8.4-3.5 1.1-5.1 2.1" stroke="#57d9c2" strokeWidth="1.9" strokeLinecap="round" fill="none" />
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
