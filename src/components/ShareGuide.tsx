export {
  GroupNameField,
  GroupSearchChips,
  WhatsAppClassLink,
  MoreGroupsRow,
  SHARE_TEXT,
} from './ShareFields'

import { WhatsAppClassLink as ClassLink } from './ShareFields'

type ShareGuideProps = {
  variant?: 'icon' | 'button' | 'hero'
  className?: string
}

export default function ShareGuide({ variant = 'button', className = '' }: ShareGuideProps) {
  const compact = variant === 'icon' || variant === 'button'
  return (
    <ClassLink
      source={compact ? 'header-share' : 'share-guide'}
      compact={compact}
      className={compact ? `!min-h-[36px] !px-3 !py-1.5 !text-xs ${className}` : className}
    />
  )
}
