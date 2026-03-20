import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'

const PRIORITY_COLORS = {
  Today: '#e94560',
  'This Week': '#f5a623',
  'This Month': '#7ed321',
  Someday: '#9b59b6'
}

export default function CalendarView({ tasks }) {
  const events = tasks
    .filter(t => t.dueDate)
    .map(t => ({
      id: String(t.id),
      title: t.title,
      date: t.dueDate,
      backgroundColor: PRIORITY_COLORS[t.priority] || '#555',
      borderColor: PRIORITY_COLORS[t.priority] || '#555',
      textColor: '#fff',
      classNames: t.done ? ['fc-event-done'] : []
    }))

  return (
    <div style={{ padding: '40px', flex: 1, overflow: 'auto' }}>
      <h1 style={{ color: 'white', fontFamily: 'sans-serif', marginBottom: '24px' }}>🗓 Calendar</h1>
      <div style={{ backgroundColor: '#16213e', borderRadius: '12px', padding: '20px' }}>
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          events={events}
          height="auto"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,dayGridWeek' }}
        />
      </div>
    </div>
  )
}
