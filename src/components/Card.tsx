import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return <div className={`card ${className}`}>{children}</div>
}

interface QuickActionCardProps {
  to: string
  icon: string
  title: string
  description: string
}

export function QuickActionCard({ to, icon, title, description }: QuickActionCardProps) {
  return (
    <Link to={to} className="card-interactive flex flex-col gap-2 p-4">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-50 text-base font-semibold text-forest-800"
      >
        {icon}
      </span>
      <h3 className="font-display text-sm font-semibold text-ink sm:text-base">{title}</h3>
      <p className="text-xs leading-relaxed text-ink/60 sm:text-sm">{description}</p>
    </Link>
  )
}
