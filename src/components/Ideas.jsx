import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query } from 'firebase/firestore'
import { useCouple } from '../context/CoupleContext'

const CATEGORIES = [
  { id: 'dates', label: 'Date Ideas', icon: '💕', color: 'pink' },
  { id: 'gifts', label: 'Gift Ideas', icon: '🎁', color: 'purple' },
  { id: 'bucket', label: 'Bucket List', icon: '✨', color: 'yellow' },
  { id: 'notes', label: 'Love Notes', icon: '💌', color: 'rose' }
]

function Ideas() {
  const { coupleCode } = useCouple()
  const [activeCategory, setActiveCategory] = useState('dates')
  const [items, setItems] = useState({
    dates: [],
    gifts: [],
    bucket: [],
    notes: []
  })
  const [loading, setLoading] = useState(true)
  const [newItem, setNewItem] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')

  // Subscribe to real-time updates for all categories
  useEffect(() => {
    if (!coupleCode) return

    const unsubscribes = CATEGORIES.map(cat => {
      const itemsRef = collection(db, 'couples', coupleCode, cat.id)
      const q = query(itemsRef)

      return onSnapshot(q, (snapshot) => {
        const itemsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setItems(prev => ({
          ...prev,
          [cat.id]: itemsData
        }))
        setLoading(false)
      }, (error) => {
        console.error(`Error fetching ${cat.id}:`, error)
        setLoading(false)
      })
    })

    return () => unsubscribes.forEach(unsub => unsub())
  }, [coupleCode])

  const addItem = async () => {
    if (!newItem.trim() || !coupleCode) return

    try {
      const itemsRef = collection(db, 'couples', coupleCode, activeCategory)
      await addDoc(itemsRef, {
        text: newItem,
        completed: false,
        createdAt: new Date().toISOString()
      })
      setNewItem('')
    } catch (error) {
      console.error('Error adding item:', error)
    }
  }

  const toggleComplete = async (item) => {
    if (!coupleCode) return

    try {
      const itemRef = doc(db, 'couples', coupleCode, activeCategory, item.id)
      await updateDoc(itemRef, {
        completed: !item.completed
      })
    } catch (error) {
      console.error('Error toggling item:', error)
    }
  }

  const deleteItem = async (id) => {
    if (!coupleCode) return

    try {
      const itemRef = doc(db, 'couples', coupleCode, activeCategory, id)
      await deleteDoc(itemRef)
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditText(item.text)
  }

  const saveEdit = async () => {
    if (!editText.trim() || !coupleCode || !editingId) return

    try {
      const itemRef = doc(db, 'couples', coupleCode, activeCategory, editingId)
      await updateDoc(itemRef, {
        text: editText
      })
      setEditingId(null)
      setEditText('')
    } catch (error) {
      console.error('Error updating item:', error)
    }
  }

  const currentCategory = CATEGORIES.find(c => c.id === activeCategory)
  const categoryItems = items[activeCategory] || []

  const getColorClasses = (color, variant) => {
    const colors = {
      pink: {
        bg: 'bg-pink-100',
        bgActive: 'bg-pink-400',
        text: 'text-pink-600',
        border: 'border-pink-200',
        hover: 'hover:bg-pink-50',
        ring: 'focus:ring-pink-400'
      },
      purple: {
        bg: 'bg-purple-100',
        bgActive: 'bg-purple-400',
        text: 'text-purple-600',
        border: 'border-purple-200',
        hover: 'hover:bg-purple-50',
        ring: 'focus:ring-purple-400'
      },
      yellow: {
        bg: 'bg-amber-100',
        bgActive: 'bg-amber-400',
        text: 'text-amber-600',
        border: 'border-amber-200',
        hover: 'hover:bg-amber-50',
        ring: 'focus:ring-amber-400'
      },
      rose: {
        bg: 'bg-rose-100',
        bgActive: 'bg-rose-400',
        text: 'text-rose-600',
        border: 'border-rose-200',
        hover: 'hover:bg-rose-50',
        ring: 'focus:ring-rose-400'
      }
    }
    return colors[color]?.[variant] || colors.pink[variant]
  }

  if (loading) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-8 text-center">
        <div className="animate-pulse text-pink-400">Loading your notes...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`p-3 rounded-xl font-medium transition-all duration-200 ${
              activeCategory === cat.id
                ? `${getColorClasses(cat.color, 'bgActive')} text-white shadow-md`
                : `bg-white/70 ${getColorClasses(cat.color, 'text')} ${getColorClasses(cat.color, 'hover')}`
            }`}
          >
            <span className="text-lg mr-1">{cat.icon}</span>
            <span className="text-sm">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Content Card */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-4 md:p-6">
        <h2 className={`text-xl font-bold ${getColorClasses(currentCategory.color, 'text')} mb-4 flex items-center gap-2`}>
          <span className="text-2xl">{currentCategory.icon}</span>
          {currentCategory.label}
        </h2>

        {/* Add New Item */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem()}
            placeholder={`Add a new ${currentCategory.label.toLowerCase().slice(0, -1)}...`}
            className={`flex-1 px-4 py-3 border ${getColorClasses(currentCategory.color, 'border')} rounded-xl focus:outline-none focus:ring-2 ${getColorClasses(currentCategory.color, 'ring')}`}
          />
          <button
            onClick={addItem}
            className={`px-6 py-3 ${getColorClasses(currentCategory.color, 'bgActive')} text-white rounded-xl font-medium hover:opacity-90 transition-opacity`}
          >
            Add
          </button>
        </div>

        {/* Items List */}
        {categoryItems.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <span className="text-4xl block mb-2">{currentCategory.icon}</span>
            <p>No {currentCategory.label.toLowerCase()} yet!</p>
            <p className="text-sm">Add your first one above</p>
          </div>
        ) : (
          <div className="space-y-2">
            {categoryItems.map(item => (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  item.completed
                    ? 'bg-gray-100 opacity-60'
                    : getColorClasses(currentCategory.color, 'bg')
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleComplete(item)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    item.completed
                      ? `${getColorClasses(currentCategory.color, 'bgActive')} border-transparent`
                      : `border-gray-300 ${getColorClasses(currentCategory.color, 'hover')}`
                  }`}
                >
                  {item.completed && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* Text */}
                {editingId === item.id ? (
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                    onBlur={saveEdit}
                    autoFocus
                    className="flex-1 px-2 py-1 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                ) : (
                  <span
                    className={`flex-1 ${item.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}
                    onDoubleClick={() => startEdit(item)}
                  >
                    {item.text}
                  </span>
                )}

                {/* Actions */}
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(item)}
                    className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {categoryItems.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500 flex justify-between">
            <span>{categoryItems.filter(i => !i.completed).length} remaining</span>
            <span>{categoryItems.filter(i => i.completed).length} completed</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default Ideas
