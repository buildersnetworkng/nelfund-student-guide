import { Link } from 'react-router-dom'
import ShareGuide from '../components/ShareGuide'

export default function NotFound() {
  return (
    <div className="container-page py-20 text-center">
      <p className="font-display text-6xl font-bold text-forest-700">404</p>
      <p className="mt-2 text-sm text-ink/60">That page doesn't exist.</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link to="/" className="btn-primary inline-flex">
          Back to home
        </Link>
        <ShareGuide variant="button" />
      </div>
    </div>
  )
}
