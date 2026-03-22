import { useState, useEffect, useRef } from 'react'
import CalendarView from './components/CalendarView'
import Blackboard from './components/Blackboard'
import ChatView from './components/ChatView'
import SettingsView from './components/SettingsView'
import RatMascot from './components/RatMascot'
import notepadIcon from './assets/notepad_icon.png'
import calendarIcon from './assets/calendar_icon.png'
import blackboardIcon from './assets/blackboard_icon.png'
import chatIcon from './assets/chat_icon.png'
import settingsIcon from './assets/settings_icon.png'

const BG      = '#1C1C1E'
const PANEL   = '#2C2C2E'
const ACCENT  = '#8B6F47'
const TEXT    = '#F5F0E8'
const MUTED   = 'rgba(245,240,232,0.45)'
const BORDER  = 'rgba(245,240,232,0.07)'

const PRIORITIES = ['Today', 'This Week', 'This Month', 'Someday']

const PRIORITY_COLORS = {
  Today:        '#C94B4B',
  'This Week':  '#C4873A',
  'This Month': '#5E8A3A',
  Someday:      '#7B68EE'
}

function Sidebar({ page, setPage }) {
  const items = [
    { id: 'tasks',      label: 'Tasks',      icon: notepadIcon },
    { id: 'calendar',   label: 'Calendar',   icon: calendarIcon },
    { id: 'blackboard', label: 'Blackboard', icon: blackboardIcon },
    { id: 'chat',       label: 'AI Chat',    icon: chatIcon },
    { id: 'settings',   label: 'Settings',   icon: settingsIcon }
  ]
  return (
    <div style={{
      width: '200px', minHeight: '100vh',
      backgroundColor: '#161618',
      borderRight: `1px solid ${BORDER}`,
      padding: '28px 12px',
      display: 'flex', flexDirection: 'column', gap: '4px',
      flexShrink: 0
    }}>
      <div style={{ color: TEXT, fontFamily: 'sans-serif', fontWeight: 700, fontSize: '17px', marginBottom: '20px', paddingLeft: '8px' }}>
        🐀 ProdRat
      </div>
      {items.map(item => {
        const active = page === item.id
        return (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 12px', borderRadius: '8px', border: 'none',
              fontSize: '14px', cursor: 'pointer', fontFamily: 'sans-serif',
              width: '100%', textAlign: 'left',
              backgroundColor: active ? ACCENT : 'transparent',
              color: active ? TEXT : MUTED,
              transition: 'background-color 0.15s, color 0.15s'
            }}
          >
            <img src={item.icon} alt="" style={{ width: '28px', height: '28px', imageRendering: 'pixelated', flexShrink: 0, opacity: active ? 1 : 0.6 }} />
            <span>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function TasksView({ tasks, setTasks, onTaskComplete }) {
  const [input, setInput]       = useState('')
  const [dueDate, setDueDate]   = useState('')
  const [priority, setPriority] = useState('Someday')
  const [filter, setFilter]     = useState('All')

  function addTask() {
    if (!input.trim()) return
    setTasks([...tasks, { id: Date.now(), title: input, done: false, dueDate, priority }])
    setInput('')
    setDueDate('')
    setPriority('Someday')
  }

  function toggleTask(id) {
    const task = tasks.find(t => t.id === id)
    if (task && !task.done) onTaskComplete()
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  function deleteTask(id) {
    setTasks(tasks.filter(t => t.id !== id))
  }

  const filtered = tasks.filter(t => {
    if (filter === 'Active')    return !t.done
    if (filter === 'Completed') return t.done
    return true
  })

  const inputStyle = {
    padding: '10px 14px', borderRadius: '8px',
    border: `1px solid ${BORDER}`,
    backgroundColor: PANEL, color: TEXT,
    fontSize: '14px', fontFamily: 'sans-serif', outline: 'none'
  }

  return (
    <div style={{ flex: 1, padding: '40px', overflow: 'auto', color: TEXT, fontFamily: 'sans-serif', backgroundColor: BG }}>
      <h1 style={{ margin: '0 0 28px', fontSize: '22px', fontWeight: 600, color: TEXT }}>Tasks</h1>

      {/* Add task row */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
          placeholder="Add a task…"
          style={{ ...inputStyle, flex: 1 }}
        />
        <button
          onClick={addTask}
          style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: ACCENT, color: TEXT, fontSize: '14px', cursor: 'pointer', fontFamily: 'sans-serif', fontWeight: 500 }}
        >
          Add
        </button>
      </div>

      {/* Priority + date row */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <select
          value={priority}
          onChange={e => setPriority(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer', colorScheme: 'dark' }}
        />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {['All', 'Active', 'Completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '5px 14px', borderRadius: '20px', border: 'none',
              fontSize: '13px', cursor: 'pointer', fontFamily: 'sans-serif',
              backgroundColor: filter === f ? ACCENT : PANEL,
              color: filter === f ? TEXT : MUTED,
              transition: 'background-color 0.15s'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Task list */}
      {filtered.map(task => (
        <div
          key={task.id}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 14px', marginBottom: '6px',
            backgroundColor: PANEL, borderRadius: '8px',
            border: `1px solid ${BORDER}`
          }}
        >
          <input
            type="checkbox"
            checked={task.done}
            onChange={() => toggleTask(task.id)}
            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: ACCENT, flexShrink: 0 }}
          />
          <span style={{ flex: 1, fontSize: '14px', textDecoration: task.done ? 'line-through' : 'none', opacity: task.done ? 0.4 : 1, color: TEXT }}>
            {task.title}
          </span>
          {task.priority && (
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: PRIORITY_COLORS[task.priority] || '#555', color: '#fff', whiteSpace: 'nowrap', fontWeight: 500 }}>
              {task.priority}
            </span>
          )}
          {task.dueDate && (
            <span style={{ fontSize: '12px', color: MUTED, whiteSpace: 'nowrap' }}>
              {task.dueDate}
            </span>
          )}
          <button
            onClick={() => deleteTask(task.id)}
            style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: '16px', padding: '0 2px', lineHeight: 1, flexShrink: 0 }}
          >
            ✕
          </button>
        </div>
      ))}

      {filtered.length === 0 && (
        <p style={{ color: MUTED, fontSize: '14px' }}>No tasks here.</p>
      )}
    </div>
  )
}

export default function App() {
  const [tasks, setTasks]     = useState([])
  const [page, setPage]       = useState('tasks')
  const [bouncing, setBouncing] = useState(false)
  const loaded = useRef(false)

  function triggerBounce() {
    setBouncing(s => !s)
  }

  useEffect(() => {
    window.api.onTasksUpdated((updatedTasks) => setTasks(updatedTasks))
    return () => window.api.offTasksUpdated()
  }, [])

  useEffect(() => {
    window.api.getTasks().then(saved => {
      setTasks(saved)
      loaded.current = true
    })
  }, [])

  useEffect(() => {
    if (!loaded.current) return
    window.api.setTasks(tasks)
  }, [tasks])

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', backgroundColor: BG, overflow: 'hidden' }}>
      <Sidebar page={page} setPage={setPage} />
      {page === 'tasks'      && <TasksView tasks={tasks} setTasks={setTasks} onTaskComplete={triggerBounce} />}
      {page === 'calendar'   && <CalendarView tasks={tasks} />}
      {page === 'blackboard' && <Blackboard />}
      {page === 'chat'       && <ChatView tasks={tasks} />}
      {page === 'settings'   && <SettingsView />}
      <RatMascot page={page} bouncing={bouncing} />
    </div>
  )
}
