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

export default function ShareGuide({ className = '' }: ShareGuideProps) {
  return <ClassLink source="share-guide" className={className} />
}
