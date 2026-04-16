import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarClock,
  ChartNoAxesColumn,
  Compass,
  HandHeart,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  UsersRound
} from 'lucide-react'

const metrics = [
  { label: 'Registered Volunteers', value: '10,000+' },
  { label: 'Communities Supported', value: '420+' },
  { label: 'Response Readiness', value: '24/7' },
  { label: 'Active Requests', value: '1,800+' }
]

const featureCards = [
  {
    title: 'Event Coordination',
    description: 'Plan volunteer activities with clear ownership, timelines, and status updates.',
    icon: CalendarClock,
    style: 'from-primary-600 to-primary-700'
  },
  {
    title: 'Skill-Based Matching',
    description: 'Pair volunteers and requests with practical fit logic to improve outcomes.',
    icon: Compass,
    style: 'from-emerald-600 to-emerald-700'
  },
  {
    title: 'Real-Time Messaging',
    description: 'Keep teams aligned through fast, role-aware conversations and notifications.',
    icon: MessageSquareText,
    style: 'from-cyan-600 to-cyan-700'
  },
  {
    title: 'Operational Visibility',
    description: 'Track requests, volunteer actions, and completion progress from one dashboard.',
    icon: ChartNoAxesColumn,
    style: 'from-amber-500 to-amber-600'
  }
]

const roleCards = [
  {
    title: 'For Organizers',
    description: 'Run high-volume events with confidence and transparent coordination.',
    highlights: ['Create structured events', 'Track volunteer capacity in real time', 'Communicate updates quickly'],
    accent: 'border-primary-200'
  },
  {
    title: 'For Volunteers',
    description: 'Find opportunities aligned with your skills and preferred impact areas.',
    highlights: ['Discover relevant requests', 'Join events in one click', 'Track assigned tasks and progress'],
    accent: 'border-emerald-200'
  },
  {
    title: 'For Citizens',
    description: 'Request support easily and monitor help from request to resolution.',
    highlights: ['Submit urgent or planned requests', 'Receive transparent status updates', 'Message responders directly'],
    accent: 'border-cyan-200'
  }
]

const galleryItems = [
  {
    title: 'Volunteer Operations',
    caption: 'Organized teams and clear communication in the field.',
    image: 'https://images.unsplash.com/photo-1521790797524-b2497295b8a0?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Community Assistance',
    caption: 'Reliable support for people during urgent situations.',
    image: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Response Readiness',
    caption: 'Prepared teams delivering help where it is needed most.',
    image: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=1200&q=80'
  }
]

const SectionHeader = ({ eyebrow, title, subtitle }) => (
  <header className="mx-auto mb-12 max-w-3xl text-center">
    <p className="section-eyebrow justify-center">
      <Sparkles size={14} />
      {eyebrow}
    </p>
    <h2 className="section-title text-balanced mt-4">{title}</h2>
    <p className="section-subtitle text-balanced mt-4 mx-auto">{subtitle}</p>
  </header>
)

const Homepage = () => {
  return (
    <div className="min-h-screen text-slate-900">
      <nav className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 text-lg font-bold text-white shadow-md">
                U
              </div>
              <div>
                <p className="font-display text-lg font-bold text-slate-900">UnityAid</p>
                <p className="text-xs text-slate-500">Volunteer Coordination Platform</p>
              </div>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/login"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 hover:text-white hover:scale-105 hover:shadow-md duration-300 origin-center"
              >
                Get Started
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative overflow-hidden pb-20 pt-20 sm:pb-24 sm:pt-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(47,127,224,0.16),transparent_42%),radial-gradient(circle_at_82%_25%,rgba(18,171,146,0.16),transparent_46%)]" />

          <div className="readable-content relative z-10 px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="animate-reveal">
                <p className="section-eyebrow">
                  <ShieldCheck size={14} />
                  Built For Community Response
                </p>

                <h1 className="mt-4 max-w-2xl text-balanced font-display text-4xl font-extrabold leading-[1.08] text-slate-900 sm:text-5xl lg:text-6xl">
                  Professional volunteer management for modern communities.
                </h1>

                <p className="mt-6 max-w-2xl text-lg text-slate-600">
                  UnityAid helps organizers, volunteers, and citizens coordinate events, requests, and communication from one dependable workspace.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-primary-700 hover:text-white hover:scale-105 hover:shadow-lg duration-300 origin-center"
                  >
                    Create Your Account
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary-300 hover:text-primary-700"
                  >
                    Access Existing Account
                  </Link>
                </div>
              </div>

              <div className="surface-card animate-float p-6 sm:p-7">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary-700">
                  <UsersRound size={14} />
                  Live Coordination Snapshot
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Medical Supply Distribution', status: 'In Progress', badge: 'bg-amber-100 text-amber-700' },
                    { label: 'Flood Relief Registration', status: 'Open', badge: 'bg-emerald-100 text-emerald-700' },
                    { label: 'Neighborhood Care Drive', status: 'Completed', badge: 'bg-primary-100 text-primary-700' }
                  ].map((item) => (
                    <div key={item.label} className="surface-card-soft flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                        <p className="text-xs text-slate-500">Updated just now</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.badge}`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {metrics.map((metric) => (
                <div key={metric.label} className="surface-card-soft p-4 text-center">
                  <p className="text-2xl font-extrabold text-slate-900">{metric.value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-24">
          <div className="readable-content px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Core Capabilities"
              title="A focused platform for fast, reliable community action"
              subtitle="Every workflow is designed for clarity: less coordination overhead, faster response decisions, and better outcomes for volunteers and citizens."
            />

            <div className="feature-grid">
              {featureCards.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <article
                    key={feature.title}
                    className="surface-card group p-6 transition hover:-translate-y-1 hover:shadow-lg"
                    style={{ animationDelay: `${index * 90}ms` }}
                  >
                    <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ring-1 ring-white/25 ${feature.style}`}>
                      <Icon size={20} />
                    </div>
                    <h3 className="font-display text-xl font-bold text-slate-900">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{feature.description}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="bg-slate-100/65 py-20 sm:py-24">
          <div className="readable-content px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Role Specific Experience"
              title="Tailored for organizers, volunteers, and citizens"
              subtitle="Each role gets purpose-built workflows with the same visual consistency, dependable navigation, and real-time updates."
            />

            <div className="grid gap-5 md:grid-cols-3">
              {roleCards.map((role) => (
                <article key={role.title} className={`surface-card p-6 border-t-4 ${role.accent}`}>
                  <h3 className="font-display text-xl font-bold text-slate-900">{role.title}</h3>
                  <p className="mt-3 text-sm text-slate-600">{role.description}</p>
                  <ul className="mt-5 space-y-2.5">
                    {role.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-start gap-2 text-sm text-slate-700">
                        <HandHeart size={16} className="mt-0.5 text-accent-600" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-24">
          <div className="readable-content px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Real Impact"
              title="Communities supported through coordinated action"
              subtitle="UnityAid enables high-quality collaboration when timing and clarity matter most."
            />

            <div className="grid gap-5 md:grid-cols-3">
              {galleryItems.map((item) => (
                <article key={item.title} className="group relative overflow-hidden rounded-2xl border border-slate-200 shadow-md">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-72 w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <h3 className="font-display text-xl font-bold text-white">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-200">{item.caption}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-20 sm:pb-24">
          <div className="readable-content px-4 sm:px-6 lg:px-8">
            <div className="surface-card overflow-hidden p-8 sm:p-12">
              <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                <div>
                  <p className="section-eyebrow">
                    <Sparkles size={14} />
                    Ready To Start
                  </p>
                  <h2 className="section-title mt-4 max-w-2xl">Build stronger community response with a professional platform.</h2>
                  <p className="section-subtitle mt-4 max-w-2xl">
                    Join UnityAid today and coordinate events, volunteers, and requests with clarity from day one.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 hover:text-white hover:scale-105 hover:shadow-lg duration-300 origin-center"
                  >
                    Create Account
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary-300 hover:text-primary-700"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white/75 py-8 text-center text-sm text-slate-500 backdrop-blur">
        <p>© {new Date().getFullYear()} UnityAid. Built for reliable, people-first coordination.</p>
      </footer>
    </div>
  )
}

export default Homepage
