import React from 'react'

const cx = (...classes) => classes.filter(Boolean).join(' ')

const VARIANT_STYLES = {
    primary: 'bg-primary-600 text-white shadow-md hover:bg-primary-700 hover:shadow-lg hover:scale-105 hover:-translate-y-0.5 focus-visible:ring-primary-300',
    secondary: 'bg-slate-900 text-white shadow-md hover:bg-slate-800 hover:shadow-lg hover:scale-105 hover:-translate-y-0.5 focus-visible:ring-slate-300',
    outline: 'border border-slate-300 bg-white text-slate-700 hover:border-primary-500 hover:text-primary-700 hover:bg-primary-50 hover:scale-105 focus-visible:ring-primary-300',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:scale-105 focus-visible:ring-slate-300',
    danger: 'bg-red-600 text-white shadow-md hover:bg-red-700 hover:shadow-lg hover:scale-105 hover:-translate-y-0.5 focus-visible:ring-red-300',
    success: 'bg-emerald-600 text-white shadow-md hover:bg-emerald-700 hover:shadow-lg hover:scale-105 hover:-translate-y-0.5 focus-visible:ring-emerald-300'
}

const SIZE_STYLES = {
    sm: 'min-h-[2rem] px-3 py-1.5 text-xs',
    md: 'min-h-[2.5rem] px-4 py-2 text-sm',
    lg: 'min-h-[2.75rem] px-5 py-2.5 text-sm',
    xl: 'min-h-[3.25rem] px-7 py-3.5 text-base font-semibold'
}

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    isLoading = false,
    disabled = false,
    type = 'button',
    loadingText = 'Loading...',
    ...props
}) => {
    const isDisabled = disabled || isLoading
    const classes = cx(
        'group relative inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 origin-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
        VARIANT_STYLES[variant] || VARIANT_STYLES.primary,
        SIZE_STYLES[size] || SIZE_STYLES.md,
        className
    )

    return (
        <button
            type={type}
            className={classes}
            disabled={isDisabled}
            aria-busy={isLoading}
            {...props}
        >
            <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative inline-flex items-center gap-2">
                {isLoading && (
                    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                        <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" className="opacity-90" />
                    </svg>
                )}
                {isLoading ? loadingText : children}
            </span>
        </button>
    )
}

export default Button
