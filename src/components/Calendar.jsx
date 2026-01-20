import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, addDoc, deleteDoc, doc, onSnapshot, query } from 'firebase/firestore'
import { useCouple } from '../context/CoupleContext'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function Calendar() {
  const { coupleCode } = useCouple()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [viewMode, setViewMode] = useState('month') // 'month' or 'week'
  const [newEvent, setNewEvent] = useState({ title: '', person: 'koukou', startDate: '', endDate: '', startTime: '', endTime: '' })

  // Subscribe to real-time updates from Firebase
  useEffect(() => {
    if (!coupleCode) return

    const eventsRef = collection(db, 'couples', coupleCode, 'events')
    const q = query(eventsRef)

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setEvents(eventsData)
      setLoading(false)
    }, (error) => {
      console.error('Error fetching events:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [coupleCode])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Navigation functions
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const prevWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  const nextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  const getDateKey = (date) => {
    const y = date.getFullYear()
    const m = date.getMonth() + 1
    const d = date.getDate()
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  const getDayKey = (day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const getEventsForDateKey = (key) => {
    return events.filter(e => {
      if (e.startDate && e.endDate) {
        return key >= e.startDate && key <= e.endDate
      }
      return e.date === key || e.startDate === key
    })
  }

  const getEventsForDay = (day) => {
    const key = getDayKey(day)
    return getEventsForDateKey(key)
  }

  const handleDayClick = (day) => {
    setSelectedDate(day)
    const dateKey = getDayKey(day)
    setShowModal(true)
    setNewEvent({ title: '', person: 'koukou', startDate: dateKey, endDate: '', startTime: '', endTime: '' })
  }

  const handleDateClick = (date) => {
    const dateKey = getDateKey(date)
    setSelectedDate(date.getDate())
    setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1))
    setShowModal(true)
    setNewEvent({ title: '', person: 'koukou', startDate: dateKey, endDate: '', startTime: '', endTime: '' })
  }

  const addEvent = async () => {
    if (!newEvent.title.trim() || !coupleCode || !newEvent.startDate) return

    try {
      const eventsRef = collection(db, 'couples', coupleCode, 'events')
      await addDoc(eventsRef, {
        date: newEvent.startDate,
        startDate: newEvent.startDate,
        endDate: newEvent.endDate || newEvent.startDate,
        title: newEvent.title,
        person: newEvent.person,
        startTime: newEvent.startTime,
        endTime: newEvent.endTime,
        time: newEvent.startTime,
        createdAt: new Date().toISOString()
      })
      setShowModal(false)
    } catch (error) {
      console.error('Error adding event:', error)
    }
  }

  const deleteEvent = async (id) => {
    if (!coupleCode) return

    try {
      const eventRef = doc(db, 'couples', coupleCode, 'events', id)
      await deleteDoc(eventRef)
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return ''
    const [y, m, d] = dateStr.split('-')
    return `${MONTHS[parseInt(m) - 1]} ${parseInt(d)}`
  }

  // Get the week containing currentDate
  const getWeekDates = () => {
    const dates = []
    const dayOfWeek = currentDate.getDay()
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - dayOfWeek)

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const getWeekRangeText = () => {
    const weekDates = getWeekDates()
    const start = weekDates[0]
    const end = weekDates[6]

    if (start.getMonth() === end.getMonth()) {
      return `${MONTHS[start.getMonth()]} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`
    } else {
      return `${MONTHS[start.getMonth()]} ${start.getDate()} - ${MONTHS[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`
    }
  }

  const renderWeekView = () => {
    const weekDates = getWeekDates()
    const today = new Date()

    return (
      <div className="grid grid-cols-7 gap-1">
        {weekDates.map((date, index) => {
          const dateKey = getDateKey(date)
          const dayEvents = getEventsForDateKey(dateKey)
          const isToday = date.toDateString() === today.toDateString()

          return (
            <div
              key={index}
              onClick={() => handleDateClick(date)}
              className={`min-h-[140px] md:min-h-[180px] p-2 border border-pink-100 rounded-lg cursor-pointer transition-all hover:bg-pink-50 hover:shadow-md ${
                isToday ? 'bg-pink-100 ring-2 ring-pink-400' : 'bg-white/60'
              }`}
            >
              <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-pink-600' : 'text-gray-600'}`}>
                <span className="block text-xs text-gray-400">{DAYS[index]}</span>
                {date.getDate()}
                {date.getDate() === 1 && <span className="text-xs ml-1">{MONTHS[date.getMonth()].slice(0, 3)}</span>}
              </div>
              <div className="space-y-1 overflow-hidden">
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    className={`text-xs px-1 py-0.5 rounded truncate ${
                      event.person === 'koukou'
                        ? 'bg-pink-300 text-pink-800'
                        : 'bg-blue-300 text-blue-800'
                    }`}
                  >
                    {(event.startTime || event.time) && <span className="font-medium">{event.startTime || event.time} </span>}
                    {event.title}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderMonthView = () => {
    const days = []
    const today = new Date()
    const isToday = (day) =>
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 md:h-28"></div>)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDay(day)
      days.push(
        <div
          key={day}
          onClick={() => handleDayClick(day)}
          className={`h-24 md:h-28 p-1 border border-pink-100 rounded-lg cursor-pointer transition-all hover:bg-pink-50 hover:shadow-md ${
            isToday(day) ? 'bg-pink-100 ring-2 ring-pink-400' : 'bg-white/60'
          }`}
        >
          <div className={`text-sm font-semibold mb-1 ${isToday(day) ? 'text-pink-600' : 'text-gray-600'}`}>
            {day}
          </div>
          <div className="space-y-0.5 overflow-hidden">
            {dayEvents.slice(0, 3).map(event => (
              <div
                key={event.id}
                className={`text-xs px-1 py-0.5 rounded truncate ${
                  event.person === 'koukou'
                    ? 'bg-pink-300 text-pink-800'
                    : 'bg-blue-300 text-blue-800'
                }`}
              >
                {(event.startTime || event.time) && <span className="font-medium">{event.startTime || event.time} </span>}
                {event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-pink-400">+{dayEvents.length - 3} more</div>
            )}
          </div>
        </div>
      )
    }
    return days
  }

  if (loading) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-8 text-center">
        <div className="animate-pulse text-pink-400">Loading your calendar...</div>
      </div>
    )
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-4 md:p-6">
      {/* View Toggle */}
      <div className="flex justify-center mb-4">
        <div className="flex bg-pink-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'month'
                ? 'bg-white text-pink-600 shadow-sm'
                : 'text-pink-400 hover:text-pink-600'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'week'
                ? 'bg-white text-pink-600 shadow-sm'
                : 'text-pink-400 hover:text-pink-600'
            }`}
          >
            Week
          </button>
        </div>
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={viewMode === 'month' ? prevMonth : prevWeek}
          className="p-2 hover:bg-pink-100 rounded-full transition-colors text-pink-500"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-pink-600">
          {viewMode === 'month' ? `${MONTHS[month]} ${year}` : getWeekRangeText()}
        </h2>
        <button
          onClick={viewMode === 'month' ? nextMonth : nextWeek}
          className="p-2 hover:bg-pink-100 rounded-full transition-colors text-pink-500"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 justify-center">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-pink-300"></div>
          <span className="text-sm text-gray-600">Koukou</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-300"></div>
          <span className="text-sm text-gray-600">Ruru</span>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map(day => (
          <div key={day} className="text-center text-sm font-semibold text-pink-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      {viewMode === 'month' ? (
        <div className="grid grid-cols-7 gap-1">
          {renderMonthView()}
        </div>
      ) : (
        renderWeekView()
      )}

      {/* Add Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-pink-600 mb-4">
              Add Event
            </h3>

            {/* Existing events for this day */}
            {getEventsForDay(selectedDate).length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Events on this day:</p>
                <div className="space-y-2">
                  {getEventsForDay(selectedDate).map(event => (
                    <div key={event.id} className={`flex items-center justify-between p-2 rounded-lg ${
                      event.person === 'koukou' ? 'bg-pink-100' : 'bg-blue-100'
                    }`}>
                      <div className="text-sm">
                        <div className="font-medium">{event.title}</div>
                        <div className="text-xs text-gray-500">
                          {(event.startTime || event.time) && `${event.startTime || event.time}${event.endTime ? ` - ${event.endTime}` : ''} | `}
                          {formatDateDisplay(event.startDate)}
                          {event.endDate && event.endDate !== event.startDate && ` to ${formatDateDisplay(event.endDate)}`}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteEvent(event.id)}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Event Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  placeholder="e.g., Dinner date, Work meeting..."
                  className="w-full px-4 py-2 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newEvent.startDate}
                    onChange={(e) => setNewEvent({...newEvent, startDate: e.target.value})}
                    className="w-full px-4 py-2 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">End Date <span className="text-gray-400">(optional)</span></label>
                  <input
                    type="date"
                    value={newEvent.endDate}
                    onChange={(e) => setNewEvent({...newEvent, endDate: e.target.value})}
                    min={newEvent.startDate}
                    className="w-full px-4 py-2 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Start Time <span className="text-gray-400">(optional)</span></label>
                  <input
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({...newEvent, startTime: e.target.value})}
                    className="w-full px-4 py-2 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">End Time <span className="text-gray-400">(optional)</span></label>
                  <input
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})}
                    className="w-full px-4 py-2 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Who's event?</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewEvent({...newEvent, person: 'koukou'})}
                    className={`flex-1 py-2 rounded-xl font-medium transition-all ${
                      newEvent.person === 'koukou'
                        ? 'bg-pink-400 text-white'
                        : 'bg-pink-100 text-pink-600'
                    }`}
                  >
                    Koukou
                  </button>
                  <button
                    onClick={() => setNewEvent({...newEvent, person: 'ruru'})}
                    className={`flex-1 py-2 rounded-xl font-medium transition-all ${
                      newEvent.person === 'ruru'
                        ? 'bg-blue-400 text-white'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    Ruru
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-pink-300 text-pink-500 rounded-xl font-medium hover:bg-pink-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addEvent}
                  className="flex-1 py-2 bg-pink-400 text-white rounded-xl font-medium hover:bg-pink-500 transition-colors"
                >
                  Add Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar
