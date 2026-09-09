import { NavLink } from 'react-router-dom'
import ShareGuide from './ShareGuide'

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/ask', label: 'Ask support' },
  { to: '/apply', label: 'Apply' },
  { to: '/troubleshooting', label: 'Problems' },
  { to: '/faq', label: 'FAQ' },
  { to: '/videos', label: 'Videos' },
  { to: '/sources', label: 'Sources' },
]

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-forest-100/70 bg-paper/95 backdrop-blur-xl supports-[backdrop-filter]:bg-paper/90">
      <div className="container-page flex h-14 items-center justify-between gap-2 sm:h-16 sm:gap-3">
        <NavLink
          to="/"
          className="group flex min-w-0 flex-1 items-center gap-2 font-display transition hover:opacity-95 sm:gap-2.5"
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
              NELFUND Guide
            </span>
            <span className="hidden text-[10px] font-medium leading-tight text-ink/45 sm:block">
              Independent student support
            </span>
          </span>
        </NavLink>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {LINKS.slice(1).map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-forest-900 text-paper shadow-sm'
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
            className="inline-flex min-h-[40px] items-center justify-center rounded-full bg-gold-500 px-3 py-2 text-xs font-bold text-forest-950 shadow-md ring-2 ring-gold-600/30 transition duration-150 hover:bg-gold-400 hover:shadow-lg active:scale-[0.98] sm:min-h-[42px] sm:px-4 sm:text-sm"
          >
            {/* Short label on very small screens, full on larger */}
            <span className="xs:hidden sm:hidden">Ask</span>
            <span className="hidden min-[360px]:inline">Ask support</span>
          </NavLink>
        </div>
      </div>
    </header>
  )
}

export { LINKS }
