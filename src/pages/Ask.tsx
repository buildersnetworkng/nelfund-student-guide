import { FormEvent, ChangeEvent, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
import { LinkifiedText } from '../components/LinkifiedText'
import { trackAiQuestion, trackFeedback } from '../lib/analytics'
import ShareGuide, { WhatsAppClassLink } from '../components/ShareGuide'
import ShareSoftPrompt, { markShareValue } from '../components/ShareSoftPrompt'

const SUGGESTIONS = [
  'Is NELFUND loan application open?',
  'How do I apply for NELFUND?',
  'My application is pending',
  'It is showing invalid JAMB number',
  'Missing information on the portal',
  'My school is not showing on the list',
  'Difference between school fees and upkeep',
  'Email already used, I registered last year',
  'How do I log in?',
  'When do I start repayment?',
]

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function schoolOptionLabel(i: { short_name?: string; shortName?: string; name: string }) {
  return i.short_name || i.shortName || i.name
}

function historyFromMessages(
  messages: ChatMessage[],
  currentIntent?: string | null,
): ConversationTurn[] {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-12)
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      text: m.text,
      intent: m.role === 'assistant' ? m.answer?.intent || currentIntent || undefined : undefined,
    }))
}

export default function Ask() {
  const navigate = useNavigate()
  const { institutionId, setInstitutionId } = useInstitution()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [slots, setSlots] = useState<ConversationSlots>(() => createInitialSlots())
  const [ocrText, setOcrText] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({})
  const [ocrBusy, setOcrBusy] = useState(false)
  const [showAllSuggestions, setShowAllSuggestions] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const ocrRef = useRef<string | null>(null)
  const previewRef = useRef<string | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  useEffect(() => {
    return () => {
      disposeOcrWorker()
    }
  }, [])

  function clearFile() {
    setOcrText(null)
    setPreview(null)
    ocrRef.current = null
    previewRef.current = null
    if (fileRef.current) fileRef.current.value = ''
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    previewRef.current = url
    setOcrBusy(true)
    try {
      const result = await extractTextFromImage(file)
      const extracted =
        typeof result === 'string'
          ? result
          : ((result as { text?: string })?.text || '')
      const cleaned = extracted.trim()
      setOcrText(cleaned ? cleaned : null)
      ocrRef.current = cleaned ? cleaned : null
    } catch {
      setOcrText(null)
      ocrRef.current = null
    } finally {
      setOcrBusy(false)
    }
    void sendQuestion('', {
      ocrOverride: ocrRef.current,
      previewOverride: previewRef.current,
      forceImage: true,
    })
  }

  async function sendQuestion(
    raw: string,
    opts?: { ocrOverride?: string | null; previewOverride?: string | null; forceImage?: boolean },
  ) {
    const text = raw.trim()
    const ocrNow =
      typeof opts?.ocrOverride === 'string'
        ? opts.ocrOverride
        : typeof ocrText === 'string'
          ? ocrText
          : ocrRef.current
    const previewNow = opts?.previewOverride ?? preview ?? previewRef.current
    const hasImage = Boolean(previewNow || opts?.forceImage)

    if ((!text && !ocrNow && !hasImage) || busy) return
    setBusy(true)
    setInput('')

    const userMsg: ChatMessage = {
      id: uid('user'),
      role: 'user',
      text: text || (ocrNow ? '[screenshot]' : '[image]'),
      imagePreview: previewNow,
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMsg])

    try {
      const history = historyFromMessages(messages, slots.intent)
      const ocrSafe = typeof ocrNow === 'string' && ocrNow.trim() ? ocrNow.trim() : null
      const userTextForEngine =
        text || (ocrSafe ? '' : hasImage ? 'Please read this portal screenshot' : '')

      const result = await processUserTurn({
        userText: userTextForEngine,
        ocrText: ocrSafe || (hasImage ? 'portal screenshot uploaded' : null),
        imagePreview: previewNow,
        uiInstitutionId: institutionId,
        slots: {
          ...slots,
          institutionId: institutionId || slots.institutionId,
        },
        history,
      })

      if (!result || !Array.isArray(result.messages)) {
        throw new Error('empty turn result')
      }
      const nextSlots = result.slots || slots
      const asstMsgs = result.messages.filter((m) => m && m.role === 'assistant')
      const asst = asstMsgs.find((m) => m.answer) || asstMsgs[0]
      if (!asst) {
        throw new Error('no assistant message')
      }
      const intent = asst?.answer?.intent || nextSlots.intent || 'unknown'
      try {
        trackAiQuestion({
          intent,
          institutionId: nextSlots.institutionId || institutionId,
          hasImage: !!ocrSafe || hasImage,
          unresolved: !!asst?.answer?.insufficientReason || intent === 'unknown',
          isNewConversation: messages.length === 0,
          resolutionClosed: !!asst?.answer?.hasEvidence && !asst?.answer?.insufficientReason,
          escalationFired: !!asst?.answer?.escalation,
          userText: text || (ocrSafe ? ocrSafe.slice(0, 200) : null),
        })
      } catch {
        /* analytics must not break chat */
      }

      setSlots(nextSlots)
      setMessages((prev) => [...prev, ...asstMsgs])
      if (asstMsgs.length > 0) markShareValue()
      clearFile()
    } catch {
      const fallback =
        hasImage || ocrNow
          ? 'I could not finish reading that screenshot. Type the exact portal words you see (e.g. Pending Loans 2, No Result found, admission letter is required), or open https://portal.nelf.gov.ng/.'
          : 'Something went wrong on this device. Try again, or open portal.nelf.gov.ng directly.'
      const errMsg: ChatMessage = {
        id: uid('asst'),
        role: 'assistant',
        text: fallback,
        timestamp: Date.now(),
        answer: {
          hasEvidence: false,
          intent: 'current-information',
          confidence: 0.3,
          problem: null,
          answer: fallback,
          nextActions: [],
          clarifyingQuestions: [
            'Who can apply (eligibility)?',
            'How do I apply step by step?',
          ],
          evidence: [],
          sources: [
            {
              id: 'portal',
              label: 'NELFUND portal',
              url: 'https://portal.nelf.gov.ng/',
              official: true,
            },
          ],
          video: null,
          insufficientReason: null,
          officialFallbackUrl: 'https://portal.nelf.gov.ng/',
          escalation: null,
          responseMode: 'conversation',
        },
      }
      setMessages((prev) => [...prev, errMsg])
      clearFile()
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void sendQuestion(input)
  }

  function onFeedback(id: string, vote: 'up' | 'down', intent?: string) {
    setFeedback((prev) => ({ ...prev, [id]: vote }))
    try {
      trackFeedback({ messageId: id, vote, intent })
    } catch {
      /* ignore */
    }
    if (vote === 'up') markShareValue()
  }

  const visibleSuggestions = showAllSuggestions ? SUGGESTIONS : SUGGESTIONS.slice(0, 5)
  const suggestionList = (
    <div className="flex flex-col gap-1">
      {visibleSuggestions.map((s) => (
        <button
          key={s}
          type="button"
          disabled={busy}
          onClick={() => void sendQuestion(s)}
          className="rounded-full border border-ink/10 bg-white/80 px-2.5 py-1 text-left text-[12px] leading-snug text-ink/70 hover:border-brand/40"
        >
          {s}
        </button>
      ))}
      {!showAllSuggestions && SUGGESTIONS.length > 5 && (
        <button
          type="button"
          onClick={() => setShowAllSuggestions(true)}
          className="px-1 py-0.5 text-left text-[11px] font-medium text-brand"
        >
          More questions…
        </button>
      )}
    </div>
  )

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-lg flex-col px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
      <div className="mb-2 flex items-center gap-2">
        <Link to="/" className="shrink-0" aria-label="Home">
          <img
            src="/brand/logo.svg"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg object-contain"
          />
        </Link>
        <select
          value={institutionId || ''}
          onChange={(e) => setInstitutionId(e.target.value || null)}
          className="min-w-0 flex-1 rounded-full border border-ink/10 bg-white px-3 py-1.5 text-sm"
          aria-label="Your school"
        >
          <option value="">School (optional)</option>
          {institutions.map((i) => (
            <option key={i.id} value={i.id}>
              {schoolOptionLabel(i)}
            </option>
          ))}
          <option value={OTHER_INSTITUTION}>Other</option>
        </select>
        <button
          type="button"
          className="shrink-0 text-xs font-medium text-ink/60"
          onClick={() => {
            setMessages([])
            setSlots(createInitialSlots())
            clearFile()
          }}
        >
          New
        </button>
        <ShareGuide variant="icon" />
        <button
          type="button"
          className="shrink-0 text-xs font-medium text-ink/60"
          onClick={() => navigate('/')}
        >
          Exit
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <div className="rounded-xl border border-ink/10 bg-white/90 px-3 py-2.5">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink/45">
              Ask about NELFUND
            </p>
            {suggestionList}
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={
                m.role === 'user'
                  ? 'max-w-[90%] rounded-2xl bg-brand px-3 py-2 text-sm text-white'
                  : 'max-w-[95%] rounded-2xl border border-ink/10 bg-white px-3 py-2 text-sm text-ink'
              }
            >
              {m.imagePreview && (
                <img
                  src={m.imagePreview}
                  alt="upload"
                  className="mb-2 max-h-40 rounded-lg"
                />
              )}
              {m.role === 'assistant' && m.answer ? (
                <>
                  {!m.answer.answer && m.text ? (
                    <LinkifiedText text={m.text} className="text-sm text-ink" />
                  ) : null}
                  <AnswerCards
                    answer={m.answer}
                    onSuggestion={(q) => void sendQuestion(q)}
                    feedback={feedback[m.id]}
                    onFeedback={(v) => onFeedback(m.id, v, m.answer?.intent)}
                  />
                </>
              ) : (
                <LinkifiedText text={m.text} />
              )}
            </div>
          </div>
        ))}
        {messages.some((m) => m.role === 'assistant') && (
          <div className="flex justify-center pt-1">
            <WhatsAppClassLink source="ask-after-answer" />
          </div>
        )}
        <ShareSoftPrompt />
        {(busy || ocrBusy) && (
          <p className="text-center text-xs text-ink/50">
            {ocrBusy ? 'Reading screenshot…' : 'Thinking…'}
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-0 z-20 border-t border-ink/10 bg-[#f7f8f5] px-0 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {preview && (
          <div className="mb-2 flex items-center gap-2 px-1">
            <img src={preview} alt="preview" className="h-12 w-12 rounded object-cover" />
            <button type="button" className="text-xs text-red-600" onClick={clearFile}>
              Remove
            </button>
          </div>
        )}
        <form onSubmit={onSubmit} className="flex w-full items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFile}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink/15 bg-white text-xl text-ink"
            aria-label="Attach image"
            disabled={busy || ocrBusy}
          >
            +
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about NELFUND"
            className="min-h-11 min-w-0 flex-1 rounded-full border border-ink/15 bg-white px-4 py-2.5 text-sm text-ink"
          />
          <button
            type="submit"
            disabled={busy || ocrBusy || (!input.trim() && !ocrText && !preview)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1B5E3B] text-lg font-bold text-white shadow-sm disabled:opacity-40"
            aria-label="Send"
          >
            →
          </button>
        </form>
        <p className="pt-1.5 text-center text-[10px] text-ink/40">
          Independent student guide · Verify critical details on the official portal
        </p>
      </div>
    </div>
  )
}
