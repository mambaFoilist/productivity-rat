import { useState, useEffect, useRef } from 'react'

function Message({ role, content }) {
  const isUser = role === 'user'
  return (
    <div style={{
      display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '16px'
    }}>
      <div style={{
        maxWidth: '70%', padding: '12px 16px', borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        backgroundColor: isUser ? '#e94560' : '#16213e',
        color: 'white', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word'
      }}>
        {content}
      </div>
    </div>
  )
}

export default function ChatView({ tasks }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamText])

  useEffect(() => {
    return () => window.api.offChatListeners()
  }, [])

  async function sendMessage() {
    const text = input.trim()
    if (!text || streaming) return

    const userMessage = { role: 'user', content: text }
    const nextMessages = [...messages, userMessage]

    setMessages(nextMessages)
    setInput('')
    setStreaming(true)
    setStreamText('')
    setError(null)

    window.api.offChatListeners()

    let accumulated = ''

    window.api.onChatChunk((chunk) => {
      accumulated += chunk
      setStreamText(accumulated)
    })

    window.api.onChatDone(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: accumulated }])
      setStreamText('')
      setStreaming(false)
    })

    window.api.onChatError((msg) => {
      setError(msg)
      setStreamText('')
      setStreaming(false)
    })

    try {
      await window.api.chatSend({
        messages: nextMessages,
        tasks
      })
    } catch (err) {
      setError(err.message)
      setStreamText('')
      setStreaming(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const isEmpty = messages.length === 0 && !streamText

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', color: 'white', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '20px 32px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <h1 style={{ margin: 0, fontSize: '22px' }}>💬 AI Chat</h1>
        <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.4 }}>
          Claude has context of your {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
        {isEmpty && (
          <div style={{ textAlign: 'center', opacity: 0.3, marginTop: '80px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🐀</div>
            <p style={{ fontSize: '15px' }}>Ask me about your tasks, get help prioritizing, or just chat.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <Message key={i} role={msg.role} content={msg.content} />
        ))}

        {streamText && (
          <Message role="assistant" content={streamText + '▍'} />
        )}

        {streaming && !streamText && (
          <div style={{ display: 'flex', gap: '6px', padding: '12px 16px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#e94560',
                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`
              }} />
            ))}
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 16px', backgroundColor: 'rgba(233,69,96,0.15)', borderRadius: '8px', border: '1px solid rgba(233,69,96,0.3)', fontSize: '13px', color: '#e94560', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '16px 32px 24px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Claude… (Enter to send, Shift+Enter for newline)"
            rows={1}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: '#16213e', color: 'white', fontSize: '14px',
              resize: 'none', outline: 'none', lineHeight: '1.5',
              minHeight: '44px', maxHeight: '120px', overflowY: 'auto',
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
              padding: '12px 20px', borderRadius: '12px', border: 'none',
              backgroundColor: streaming || !input.trim() ? 'rgba(233,69,96,0.3)' : '#e94560',
              color: 'white', fontSize: '16px', cursor: streaming || !input.trim() ? 'default' : 'pointer',
              flexShrink: 0, height: '44px'
            }}
          >
            ↑
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
