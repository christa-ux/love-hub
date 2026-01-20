import { useState } from 'react'
import { useCouple } from '../context/CoupleContext'

function JoinCouple() {
  const [code, setCode] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const { joinCouple } = useCouple()

  const generateCode = () => {
    const words = ['love', 'heart', 'star', 'moon', 'sun', 'rose', 'dream', 'hope', 'joy', 'kiss']
    const word1 = words[Math.floor(Math.random() * words.length)]
    const word2 = words[Math.floor(Math.random() * words.length)]
    const num = Math.floor(Math.random() * 100)
    return `${word1}-${word2}-${num}`
  }

  const handleCreate = () => {
    const newCode = generateCode()
    setCode(newCode)
    setIsCreating(true)
  }

  const handleJoin = () => {
    if (code.trim()) {
      joinCouple(code)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">💕</div>
          <h1 className="text-3xl font-bold text-pink-500 mb-2">Our Love Hub</h1>
          <p className="text-pink-400">Your shared space for love</p>
        </div>

        {!isCreating ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Enter your couple code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g., love-star-42"
                className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-center text-lg"
                onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
              />
            </div>

            <button
              onClick={handleJoin}
              disabled={!code.trim()}
              className="w-full py-3 bg-pink-400 text-white rounded-xl font-semibold hover:bg-pink-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Join My Partner
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-pink-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/80 text-pink-400">or</span>
              </div>
            </div>

            <button
              onClick={handleCreate}
              className="w-full py-3 border-2 border-pink-300 text-pink-500 rounded-xl font-semibold hover:bg-pink-50 transition-colors"
            >
              Create New Couple Space
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-pink-50 rounded-xl p-4 text-center">
              <p className="text-sm text-pink-400 mb-2">Your couple code is:</p>
              <p className="text-2xl font-bold text-pink-600 select-all">{code}</p>
            </div>

            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-sm text-amber-700">
                <strong>Share this code with your partner!</strong> You'll both use this same code to access your shared calendar and notes.
              </p>
            </div>

            <button
              onClick={handleJoin}
              className="w-full py-3 bg-pink-400 text-white rounded-xl font-semibold hover:bg-pink-500 transition-colors"
            >
              Enter Our Space
            </button>

            <button
              onClick={() => setIsCreating(false)}
              className="w-full py-2 text-pink-400 hover:text-pink-600 transition-colors text-sm"
            >
              Back
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          Your data syncs in real-time between you and your partner
        </p>
      </div>
    </div>
  )
}

export default JoinCouple
