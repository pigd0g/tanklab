import { useState } from 'react'
import { NavLink, Outlet, Route, Routes } from 'react-router-dom'
import { StoreProvider } from './lib/store'
import { TanksIcon, SettingsIcon } from './components/icons'
import Dashboard from './screens/Dashboard'
import TankDetail from './screens/TankDetail'
import Settings from './screens/Settings'
import { NewTankForm } from './screens/TankForm'

function TabBar({ onNew }: { onNew: () => void }) {
  return (
    <nav className="tabbar" aria-label="Main">
      <div className="tabbar-inner">
        <NavLink to="/" end className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
          <TanksIcon />
          Tanks
        </NavLink>
        <div className="tab-center-wrap">
          <button type="button" className="tab-center" aria-label="New tank" onClick={onNew}>
            +
          </button>
        </div>
        <NavLink to="/settings" className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
          <SettingsIcon />
          Settings
        </NavLink>
      </div>
    </nav>
  )
}

function Layout() {
  const [adding, setAdding] = useState(false)
  return (
    <>
      <Outlet />
      <TabBar onNew={() => setAdding(true)} />
      {adding && <NewTankForm onClose={() => setAdding(false)} />}
    </>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tank/:id" element={<TankDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </StoreProvider>
  )
}
