import React from 'react'
import { Link } from 'react-router-dom'

const AuthLayout = ({ children, title, subtitle }) => {
    const currentYear = new Date().getFullYear()

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(59,130,246,0.26),transparent_45%),radial-gradient(circle_at_88%_78%,rgba(20,184,166,0.25),transparent_40%)]" />

            <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-6 sm:py-12">
                <div className="grid w-full overflow-hidden rounded-[28px] border border-white/15 bg-white/10 shadow-2xl backdrop-blur-xl lg:grid-cols-[1.1fr_1fr]">
                    <aside className="auth-brand-gradient hidden px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
                        <div>
                            <div className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.17em] text-slate-100/90">
                                Community Platform
                            </div>

                            <h1 className="text-4xl font-bold leading-tight text-white">
                                UnityAid
                                <span className="mt-2 block text-base font-medium text-cyan-100/90">
                                    Volunteer coordination with clarity and trust.
                                </span>
                            </h1>

                            <p className="mt-6 max-w-md text-sm leading-relaxed text-slate-100/85">
                                Manage volunteers, communicate in real time, and keep communities supported with a platform designed for high-stakes coordination.
                            </p>
                        </div>

                        <ul className="auth-checklist mt-10 space-y-3">
                            <li>Role-based experience for citizens, organizers, and volunteers</li>
                            <li>Real-time messaging and request lifecycle tracking</li>
                            <li>Readable workflows for fast onboarding and daily use</li>
                        </ul>
                    </aside>

                    <section className="bg-white/95 px-5 py-8 sm:px-8 sm:py-10">
                        <Link to="/" className="mb-8 inline-flex items-center gap-3">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 text-lg font-bold text-white shadow-md">
                                U
                            </span>
                            <span className="font-display text-xl font-bold tracking-tight text-slate-900">UnityAid</span>
                        </Link>

                        <header className="mb-7">
                            <h2 className="font-display text-3xl font-bold text-slate-900">{title}</h2>
                            {subtitle && <div className="mt-2 text-sm text-slate-600">{subtitle}</div>}
                        </header>

                        <div className="space-y-6">{children}</div>

                        <footer className="mt-8 border-t border-slate-200 pt-5 text-xs text-slate-500">
                            &copy; {currentYear} UnityAid. Professional volunteer management platform.
                        </footer>
                    </section>
                </div>
            </div>
        </div>
    )
}

export default AuthLayout
