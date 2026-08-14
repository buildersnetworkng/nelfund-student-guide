import { Link } from 'react-router-dom'
import { useInstitutionNoticeText } from '../context/InstitutionContext'

export default function InstitutionNotice() {
  const text = useInstitutionNoticeText()

  if (!text) {
    return (
      <p className="text-xs text-ink/50">
        <Link to="/#institution" className="underline underline-offset-2 hover:text-ink">
          Tell us your institution
        </Link>{' '}
        to see institution-specific guidance alongside NELFUND-wide guidance.
      </p>
    )
  }

  return <p className="text-xs text-ink/50">{text}</p>
}
