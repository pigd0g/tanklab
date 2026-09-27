import { createContext, useContext, useState, type ReactNode } from 'react'

type QuickLogCtx = {
  open: boolean
  setOpen: (v: boolean) => void
}

const Ctx = createContext<QuickLogCtx | null>(null)

export function QuickLogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>
}

export function useQuickLog(): QuickLogCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useQuickLog outside provider')
  return c
}