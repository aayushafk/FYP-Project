import React from 'react'

const cx = (...classes) => classes.filter(Boolean).join(' ')

const Select = ({
    label,
    hint,
    error,
    id,
    options = [],
    placeholder = '-- Select --',
    className = '',
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

            <div className="relative">
                <select
                    id={id}
                    aria-invalid={Boolean(error)}
                    aria-describedby={describedBy}
                    className={cx(
                        'block w-full appearance-none rounded-xl border bg-white px-4 py-2.5 pr-11 text-sm text-slate-900 shadow-sm outline-none transition-all',
                        'focus:border-primary-500 focus:ring-4 focus:ring-primary-100',
                        'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
                        error
                            ? 'border-red-300 bg-red-50/70 text-red-900 focus:border-red-400 focus:ring-red-100'
                            : 'border-slate-300 hover:border-slate-400',
                        className
                    )}
                    {...props}
                >
                    <option value="" disabled>
                        {placeholder}
                    </option>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                <svg
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden="true"
                >
                    <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
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

export default Select
