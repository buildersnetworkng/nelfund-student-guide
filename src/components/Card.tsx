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
    <Link
      to={to}
      className="card flex flex-col gap-2 transition-transform hover:-translate-y-0.5 hover:shadow-lg focus-visible:-translate-y-0.5"
    >
      <span className="text-2xl" aria-hidden="true">{icon}</span>
      <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
      <p className="text-sm text-ink/65">{description}</p>
    </Link>
  )
}
