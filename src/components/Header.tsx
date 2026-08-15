import { NavLink } from 'react-router-dom'

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/ask', label: 'Ask' },
  { to: '/readiness', label: 'Am I ready?' },
  { to: '/apply', label: 'How to apply' },
  { to: '/troubleshooting', label: 'Problems' },
  { to: '/faq', label: 'FAQ' },
  { to: '/videos', label: 'Videos' },
  { to: '/sources', label: 'Official links' },
]

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-forest-700/10 bg-paper/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2 font-display font-semibold text-forest-700">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-700 text-xs font-bold text-gold-300"
          >
            N
          </span>
          <span className="text-sm sm:text-base">NELFUND Student Guide</span>
        </NavLink>
        <nav className="hidden gap-1 md:flex" aria-label="Primary">
          {LINKS.slice(1).map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-forest-700 text-paper' : 'text-ink/70 hover:bg-forest-50'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
