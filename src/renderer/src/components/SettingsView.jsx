import { useState, useEffect } from 'react'

export default function SettingsView() {
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)

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
    <div style={{ flex: 1, padding: '40px', color: 'white', fontFamily: 'sans-serif', maxWidth: '600px' }}>
      <h1 style={{ marginBottom: '8px' }}>⚙️ Settings</h1>
      <p style={{ opacity: 0.5, marginBottom: '32px', fontSize: '14px' }}>
        Your API key is stored locally and never sent anywhere except Anthropic's API.
      </p>

      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', opacity: 0.7 }}>
        Anthropic API Key
      </label>
      <input
        type="password"
        value={apiKey}
        onChange={e => { setApiKey(e.target.value); setSaved(false) }}
        placeholder="sk-ant-..."
        style={{
          width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
          backgroundColor: '#16213e', color: 'white', fontSize: '15px', boxSizing: 'border-box', marginBottom: '12px'
        }}
      />
      {apiKey && (
        <p style={{ fontSize: '12px', opacity: 0.4, marginBottom: '16px', fontFamily: 'monospace' }}>
          {masked}
        </p>
      )}
      <button
        onClick={handleSave}
        style={{
          padding: '10px 24px', borderRadius: '8px', border: 'none',
          backgroundColor: saved ? '#7ed321' : '#e94560',
          color: 'white', fontSize: '15px', cursor: 'pointer', transition: 'background-color 0.2s'
        }}
      >
        {saved ? '✓ Saved' : 'Save'}
      </button>

      <div style={{ marginTop: '48px', padding: '16px', backgroundColor: '#16213e', borderRadius: '8px' }}>
        <p style={{ fontSize: '13px', opacity: 0.5, margin: 0, lineHeight: '1.6' }}>
          Get your API key at <span style={{ color: '#e94560' }}>console.anthropic.com</span>.
          The Chat page uses <strong>claude-opus-4-6</strong> with your tasks as context.
        </p>
      </div>
    </div>
  )
}
