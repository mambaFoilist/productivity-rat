import { useState, useEffect, useRef } from 'react'

const BG     = '#1C1C1E'
const PANEL  = '#2C2C2E'
const ACCENT = '#8B6F47'
const TEXT   = '#F5F0E8'
const MUTED  = 'rgba(245,240,232,0.45)'
const BORDER = 'rgba(245,240,232,0.07)'

const TOOL_LABELS = { create_task: 'Created task', complete_task: 'Completed task', delete_task: 'Deleted task' }

function ToolCard({ name, label, ok }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 12px' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '7px',
        padding: '4px 12px', borderRadius: '20px', fontSize: '12px',
        backgroundColor: ok ? 'rgba(94,138,58,0.15)' : 'rgba(201,75,75,0.15)',
        border: `1px solid ${ok ? 'rgba(94,138,58,0.35)' : 'rgba(201,75,75,0.35)'}`,
        color: ok ? '#7ab55c' : '#c94b4b'
      }}>
        <span style={{ fontSize: '11px', opacity: 0.8 }}>{TOOL_LABELS[name] ?? name}</span>
        <span>·</span>
        <span>{label}</span>
      </div>
    </div>
  )
}

function Bubble({ role, content }) {
  const isUser = role === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
      <div style={{
        maxWidth: '72%', padding: '10px 15px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        backgroundColor: isUser ? ACCENT : PANEL,
        color: TEXT, fontSize: '14px', lineHeight: '1.6',
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        border: isUser ? 'none' : `1px solid ${BORDER}`
      }}>
        {content}
      </div>
    </div>
  )
}

function ThinkingDots() {
  return (
    <div style={{ display: 'flex', gap: '5px', padding: '8px 4px', marginBottom: '12px' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: '7px', height: '7px', borderRadius: '50%', backgroundColor: ACCENT,
          animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`
        }} />
      ))}
    </div>
  )
}

export default function ChatView({ tasks }) {
  const [uiItems, setUiItems]       = useState([])
  const [input, setInput]           = useState('')
  const [streaming, setStreaming]   = useState(false)
  const [streamText, setStreamText] = useState('')
  const [error, setError]           = useState(null)

  const bottomRef   = useRef(null)
  const accRef      = useRef('')   // text accumulated in current segment
  const totalAccRef = useRef('')   // all text across all segments this turn
  const apiMsgRef   = useRef([])   // API conversation history — mutated directly, not state

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [uiItems, streamText])

  useEffect(() => () => window.api.offChatListeners(), [])

  async function sendMessage() {
    const text = input.trim()
    if (!text || streaming) return

    const newUserApiMsg = { role: 'user', content: text }
    const sendMessages  = [...apiMsgRef.current, newUserApiMsg]

    setUiItems(prev => [...prev, { type: 'user', content: text }])
    setInput('')
    setStreaming(true)
    setStreamText('')
    setError(null)
    accRef.current      = ''
    totalAccRef.current = ''

    window.api.offChatListeners()

    window.api.onChatChunk((chunk) => {
      accRef.current      += chunk
      totalAccRef.current += chunk
      setStreamText(accRef.current)
    })

    window.api.onChatSegmentEnd(() => {
      // Capture before clearing — the functional updater runs after this
      // synchronous block, so the ref would be empty by then otherwise.
      const seg = accRef.current
      accRef.current = ''
      setStreamText('')
      if (seg.trim()) {
        setUiItems(prev => [...prev, { type: 'assistant', content: seg }])
      }
    })

    window.api.onChatToolUse(({ name, label, ok }) => {
      setUiItems(prev => [...prev, { type: 'tool', name, label, ok }])
    })

    window.api.onChatDone(() => {
      // Capture both refs before clearing for the same reason.
      const finalText = accRef.current
      const totalText = totalAccRef.current
      accRef.current      = ''
      totalAccRef.current = ''
      setStreamText('')
      setStreaming(false)
      if (finalText.trim()) {
        setUiItems(prev => [...prev, { type: 'assistant', content: finalText }])
      }
      // Mutate the ref directly — no need for apiMessages as React state.
      apiMsgRef.current = [...apiMsgRef.current, newUserApiMsg, { role: 'assistant', content: totalText }]
    })

    window.api.onChatError((msg) => {
      accRef.current      = ''
      totalAccRef.current = ''
      setStreamText('')
      setStreaming(false)
      setError(msg)
    })

    try {
      await window.api.chatSend({ messages: sendMessages })
    } catch (err) {
      setError(err.message ?? String(err))
      setStreamText('')
      setStreaming(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const isEmpty = uiItems.length === 0 && !streamText && !streaming

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', color: TEXT, fontFamily: 'sans-serif', backgroundColor: BG }}>

      {/* Header */}
      <div style={{ padding: '20px 32px 14px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 600, color: TEXT }}>AI Chat</h1>
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: MUTED }}>
          Claude can read and manage your {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Message list */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '24px 32px' }}>

        {isEmpty && (
          <div style={{ textAlign: 'center', color: MUTED, marginTop: '80px' }}>
            <div style={{ fontSize: '38px', marginBottom: '12px' }}>🐀</div>
            <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
              Ask me to add a task, complete something, or help you prioritise your day.
            </p>
          </div>
        )}

        {uiItems.map((item, i) => {
          if (item.type === 'tool')      return <ToolCard key={i} {...item} />
          if (item.type === 'user')      return <Bubble key={i} role="user"      content={item.content} />
          if (item.type === 'assistant') return <Bubble key={i} role="assistant" content={item.content} />
          return null
        })}

        {streamText  && <Bubble role="assistant" content={streamText + '▍'} />}
        {streaming && !streamText && <ThinkingDots />}

        {error && (
          <div style={{
            padding: '11px 14px', borderRadius: '8px', fontSize: '13px',
            backgroundColor: 'rgba(201,75,75,0.12)', border: '1px solid rgba(201,75,75,0.3)',
            color: '#c94b4b', marginBottom: '14px'
          }}>
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{ padding: '14px 32px 22px', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Claude… (Enter to send, Shift+Enter for newline)"
            rows={1}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: '10px',
              border: `1px solid ${BORDER}`,
              backgroundColor: PANEL, color: TEXT, fontSize: '14px',
              resize: 'none', outline: 'none', lineHeight: '1.5',
              minHeight: '42px', maxHeight: '120px', overflowY: 'auto',
              fontFamily: 'sans-serif'
            }}
            onInput={e => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={streaming || !input.trim()}
            style={{
              padding: '10px 16px', borderRadius: '10px', border: 'none',
              backgroundColor: streaming || !input.trim() ? 'rgba(139,111,71,0.3)' : ACCENT,
              color: TEXT, fontSize: '16px',
              cursor: streaming || !input.trim() ? 'default' : 'pointer',
              flexShrink: 0, height: '42px'
            }}
          >↑</button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
