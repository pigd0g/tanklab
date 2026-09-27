import type { Tank } from '../types'
import { useStore } from '../lib/store'
import { tankStatus, cycleStage, reminders, tankActions, CYCLE_LABEL } from '../lib/derive'
import { fmtVolume, fmtTemp, fmtShortDate, fmtNum } from '../lib/utils'
import { StatusDot, useNow } from '../components/ui'
import { LogoTile } from '../components/icons'
import { NewTankForm } from './TankForm'
import { TestSheet } from './EntrySheets'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type CardInfo = {
  tank: Tank
  status: ReturnType<typeof tankStatus>
  stage: ReturnType<typeof cycleStage>
  rem: ReturnType<typeof reminders>
  actions: ReturnType<typeof tankActions>
}

function TankCard({ info }: { info: CardInfo }) {
  const nav = useNavigate()
  const { units } = useStore()
  const [testing, setTesting] = useState(false)
  const { tank, status, rem } = info
  const overdue = rem.waterChange.overdue || rem.test.overdue
  const last = status.latest
  const sub = [
    tank.volumeL ? fmtVolume(tank.volumeL, units) : null,
    last?.waterTemp != null ? fmtTemp(last.waterTemp, units) : null,
  ].filter(Boolean).join(' · ')
  const open = () => nav(`/tank/${tank.id}`)
  return (
    <div className="card tankcard" style={{ display: 'block', width: '100%', padding: 0, overflow: 'hidden' }}>
      <div
        role="button"
        tabIndex={0}
        className="tankcard-link"
        onClick={open}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            open()
          }
        }}
      >
        <div style={{ position: 'relative', height: 132, background: 'linear-gradient(180deg, #10201d, #0b1715)' }}>
          {tank.photo && (
            <img
              src={tank.photo}
              alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }}
            />
          )}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(8,16,15,0) 0%, rgba(8,16,15,0.85) 100%)',
            }}
          />
          <div style={{ position: 'absolute', left: 14, right: 14, bottom: 10 }}>
            <div className="row">
              <StatusDot status={status.status} />
              <strong style={{ fontFamily: 'var(--display)', fontSize: 17, letterSpacing: '-0.01em' }}>{tank.name}</strong>
              <span className="spacer" />
              <span className="faint">{sub}</span>
            </div>
          </div>
        </div>
        <div className="row" style={{ padding: '10px 14px', gap: 8 }}>
          <span className="faint">{CYCLE_LABEL[info.stage.stage]}</span>
          {info.actions.some((a) => a.key.startsWith('cycle-')) && (
            <span className="cycle-badge">Cycle</span>
          )}
          {last?.ammonia != null && (
            <span className="muted" style={{ fontSize: 12.5 }}>
              NH₃/NH₄⁺ {fmtNum(last.ammonia, 2)}
            </span>
          )}
          {last?.nitrate != null && (
            <span className="muted" style={{ fontSize: 12.5 }}>
              NO₃ {fmtNum(last.nitrate, 0)}
            </span>
          )}
          <span className="spacer" />
          {overdue && <span className="dot action" title="Task overdue" />}
          <span className="faint">{tank.setupDate ? `since ${fmtShortDate(tank.setupDate)}` : ''}</span>
        </div>
      </div>
      <div className="tankcard-foot">
        <span className="faint">{rem.test.lastIso ? `last test ${fmtShortDate(rem.test.lastIso)}` : 'no tests yet'}</span>
        <span className="spacer" />
        <button className="btn qlog-btn" type="button" onClick={() => setTesting(true)}>
          Quick test
        </button>
      </div>
      {testing && <TestSheet tankId={tank.id} onClose={() => setTesting(false)} />}
    </div>
  )
}

export default function Dashboard() {
  const { tanks, units, tankEntries } = useStore()
  useNow()
  const [adding, setAdding] = useState(false)

  const infos: CardInfo[] = tanks.map((tank) => {
    const entries = tankEntries(tank.id)
    return {
      tank,
      status: tankStatus(entries, tank),
      stage: cycleStage(entries, tank),
      rem: reminders(entries, tank),
      actions: tankActions(entries, tank),
    }
  })

  const attention = infos.flatMap((i) =>
    i.actions.map((a) => ({ tank: i.tank.name, ...a })),
  )

  return (
    <main className="app page">
      <div className="row" style={{ marginBottom: 20 }}>
        <LogoTile size={40} />
        <div>
          <h1 className="h-page" style={{ fontSize: 24 }}>
            TankLab
          </h1>
        </div>
        <span className="spacer" />
        <span className="faint">{units === 'metric' ? '°C · L' : '°F · gal'}</span>
      </div>

      {attention.length > 0 && (
        <div
          className="card"
          style={{
            marginBottom: 14,
            padding: '12px 16px',
            borderColor: 'rgba(245,184,79,0.35)',
            background: 'rgba(245,184,79,0.07)',
          }}
        >
          <div className="row">
            <StatusDot status="watch" />
            <strong style={{ fontSize: 13.5 }}>Needs attention</strong>
          </div>
          <div style={{ marginTop: 6 }}>
            {attention.map((a) => (
              <div key={a.tank + a.key} className="row" style={{ padding: '3px 0' }}>
                <span className="muted" style={{ fontSize: 13 }}>{a.tank}</span>
                <span style={{ fontSize: 13 }}>{a.label}</span>
                <span className="spacer" />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: a.overdue ? 'var(--bad)' : 'var(--warn)' }}>
                  {a.overdue ? 'Overdue' : 'Due'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tanks.length === 0 ? (
        <div className="empty">
          <div className="big">🐠</div>
          <p style={{ margin: '0 0 16px' }}>
            No tanks yet.
            <br />
            Add your first tank to start tracking water quality.
          </p>
          <button className="btn btn-primary" type="button" onClick={() => setAdding(true)}>
            Add your first tank
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {infos.map((i) => (
            <TankCard key={i.tank.id} info={i} />
          ))}
        </div>
      )}

      {adding && <NewTankForm onClose={() => setAdding(false)} />}
    </main>
  )
}


