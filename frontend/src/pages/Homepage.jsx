import { Link } from 'react-router-dom'

const Homepage = () => {
  return (
    <div className="bg-white min-h-screen">
      {/* ====== NAVIGATION ====== */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-18">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              {/* Logo Icon */}
              <div className="relative w-9 h-9 group-hover:scale-105 transition-transform duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg rotate-6 group-hover:rotate-12 transition-transform duration-300"></div>
                <div className="relative w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
              </div>
              {/* Logo Text */}
              <span className="text-xl font-extrabold tracking-tight text-gray-900">
                Unity<span className="text-blue-600">Aid</span>
              </span>
            </Link>

            {/* Nav Links */}
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-5 py-2 text-gray-600 font-semibold text-sm hover:text-blue-600 transition-colors duration-200"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 hover:text-white shadow-md hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ====== HERO SECTION ====== */}
      <section className="relative py-28 sm:py-36 lg:py-44 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1920&q=80&fit=crop"
            alt="Volunteers working together"
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-blue-950/60 to-indigo-950/75"></div>
        </div>

        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-400/20 rounded-full mb-8 backdrop-blur-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-blue-300 text-sm font-medium">Trusted by 10K+ volunteers worldwide</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight">
              Connecting Communities
              <br />
              <span className="text-blue-300">Through Volunteer</span>
              <br />
              Coordination
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-300 mb-10 leading-relaxed max-w-2xl mx-auto">
              Empowering communities to organize, coordinate, and respond effectively to events and emergencies through seamless volunteer management.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/register"
                className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-0.5 hover:text-white transition-all duration-300"
              >
                Join Now – It's Free
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform duration-300">&rarr;</span>
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 bg-white/5 backdrop-blur-sm text-white border border-white/20 rounded-xl font-semibold text-lg hover:bg-white/10 hover:border-white/30 hover:text-white transition-all duration-300"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* ====== HOW IT WORKS SECTION ====== */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-blue-600 tracking-widest uppercase mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              How UnityAid Works
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
              A comprehensive platform designed to streamline volunteer coordination and community response
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Organize Events - BLUE */}
            <div className="relative bg-white rounded-2xl border border-gray-100 p-8 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-blue-100 group-hover:scale-105 transition-all duration-300">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Organize Events
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Create and manage community events with powerful coordination tools
              </p>
            </div>

            {/* Card 2: Join as Volunteer - GREEN */}
            <div className="relative bg-white rounded-2xl border border-gray-100 p-8 hover:border-green-200 hover:shadow-xl hover:shadow-green-500/5 hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-green-100 group-hover:scale-105 transition-all duration-300">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Join as Volunteer
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Discover opportunities that match your skills and make an impact
              </p>
            </div>

            {/* Card 3: Request Help - PURPLE */}
            <div className="relative bg-white rounded-2xl border border-gray-100 p-8 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-purple-100 group-hover:scale-105 transition-all duration-300">
                <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Request Community Help
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Get assistance from your community when you need it most
              </p>
            </div>

            {/* Card 4: Real-Time Chat - TEAL */}
            <div className="relative bg-white rounded-2xl border border-gray-100 p-8 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-500/5 hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-teal-100 group-hover:scale-105 transition-all duration-300">
                <svg className="w-7 h-7 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Real-Time Communication
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Stay connected with instant messaging and updates
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ====== ROLE-BASED SECTIONS ====== */}
      <section className="py-20 sm:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-indigo-600 tracking-widest uppercase mb-3">For Everyone</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Who Can Benefit from UnityAid?
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Tailored solutions for organizers, volunteers, and community members
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: For Organizers */}
            <div className="bg-white rounded-2xl p-8 lg:p-10 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 border border-gray-100 group">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                For Organizers
              </h3>
              <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                Powerful tools to create and manage community events and emergency responses.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-gray-600 text-sm">Create and manage events</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-gray-600 text-sm">Coordinate volunteers efficiently</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-gray-600 text-sm">Track progress in real time</span>
                </li>
              </ul>
            </div>

            {/* Card 2: For Volunteers */}
            <div className="bg-white rounded-2xl p-8 lg:p-10 hover:shadow-xl hover:shadow-green-500/5 hover:-translate-y-1 transition-all duration-300 border border-gray-100 group">
              <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-green-500/20 group-hover:scale-105 transition-transform duration-300">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                For Volunteers
              </h3>
              <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                Find opportunities that match your skills and make a real difference.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-gray-600 text-sm">Discover events by skills</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-gray-600 text-sm">Join and track tasks easily</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-gray-600 text-sm">Communicate in real time</span>
                </li>
              </ul>
            </div>

            {/* Card 3: For Citizens */}
            <div className="bg-white rounded-2xl p-8 lg:p-10 hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-1 transition-all duration-300 border border-gray-100 group">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform duration-300">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                For Citizens
              </h3>
              <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                Access help from your community whenever you need support.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-gray-600 text-sm">Request help instantly</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-gray-600 text-sm">Track status of requests</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-gray-600 text-sm">Chat with volunteers directly</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ====== IMPACT GALLERY SECTION ====== */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-blue-600 tracking-widest uppercase mb-3">Impact</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              See UnityAid in Action
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Real communities coming together to create lasting impact
            </p>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Gallery Item 1 */}
            <div className="relative h-80 rounded-2xl overflow-hidden group cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=600&fit=crop"
                alt="Volunteers coordinating activities"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300 flex items-end p-7">
                <div>
                  <p className="text-white font-bold text-xl mb-1">Volunteer Coordination</p>
                  <p className="text-gray-300 text-sm">Organizing community efforts</p>
                </div>
              </div>
            </div>

            {/* Gallery Item 2 */}
            <div className="relative h-80 rounded-2xl overflow-hidden group cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&h=600&fit=crop"
                alt="Community helping each other"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300 flex items-end p-7">
                <div>
                  <p className="text-white font-bold text-xl mb-1">Community Support</p>
                  <p className="text-gray-300 text-sm">Helping neighbors in need</p>
                </div>
              </div>
            </div>

            {/* Gallery Item 3 */}
            <div className="relative h-80 rounded-2xl overflow-hidden group cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&h=600&fit=crop"
                alt="Team of volunteers working together"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300 flex items-end p-7">
                <div>
                  <p className="text-white font-bold text-xl mb-1">Emergency Response</p>
                  <p className="text-gray-300 text-sm">Swift action in critical moments</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== STATS SECTION ====== */}
      <section className="py-20 sm:py-24 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl"></div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-blue-400 tracking-widest uppercase mb-3">Our Impact</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight">
              Our Growing Community
            </h2>
            <p className="text-lg text-slate-400 max-w-xl mx-auto">
              Making real impact, one volunteer at a time
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {/* Stat 1 */}
            <div className="text-center p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group">
              <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-5xl font-extrabold text-white mb-2">10K+</div>
              <p className="text-lg font-semibold text-white mb-1">Active Volunteers</p>
              <p className="text-slate-400 text-sm">Ready to make a difference</p>
            </div>

            {/* Stat 2 */}
            <div className="text-center p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-5xl font-extrabold text-white mb-2">500+</div>
              <p className="text-lg font-semibold text-white mb-1">Events Managed</p>
              <p className="text-slate-400 text-sm">Successfully coordinated</p>
            </div>

            {/* Stat 3 */}
            <div className="text-center p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group">
              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-5xl font-extrabold text-white mb-2">50K+</div>
              <p className="text-lg font-semibold text-white mb-1">Hours Volunteered</p>
              <p className="text-slate-400 text-sm">Of community service</p>
            </div>
          </div>
        </div>
      </section>

      {/* ====== FINAL CTA SECTION ====== */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-3xl"></div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-5 tracking-tight">
              Ready to Make a Difference?
            </h2>
            <p className="text-lg text-slate-300 mb-10 max-w-xl mx-auto leading-relaxed">
              Join thousands of volunteers and organizers who are transforming communities and creating lasting impact.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/register"
                className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 hover:text-white transition-all duration-300"
              >
                Get Started Now
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform duration-300">&rarr;</span>
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold text-lg rounded-xl border border-white/20 hover:bg-white/15 hover:border-white/30 hover:text-white transition-all duration-300"
              >
                Learn More
              </Link>
            </div>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* About Section */}
            <div>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="relative w-9 h-9">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg rotate-6"></div>
                  <div className="relative w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                </div>
                <span className="text-lg font-extrabold text-white">
                  Unity<span className="text-blue-400">Aid</span>
                </span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-5">
                Empowering communities through volunteer coordination and civic engagement. Connecting those who need help with those who care.
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-9 h-9 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                  <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="w-9 h-9 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                  <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="w-9 h-9 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                  <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121L7.773 13.98l-2.994-.918c-.653-.184-.658-.653.136-.962l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-5">
                Quick Links
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/" className="text-slate-400 hover:text-white text-sm transition-colors duration-200">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-slate-400 hover:text-white text-sm transition-colors duration-200">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/events" className="text-slate-400 hover:text-white text-sm transition-colors duration-200">
                    Browse Events
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-slate-400 hover:text-white text-sm transition-colors duration-200">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="text-slate-400 hover:text-white text-sm transition-colors duration-200">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Roles / Get Involved */}
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-5">
                Get Involved
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/signup?role=volunteer" className="text-slate-400 hover:text-white text-sm transition-colors duration-200">
                    Become a Volunteer
                  </Link>
                </li>
                <li>
                  <Link to="/signup?role=organizer" className="text-slate-400 hover:text-white text-sm transition-colors duration-200">
                    Organize Events
                  </Link>
                </li>
                <li>
                  <Link to="/signup?role=citizen" className="text-slate-400 hover:text-white text-sm transition-colors duration-200">
                    Request Help
                  </Link>
                </li>
                <li>
                  <Link to="/donate" className="text-slate-400 hover:text-white text-sm transition-colors duration-200">
                    Support Our Mission
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-5">
                Contact Us
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                  </svg>
                  <div>
                    <p className="text-slate-500 text-xs mb-0.5">Email</p>
                    <a href="mailto:support@unityaid.org" className="text-slate-300 text-sm font-medium hover:text-white transition-colors">
                      support@unityaid.org
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                  </svg>
                  <div>
                    <p className="text-slate-500 text-xs mb-0.5">Location</p>
                    <p className="text-slate-300 text-sm font-medium">Global Community Platform</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                  </svg>
                  <div>
                    <p className="text-slate-500 text-xs mb-0.5">Support</p>
                    <p className="text-slate-300 text-sm font-medium">24/7 Help Available</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-slate-500 text-sm text-center md:text-left">
                &copy; 2024 UnityAid. All rights reserved. Built with &#10084;&#65039; for communities worldwide.
              </p>
              <div className="flex gap-6 text-sm">
                <Link to="/privacy" className="text-slate-500 hover:text-slate-300 transition-colors duration-200">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="text-slate-500 hover:text-slate-300 transition-colors duration-200">
                  Terms of Service
                </Link>
                <Link to="/cookies" className="text-slate-500 hover:text-slate-300 transition-colors duration-200">
                  Cookie Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Homepage