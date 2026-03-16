import React, { createContext, useContext, useState, useCallback } from 'react'

const ToastCtx = createContext({ show: () => {} })

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback((message, opts = {}) => {
    const id = Math.random().toString(36).slice(2)
    const t = { id, message, type: opts.type || 'info', duration: opts.duration || 2000 }
    setToasts((prev) => [...prev, t])
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id))
    }, t.duration)
  }, [])

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map((t) => (
          <div key={t.id} className={`bg-white/10 border border-white/20 rounded px-3 py-2 text-sm shadow ${t.type==='error'?'border-red-400/40':'border-white/20'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
