import type { Tank } from '../types'
import { useStore } from '../lib/store'
import { tankStatus, cycleStage, reminders, CYCLE_LABEL } from '../lib/derive'
import { fmtVolume, fmtTemp, fmtShortDate, fmtNum } from '../lib/utils'
import { StatusDot, useNow } from '../components/ui'
import { LogoTile } from '../components/icons'
import { NewTankForm } from './TankForm'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type CardInfo = {
  tank: Tank
  status: ReturnType<typeof tankStatus>
  stage: ReturnType<typeof cycleStage>
  rem: ReturnType<typeof reminders>
}

function TankCard({ info }: { info: CardInfo }) {
  const nav = useNavigate()
  const { units } = useStore()
  const { tank, status, rem } = info
  const overdue = rem.waterChange.overdue || rem.test.overdue
  const last = status.latest
  const sub = [
    tank.volumeL ? fmtVolume(tank.volumeL, units) : null,
    last?.waterTemp != null ? fmtTemp(last.waterTemp, units) : null,
  ].filter(Boolean).join(' · ')
  return (
    <button
      type="button"
      className="card"
      style={{ display: 'block', width: '100%', textAlign: 'left', padding: 0, overflow: 'hidden' }}
      onClick={() => nav(`/tank/${tank.id}`)}
    >
      <div style={{ position: 'relative', height: 92, background: 'linear-gradient(180deg, #10201d, #0b1715)' }}>
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
      <div className="row" style={{ padding: '10px 14px 12px', gap: 8 }}>
        <span className="faint">{CYCLE_LABEL[info.stage.stage]}</span>
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
    </button>
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
    }
  })

  const attention = infos
    .filter((i) => i.status.status !== 'good' || i.rem.waterChange.overdue || i.rem.test.overdue)
    .map((i) => i.tank.name)

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
          <div className="muted" style={{ marginTop: 4 }}>{attention.join(', ')}</div>
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


