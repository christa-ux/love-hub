import { useState } from 'react'
import { CoupleProvider, useCouple } from './context/CoupleContext'
import Calendar from './components/Calendar'
import Ideas from './components/Ideas'
import JoinCouple from './components/JoinCouple'

function MainApp() {
  const [activeTab, setActiveTab] = useState('calendar')
  const { coupleCode, leaveCouple } = useCouple()

  if (!coupleCode) {
    return <JoinCouple />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-sm shadow-sm border-b border-pink-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1"></div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-pink-500">
                Our Love Hub
              </h1>
              <p className="text-pink-400 text-sm mt-1">Together, always</p>
            </div>
            <div className="flex-1 flex justify-end">
              <button
                onClick={leaveCouple}
                className="text-xs text-pink-300 hover:text-pink-500 transition-colors"
                title="Leave couple space"
              >
                {coupleCode}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex gap-2 bg-white/50 p-1 rounded-2xl shadow-sm">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'calendar'
                ? 'bg-pink-400 text-white shadow-md'
                : 'text-pink-500 hover:bg-pink-100'
            }`}
          >
            Our Calendar
          </button>
          <button
            onClick={() => setActiveTab('ideas')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'ideas'
                ? 'bg-pink-400 text-white shadow-md'
                : 'text-pink-500 hover:bg-pink-100'
            }`}
          >
            Our Life
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pb-8">
        {activeTab === 'calendar' ? <Calendar /> : <Ideas />}
      </main>
    </div>
  )
}

function App() {
  return (
    <CoupleProvider>
      <MainApp />
    </CoupleProvider>
  )
}

export default App
