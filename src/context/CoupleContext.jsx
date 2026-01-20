import { createContext, useContext, useState, useEffect } from 'react'

const CoupleContext = createContext()

export function CoupleProvider({ children }) {
  const [coupleCode, setCoupleCode] = useState(() => {
    return localStorage.getItem('coupleCode') || null
  })

  useEffect(() => {
    if (coupleCode) {
      localStorage.setItem('coupleCode', coupleCode)
    }
  }, [coupleCode])

  const joinCouple = (code) => {
    const normalizedCode = code.toLowerCase().trim()
    setCoupleCode(normalizedCode)
  }

  const leaveCouple = () => {
    localStorage.removeItem('coupleCode')
    setCoupleCode(null)
  }

  return (
    <CoupleContext.Provider value={{ coupleCode, joinCouple, leaveCouple }}>
      {children}
    </CoupleContext.Provider>
  )
}

export function useCouple() {
  const context = useContext(CoupleContext)
  if (!context) {
    throw new Error('useCouple must be used within a CoupleProvider')
  }
  return context
}
