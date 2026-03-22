import { useState, useEffect } from 'react'

const BG     = '#1C1C1E'
const PANEL  = '#2C2C2E'
const ACCENT = '#8B6F47'
const TEXT   = '#F5F0E8'
const MUTED  = 'rgba(245,240,232,0.45)'
const BORDER = 'rgba(245,240,232,0.07)'

export default function SettingsView() {
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved]   = useState(false)

  useEffect(() => {
    window.api.getApiKey().then(key => setApiKey(key || ''))
  }, [])

  function handleSave() {
    window.api.setApiKey(apiKey.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const masked = apiKey.length > 8
    ? apiKey.slice(0, 4) + '•'.repeat(apiKey.length - 8) + apiKey.slice(-4)
    : apiKey

  return (
    <div style={{ flex: 1, padding: '40px', color: TEXT, fontFamily: 'sans-serif', backgroundColor: BG, maxWidth: '560px' }}>
      <h1 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 600, color: TEXT }}>Settings</h1>
      <p style={{ margin: '0 0 32px', fontSize: '13px', color: MUTED }}>
        Your API key is stored locally and never sent anywhere except Anthropic's API.
      </p>

      <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: MUTED, fontWeight: 500 }}>
        Anthropic API Key
      </label>
      <input
        type="password"
        value={apiKey}
        onChange={e => { setApiKey(e.target.value); setSaved(false) }}
        placeholder="sk-ant-…"
        style={{
          width: '100%', padding: '11px 14px', borderRadius: '8px',
          border: `1px solid ${BORDER}`,
          backgroundColor: PANEL, color: TEXT, fontSize: '14px',
          boxSizing: 'border-box', marginBottom: '10px', outline: 'none',
          fontFamily: 'sans-serif'
        }}
      />

      {apiKey && (
        <p style={{ fontSize: '12px', color: MUTED, marginBottom: '16px', fontFamily: 'monospace' }}>
          {masked}
        </p>
      )}

      <button
        onClick={handleSave}
        style={{
          padding: '10px 24px', borderRadius: '8px', border: 'none',
          backgroundColor: saved ? '#5E8A3A' : ACCENT,
          color: TEXT, fontSize: '14px', cursor: 'pointer',
          fontFamily: 'sans-serif', fontWeight: 500,
          transition: 'background-color 0.2s'
        }}
      >
        {saved ? '✓ Saved' : 'Save'}
      </button>

      <div style={{ marginTop: '40px', padding: '16px', backgroundColor: PANEL, borderRadius: '8px', border: `1px solid ${BORDER}` }}>
        <p style={{ fontSize: '13px', color: MUTED, margin: 0, lineHeight: '1.6' }}>
          Get your API key at <span style={{ color: ACCENT }}>console.anthropic.com</span>.
          The Chat page uses <strong style={{ color: TEXT }}>claude-opus-4-6</strong> with your tasks as context.
        </p>
      </div>
    </div>
  )
}
