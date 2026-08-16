import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/ask', label: 'Support', icon: '💬' },
  { to: '/apply', label: 'Apply', icon: '📝' },
  { to: '/troubleshooting', label: 'Problems', icon: '✕' },
  { to: '/faq', label: 'FAQ', icon: '?' },
]

export default function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-forest-700/10 bg-paper/95 backdrop-blur md:hidden">
      <div className="flex items-center justify-around px-1 py-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 text-[10px] font-medium ${
                isActive ? 'text-forest-700' : 'text-ink/45'
              }`
            }
          >
            <span className="text-base leading-none" aria-hidden>
              {item.icon}
            </span>
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
