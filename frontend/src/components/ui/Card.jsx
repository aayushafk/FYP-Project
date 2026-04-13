import React from 'react'

const cx = (...classes) => classes.filter(Boolean).join(' ')

export const Card = ({ children, className = '', interactive = false, ...props }) => (
    <div
        className={cx(
            'surface-card overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-md transition-all duration-300',
            interactive && 'cursor-pointer hover:-translate-y-1 hover:border-primary-200 hover:shadow-lg',
            className
        )}
        {...props}
    >
        {children}
    </div>
)

export const CardHeader = ({ children, className = '', ...props }) => (
    <div
        className={cx('border-b border-slate-200/80 bg-gradient-to-r from-slate-50 to-white px-6 py-4', className)}
        {...props}
    >
        {children}
    </div>
)

export const CardBody = ({ children, className = '', ...props }) => (
    <div className={cx('px-6 py-5', className)} {...props}>
        {children}
    </div>
)

export const CardFooter = ({ children, className = '', ...props }) => (
    <div
        className={cx('border-t border-slate-200/80 bg-slate-50/90 px-6 py-4', className)}
        {...props}
    >
        {children}
    </div>
)
