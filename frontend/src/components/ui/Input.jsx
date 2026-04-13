import React from 'react'

const cx = (...classes) => classes.filter(Boolean).join(' ')

const Input = ({
    label,
    hint,
    error,
    id,
    className = '',
    type = 'text',
    ...props
}) => {
    const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-700">
                    {label}
                    {props.required && <span className="ml-1 text-red-500">*</span>}
                </label>
            )}

            <div className="group relative">
                <input
                    id={id}
                    type={type}
                    aria-invalid={Boolean(error)}
                    aria-describedby={describedBy}
                    className={cx(
                        'block w-full rounded-xl border px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400',
                        'focus:border-primary-500 focus:ring-4 focus:ring-primary-100',
                        error
                            ? 'border-red-300 bg-red-50/70 text-red-900 focus:border-red-400 focus:ring-red-100'
                            : 'border-slate-300 bg-white hover:border-slate-400',
                        className
                    )}
                    {...props}
                />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 rounded-b-xl bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 transition-transform duration-300 group-focus-within:scale-x-100" />
            </div>

            {hint && !error && (
                <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">
                    {hint}
                </p>
            )}

            {error && (
                <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-red-600">
                    {error}
                </p>
            )}
        </div>
    )
}

export default Input
