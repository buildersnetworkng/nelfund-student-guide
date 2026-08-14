import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container-page py-20 text-center">
      <p className="font-display text-6xl font-bold text-forest-700">404</p>
      <p className="mt-2 text-sm text-ink/60">That page doesn't exist.</p>
      <Link to="/" className="btn-primary mt-6 inline-flex">Back to home</Link>
    </div>
  )
}
