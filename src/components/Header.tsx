import { Link, NavLink } from 'react-router-dom'
import InstitutionSelect from './InstitutionSelect'

const links = [
  { to: '/ask', label: 'Support' },
  { to: '/readiness', label: 'Readiness' },
  { to: '/apply', label: 'Apply' },
  { to: '/troubleshooting', label: 'Problems' },
  { to: '/faq', label: 'FAQ' },
  { to: '/videos', label: 'Videos' },
  { to: '/sources', label: 'Sources' },
]

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-forest-700/10 bg-paper/95 backdrop-blur">
      <div className="container-page flex items-center justify-between gap-3 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-700 text-sm font-bold text-white">
            N
          </span>
          <span className="text-sm font-semibold text-forest-800 sm:text-base">NELFUND Student Guide</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded-full px-3 py-1.5 text-xs font-medium ${
                  isActive ? 'bg-forest-700 text-white' : 'text-ink/70 hover:bg-forest-50'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden md:block">
          <InstitutionSelect />
        </div>
      </div>
    </header>
  )
}
