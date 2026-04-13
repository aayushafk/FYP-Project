import React from 'react'
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'

const cx = (...classes) => classes.filter(Boolean).join(' ')

const VARIANTS = {
    info: {
        container: 'border-blue-200 bg-blue-50/80 text-blue-800',
        icon: Info
    },
    success: {
        container: 'border-emerald-200 bg-emerald-50/80 text-emerald-800',
        icon: CheckCircle2
    },
    warning: {
        container: 'border-amber-200 bg-amber-50/85 text-amber-900',
        icon: TriangleAlert
    },
    error: {
        container: 'border-red-200 bg-red-50/85 text-red-800',
        icon: AlertCircle
    }
}

const Alert = ({
    children,
    variant = 'info',
    title,
    className = '',
    dismissible = false,
    onClose
}) => {
    const resolvedVariant = VARIANTS[variant] || VARIANTS.info
    const Icon = resolvedVariant.icon

    return (
        <div
            className={cx('flex items-start gap-3 rounded-xl border px-4 py-3.5 shadow-sm', resolvedVariant.container, className)}
            role="alert"
        >
            <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />

            <div className="min-w-0 flex-1">
                {title && <h3 className="mb-1 text-sm font-bold">{title}</h3>}
                <div className="text-sm leading-relaxed">{children}</div>
            </div>

            {dismissible && (
                <button
                    type="button"
                    onClick={onClose}
                    className="shrink-0 rounded-lg p-1 text-current/70 transition hover:bg-black/5 hover:text-current"
                    aria-label="Close alert"
                >
                    <X size={16} />
                </button>
            )}
        </div>
    )
}

export default Alert
