import { useState, useEffect, useRef } from 'react'
import CalendarView from './components/CalendarView'
import Blackboard from './components/Blackboard'
import ChatView from './components/ChatView'
import SettingsView from './components/SettingsView'

const PRIORITIES = ['Today', 'This Week', 'This Month', 'Someday']

const PRIORITY_COLORS = {
  Today: '#e94560',
  'This Week': '#f5a623',
  'This Month': '#7ed321',
  Someday: '#9b59b6'
}

const sidebarStyle = {
  width: '200px',
  minHeight: '100vh',
  backgroundColor: '#12122a',
  padding: '32px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  flexShrink: 0
}

const navBtnBase = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 14px',
  borderRadius: '8px',
  border: 'none',
  fontSize: '15px',
  cursor: 'pointer',
  fontFamily: 'sans-serif',
  width: '100%',
  textAlign: 'left'
}

function Sidebar({ page, setPage }) {
  const items = [
    { id: 'tasks', label: 'Tasks', icon: '✅' },
    { id: 'calendar', label: 'Calendar', icon: '🗓' },
    { id: 'blackboard', label: 'Blackboard', icon: '🖊' },
    { id: 'chat', label: 'AI Chat', icon: '💬' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ]
  return (
    <div style={sidebarStyle}>
      <div style={{ color: 'white', fontFamily: 'sans-serif', fontWeight: 700, fontSize: '18px', marginBottom: '16px', paddingLeft: '4px' }}>
        🐀 ProdRat
      </div>
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => setPage(item.id)}
          style={{
            ...navBtnBase,
            backgroundColor: page === item.id ? '#e94560' : 'transparent',
            color: page === item.id ? 'white' : 'rgba(255,255,255,0.6)'
          }}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )
}

function TasksView({ tasks, setTasks }) {
  const [input, setInput] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('Someday')
  const [filter, setFilter] = useState('All')

  function addTask() {
    if (input.trim() === '') return
    setTasks([...tasks, { id: Date.now(), title: input, done: false, dueDate, priority }])
    setInput('')
    setDueDate('')
    setPriority('Someday')
  }

  function toggleTask(id) {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  function deleteTask(id) {
    setTasks(tasks.filter(t => t.id !== id))
  }

  const filtered = tasks.filter(t => {
    if (filter === 'Active') return !t.done
    if (filter === 'Completed') return t.done
    return true
  })

  return (
    <div style={{ flex: 1, padding: '40px', overflow: 'auto', color: 'white', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: '24px' }}>✅ Tasks</h1>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
          placeholder="Add a task..."
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontSize: '16px' }}
        />
        <button onClick={addTask} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#e94560', color: 'white', fontSize: '16px', cursor: 'pointer' }}>
          Add
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <select
          value={priority}
          onChange={e => setPriority(e.target.value)}
          style={{ padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: '#16213e', color: 'white', fontSize: '14px', cursor: 'pointer' }}
        >
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          style={{ padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: '#16213e', color: 'white', fontSize: '14px', cursor: 'pointer' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['All', 'Active', 'Completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 16px', borderRadius: '20px', border: 'none', fontSize: '14px', cursor: 'pointer',
              backgroundColor: filter === f ? '#e94560' : '#16213e',
              color: 'white'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.map(task => (
        <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', marginBottom: '8px', backgroundColor: '#16213e', borderRadius: '8px' }}>
          <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} />
          <span style={{ flex: 1, textDecoration: task.done ? 'line-through' : 'none', opacity: task.done ? 0.5 : 1 }}>
            {task.title}
          </span>
          {task.priority && (
            <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '12px', backgroundColor: PRIORITY_COLORS[task.priority] || '#555', color: 'white', whiteSpace: 'nowrap' }}>
              {task.priority}
            </span>
          )}
          {task.dueDate && (
            <span style={{ fontSize: '12px', opacity: 0.6, whiteSpace: 'nowrap' }}>
              {task.dueDate}
            </span>
          )}
          <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', color: '#e94560', cursor: 'pointer', fontSize: '18px' }}>
            ✕
          </button>
        </div>
      ))}

      {filtered.length === 0 && <p style={{ opacity: 0.4 }}>No tasks here.</p>}
    </div>
  )
}

export default function App() {
  const [tasks, setTasks] = useState([])
  const [page, setPage] = useState('tasks')
  const loaded = useRef(false)

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
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#1a1a2e' }}>
      <Sidebar page={page} setPage={setPage} />
      {page === 'tasks' && <TasksView tasks={tasks} setTasks={setTasks} />}
      {page === 'calendar' && <CalendarView tasks={tasks} />}
      {page === 'blackboard' && <Blackboard />}
      {page === 'chat' && <ChatView tasks={tasks} />}
      {page === 'settings' && <SettingsView />}
    </div>
  )
}
