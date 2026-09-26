import { useMemo, useRef, useState } from 'react'
import { useStore } from '../lib/store'
import { Segmented } from '../components/ui'

function bytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

export default function Settings() {
  const {
    data, units, setUnits, exportJson, importJson, clearAll, tanks, entries,
  } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [pendingImport, setPendingImport] = useState<string | null>(null)
  const [importMode, setImportMode] = useState<'replace' | 'merge' | null>(null)

  const size = useMemo(() => new Blob([JSON.stringify(data)]).size, [data])

  function doExport() {
    const blob = new Blob([exportJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tanklab-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg({ ok: true, text: 'Backup downloaded.' })
  }

  function pickFile(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setPendingImport(String(reader.result))
      setImportMode('merge')
    }
    reader.readAsText(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <main className="app page">
      <h1 className="h-page">Settings</h1>
      <p className="h-sub">Backups, units and data.</p>

      <h2 className="h-section">Units</h2>
      <div className="card">
        <Segmented
          value={units}
          onChange={setUnits}
          options={[
            { value: 'metric', label: '°C · L' },
            { value: 'imperial', label: '°F · gal' },
          ]}
        />
      </div>

      <h2 className="h-section">Backup</h2>
      <div className="card">
        <p className="muted" style={{ marginTop: 0 }}>
          All data lives only on this device. Export a backup regularly — clearing browser
          storage or uninstalling the browser wipes everything.
        </p>
        <button className="btn btn-primary btn-block" type="button" onClick={doExport}>
          Export backup (JSON)
        </button>
        <button className="btn btn-block" style={{ marginTop: 10 }} type="button" onClick={() => fileRef.current?.click()}>
          Import backup
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
        {msg && (
          <p className="muted" style={{ marginBottom: 0, color: msg.ok ? 'var(--good)' : 'var(--bad)' }}>
            {msg.text}
          </p>
        )}
      </div>

      <h2 className="h-section">Storage</h2>
      <div className="card">
        <div className="row" style={{ padding: '4px 0' }}>
          <span className="muted">Tanks</span>
          <span className="spacer" />
          <strong>{tanks.length}</strong>
        </div>
        <div className="row" style={{ padding: '4px 0' }}>
          <span className="muted">Log entries</span>
          <span className="spacer" />
          <strong>{entries.length}</strong>
        </div>
        <div className="row" style={{ padding: '4px 0' }}>
          <span className="muted">Space used</span>
          <span className="spacer" />
          <strong>{bytes(size)}</strong>
        </div>
        {!confirmClear ? (
          <button className="btn btn-danger btn-block" style={{ marginTop: 12 }} type="button" onClick={() => setConfirmClear(true)}>
            Delete all data…
          </button>
        ) : (
          <div style={{ marginTop: 12 }}>
            <p className="muted" style={{ margin: '0 0 10px' }}>
              This removes every tank, log entry and photo. It cannot be undone.
            </p>
            <div className="btn-grid2" style={{ marginTop: 0 }}>
              <button className="btn btn-ghost" type="button" onClick={() => setConfirmClear(false)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                type="button"
                onClick={() => {
                  clearAll()
                  setConfirmClear(false)
                  setMsg({ ok: true, text: 'All data deleted.' })
                }}
              >
                Delete everything
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="faint" style={{ textAlign: 'center', marginTop: 30 }}>
        TankLab — local-first aquarium tracking
      </p>

      {importMode && pendingImport !== null && (
        <div className="sheet-backdrop" style={{ alignItems: 'center', padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 420 }}>
            <h3 style={{ margin: '0 0 8px', fontFamily: 'var(--display)' }}>Import backup</h3>
            <p className="muted">
              Merge keeps what you have and adds entries from the file.
              Replace wipes this device and restores the backup.
            </p>
            <div className="btn-grid2">
              <button
                className="btn"
                type="button"
                onClick={() => {
                  const ok = importJson(pendingImport, 'merge')
                  setMsg({ ok, text: ok ? 'Backup merged.' : 'That file is not a valid TankLab backup.' })
                  setImportMode(null)
                }}
              >
                Merge
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => {
                  const ok = importJson(pendingImport, 'replace')
                  setMsg({ ok, text: ok ? 'Backup restored.' : 'That file is not a valid TankLab backup.' })
                  setImportMode(null)
                }}
              >
                Replace all
              </button>
            </div>
            <button
              className="btn btn-ghost btn-block"
              style={{ marginTop: 10 }}
              type="button"
              onClick={() => setImportMode(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
