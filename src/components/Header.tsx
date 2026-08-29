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
    <header className="sticky top-0 z-30 border-b border-forest-100/80 bg-paper/90 backdrop-blur-md">
      <div className="container-page flex h-14 items-center justify-between sm:h-15">
        <NavLink
          to="/"
          className="flex items-center gap-2.5 font-display font-semibold text-forest-700 transition hover:opacity-90"
        >
          <img
            src="/brand/logo.svg"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-xl shadow-sm"
            aria-hidden="true"
          />
          <span className="text-sm tracking-tight sm:text-[15px]">
            NELFUND <span className="font-medium text-ink/45">Guide</span>
          </span>
        </NavLink>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {LINKS.slice(1).map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-forest-700 text-paper shadow-sm'
                    : 'text-ink/60 hover:bg-forest-50 hover:text-ink'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <NavLink
          to="/ask"
          className="inline-flex min-h-[36px] items-center justify-center rounded-full bg-forest-700 px-3.5 py-1.5 text-xs font-semibold text-paper shadow-sm transition duration-150 hover:bg-forest-900 hover:shadow-md active:scale-[0.98] sm:hidden"
        >
          Ask support
        </NavLink>
      </div>
    </header>
  )
}

export { LINKS }
