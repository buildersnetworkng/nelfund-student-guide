import { NavLink } from 'react-router-dom'

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/ask', label: 'Ask AI' },
  { to: '/apply', label: 'Apply' },
  { to: '/troubleshooting', label: 'Problems' },
  { to: '/faq', label: 'FAQ' },
  { to: '/videos', label: 'Videos' },
  { to: '/sources', label: 'Sources' },
]

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-forest-700/10 bg-paper/90 backdrop-blur-md">
      <div className="container-page flex h-14 items-center justify-between sm:h-16">
        <NavLink to="/" className="flex items-center gap-2.5 font-display font-semibold text-forest-800">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-forest-700 text-xs font-bold text-gold-300 shadow-sm"
          >
            N
          </span>
          <span className="text-sm sm:text-base">
            NELFUND <span className="hidden text-ink/50 sm:inline">Student Guide</span>
          </span>
        </NavLink>
        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {LINKS.slice(1).map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded-full px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                  isActive ? 'bg-forest-700 text-paper shadow-sm' : 'text-ink/65 hover:bg-forest-50 hover:text-ink'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <NavLink to="/ask" className="btn-primary px-4 py-2 text-xs sm:hidden">
          Ask AI
        </NavLink>
      </div>
    </header>
  )
}

export { LINKS }
