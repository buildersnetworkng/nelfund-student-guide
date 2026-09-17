import { NavLink } from 'react-router-dom'
import ShareGuide from './ShareGuide'

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/faq', label: 'FAQ' },
  { to: '/apply', label: 'Guide' },
  { to: '/ask', label: 'Ask' },
  { to: '/sources', label: 'About' },
]

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-forest-100/80 bg-white/90 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80">
      <div className="container-page flex h-14 items-center justify-between gap-2 sm:h-16 sm:gap-3">
        <NavLink
          to="/"
          className="group flex min-w-0 flex-1 items-center gap-2.5 font-display transition hover:opacity-95"
        >
          <img
            src="/brand/logo.svg"
            alt="NELFUND"
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-[10px] object-contain shadow-sm ring-1 ring-forest-900/10"
            aria-hidden="true"
            decoding="async"
          />
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold leading-tight tracking-tight text-forest-900 sm:text-sm">
              NELFUND Student Guide
            </span>
            <span className="hidden text-[10px] font-medium leading-tight text-ink/45 sm:block">
              Independent · Official sources
            </span>
          </span>
        </NavLink>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {LINKS.map((l) => (
            <NavLink
              key={l.to + l.label}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-forest-700 text-white shadow-sm'
                    : 'text-ink/55 hover:bg-forest-50 hover:text-ink'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ShareGuide variant="icon" />
          <NavLink
            to="/ask"
            className="inline-flex min-h-[40px] items-center justify-center whitespace-nowrap rounded-full bg-forest-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition duration-150 hover:bg-forest-600 active:scale-[0.98] sm:min-h-[42px] sm:px-4 sm:text-sm"
          >
            Ask
          </NavLink>
        </div>
      </div>
    </header>
  )
}

export { LINKS }
