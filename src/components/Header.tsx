import { NavLink } from 'react-router-dom'

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
    <header className="sticky top-0 z-30 border-b border-forest-100/70 bg-paper/85 backdrop-blur-xl supports-[backdrop-filter]:bg-paper/75">
      <div className="container-page flex h-14 items-center justify-between gap-3 sm:h-16">
        <NavLink
          to="/"
          className="group flex min-w-0 items-center gap-2.5 font-display transition hover:opacity-95"
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
            <span className="block truncate text-[13px] font-semibold leading-tight tracking-tight text-forest-800 sm:text-sm">
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
                    ? 'bg-forest-800 text-paper shadow-sm'
                    : 'text-ink/55 hover:bg-forest-50 hover:text-ink'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <NavLink
          to="/ask"
          className="inline-flex min-h-[38px] items-center justify-center rounded-full bg-forest-800 px-4 py-1.5 text-xs font-semibold text-paper shadow-sm transition duration-150 hover:bg-forest-900 hover:shadow-md active:scale-[0.98] sm:text-sm"
        >
          Ask support
        </NavLink>
      </div>
    </header>
  )
}

export { LINKS }
