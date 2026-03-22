import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'

const PRIORITY_COLORS = {
  Today:        '#C94B4B',
  'This Week':  '#C4873A',
  'This Month': '#5E8A3A',
  Someday:      '#7B68EE'
}

export default function CalendarView({ tasks }) {
  const events = tasks
    .filter(t => t.dueDate)
    .map(t => ({
      id: String(t.id),
      title: t.title,
      date: t.dueDate,
      backgroundColor: PRIORITY_COLORS[t.priority] || '#555',
      borderColor: 'transparent',
      textColor: '#fff',
      classNames: t.done ? ['fc-event-done'] : []
    }))

  return (
    <div style={{ flex: 1, padding: '40px', overflow: 'auto', backgroundColor: '#1C1C1E', fontFamily: 'sans-serif' }}>
      <h1 style={{ margin: '0 0 28px', fontSize: '22px', fontWeight: 600, color: '#F5F0E8' }}>Calendar</h1>
      <div style={{ backgroundColor: '#2C2C2E', borderRadius: '12px', padding: '24px', border: '1px solid rgba(245,240,232,0.07)' }}>
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
