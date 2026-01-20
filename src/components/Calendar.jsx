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
  const [newEvent, setNewEvent] = useState({ title: '', person: 'partner1', time: '' })

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

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const getDayKey = (day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const getEventsForDay = (day) => {
    const key = getDayKey(day)
    return events.filter(e => e.date === key)
  }

  const handleDayClick = (day) => {
    setSelectedDate(day)
    setShowModal(true)
    setNewEvent({ title: '', person: 'partner1', time: '' })
  }

  const addEvent = async () => {
    if (!newEvent.title.trim() || !coupleCode) return

    try {
      const eventsRef = collection(db, 'couples', coupleCode, 'events')
      await addDoc(eventsRef, {
        date: getDayKey(selectedDate),
        title: newEvent.title,
        person: newEvent.person,
        time: newEvent.time,
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

  const renderDays = () => {
    const days = []
    const today = new Date()
    const isToday = (day) =>
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year

    // Empty cells for days before first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 md:h-28"></div>)
    }

    // Days of the month
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
                  event.person === 'partner1'
                    ? 'bg-pink-300 text-pink-800'
                    : 'bg-blue-300 text-blue-800'
                }`}
              >
                {event.time && <span className="font-medium">{event.time} </span>}
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
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-pink-100 rounded-full transition-colors text-pink-500"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-pink-600">
          {MONTHS[month]} {year}
        </h2>
        <button
          onClick={nextMonth}
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
          <span className="text-sm text-gray-600">Partner 1</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-300"></div>
          <span className="text-sm text-gray-600">Partner 2</span>
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
      <div className="grid grid-cols-7 gap-1">
        {renderDays()}
      </div>

      {/* Add Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold text-pink-600 mb-4">
              Add Event - {MONTHS[month]} {selectedDate}
            </h3>

            {/* Existing events for this day */}
            {getEventsForDay(selectedDate).length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Events on this day:</p>
                <div className="space-y-2">
                  {getEventsForDay(selectedDate).map(event => (
                    <div key={event.id} className={`flex items-center justify-between p-2 rounded-lg ${
                      event.person === 'partner1' ? 'bg-pink-100' : 'bg-blue-100'
                    }`}>
                      <span className="text-sm">
                        {event.time && <span className="font-medium">{event.time} - </span>}
                        {event.title}
                      </span>
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

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Time (optional)</label>
                <input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                  className="w-full px-4 py-2 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Who's event?</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewEvent({...newEvent, person: 'partner1'})}
                    className={`flex-1 py-2 rounded-xl font-medium transition-all ${
                      newEvent.person === 'partner1'
                        ? 'bg-pink-400 text-white'
                        : 'bg-pink-100 text-pink-600'
                    }`}
                  >
                    Partner 1
                  </button>
                  <button
                    onClick={() => setNewEvent({...newEvent, person: 'partner2'})}
                    className={`flex-1 py-2 rounded-xl font-medium transition-all ${
                      newEvent.person === 'partner2'
                        ? 'bg-blue-400 text-white'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    Partner 2
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
