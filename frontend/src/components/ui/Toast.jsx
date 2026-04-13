import React, { useEffect } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

const TOAST_STYLES = {
  success: {
    container: 'border-emerald-200 bg-emerald-50/90',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
    titleColor: 'text-emerald-900',
    textColor: 'text-emerald-800',
    progress: 'bg-emerald-400'
  },
  error: {
    container: 'border-red-200 bg-red-50/90',
    icon: AlertCircle,
    iconColor: 'text-red-600',
    titleColor: 'text-red-900',
    textColor: 'text-red-800',
    progress: 'bg-red-400'
  },
  warning: {
    container: 'border-amber-200 bg-amber-50/90',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-900',
    textColor: 'text-amber-800',
    progress: 'bg-amber-400'
  },
  info: {
    container: 'border-blue-200 bg-blue-50/90',
    icon: Info,
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-900',
    textColor: 'text-blue-800',
    progress: 'bg-blue-400'
  }
}

const Toast = ({ id, type = 'info', title, message, duration = 5000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration)
    return () => clearTimeout(timer)
  }, [id, duration, onClose])

  const style = TOAST_STYLES[type] || TOAST_STYLES.info
  const Icon = style.icon

  return (
    <div className={`relative overflow-hidden rounded-xl border p-4 shadow-md backdrop-blur-sm animate-slideInRight ${style.container}`}>
      <div className="flex items-start gap-3">
        <Icon size={19} className={`mt-0.5 shrink-0 ${style.iconColor}`} />

        <div className="min-w-0 flex-1">
          {title && <p className={`font-semibold leading-tight ${style.titleColor}`}>{title}</p>}
          {message && <p className={`mt-0.5 text-sm leading-relaxed ${style.textColor}`}>{message}</p>}
        </div>

        <button
          onClick={() => onClose(id)}
          className={`rounded-lg p-1 transition hover:bg-black/5 ${style.textColor}`}
          aria-label="Dismiss notification"
        >
          <X size={16} />
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 h-1 w-full bg-black/5" />
      <div
        className={`pointer-events-none absolute bottom-0 left-0 h-1 ${style.progress}`}
        style={{ width: '100%', animation: `shrinkBar ${duration}ms linear forwards` }}
      />
    </div>
  )
}

const ToastContainer = ({ toasts, onRemoveToast }) => (
  <div className="fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-md flex-col gap-3 sm:right-6 sm:top-6 sm:w-full">
    {toasts.map((toast) => (
      <Toast key={toast.id} {...toast} onClose={onRemoveToast} />
    ))}
  </div>
)

export { Toast, ToastContainer }
