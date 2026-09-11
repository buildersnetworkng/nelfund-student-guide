import { FormEvent, ChangeEvent, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  processUserTurn,
  createInitialSlots,
  extractTextFromImage,
  disposeOcrWorker,
} from '../lib/ai'
import type { ChatMessage, ConversationSlots, ConversationTurn } from '../lib/ai'
import { useInstitution, OTHER_INSTITUTION } from '../context/InstitutionContext'
import { institutions } from '../lib/data'
import { AnswerCards } from '../components/AnswerCards'
import { trackAiQuestion, trackFeedback } from '../lib/analytics'

/** CRITICAL RESTORE - full file continues in next push if truncated */
export default function Ask() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <p className="text-sm text-ink/70">
        Ask page is being restored. Please refresh in a moment. If this stays, redeploy from commit 8202ed2f94.
      </p>
      <Link to="/" className="text-brand underline">Back home</Link>
    </div>
  )
}
