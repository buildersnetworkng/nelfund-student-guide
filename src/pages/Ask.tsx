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
import { LinkifiedText } from '../components/LinkifiedText'
import { trackAiQuestion, trackFeedback } from '../lib/analytics'
import ShareGuide from '../components/ShareGuide'

/** From live admin common intents / unknown topic buckets */
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
      intent: (m.answer?.intent || currentIntent || undefined) as ConversationTurn['intent'],
    }))
}

export default function Ask() {
  const { institutionId, setInstitutionId } = useInstitution()
  const [slots, setSlots] = useState<ConversationSlots>(() => createInitialSlots(institutionId))
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [ocrText, setOcrText] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [helpfulShareId, setHelpfulShareId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({})

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  useEffect(() => {
    return () => {
      void disposeOcrWorker()
    }
  }, [])

  async function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreview(url)
    try {
      const ocr = await extractTextFromImage(f)
      const text = typeof ocr === 'string' ? ocr : ocr?.text
      setOcrText(text && text.trim().length >= 8 ? text : null)
    } catch {
      setOcrText(null)
    }
  }

  function clearFile() {
    setFile(null)
    setPreview(null)
    setOcrText(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function sendQuestion(raw: string) {
    const text = raw.trim()
    if ((!text && !ocrText) || busy) return
    setBusy(true)
    setInput('')

    const userMsg: ChatMessage = {
      id: uid('user'),
      role: 'user',
      text: text || '[screenshot]',
      imagePreview: preview,
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMsg])

    try {
      const history = historyFromMessages(messages, slots.intent)
      const result = await processUserTurn({
        userText: text,
        ocrText,
        imagePreview: preview,
        uiInstitutionId: institutionId,
        slots: {
          ...slots,
          institutionId: institutionId || slots.institutionId,
        },
        history,
      })

      const nextSlots = result.slots
      const asstMsgs = result.messages.filter((m) => m.role === 'assistant')
      const asst = asstMsgs.find((m) => m.answer) || asstMsgs[0]
      const intent = asst?.answer?.intent || nextSlots.intent || 'unknown'
      const resolutionClosed = !!asst?.answer?.hasEvidence && !asst?.answer?.insufficientReason
      const escalationFired = !!asst?.answer?.escalation

      trackAiQuestion({
        intent,
        institutionId: nextSlots.institutionId || institutionId,
        hasImage: !!ocrText,
        unresolved: !!asst?.answer?.insufficientReason || intent === 'unknown',
        isNewConversation: messages.length === 0,
        resolutionClosed,
        escalationFired,
        userText: text || (ocrText ? ocrText.slice(0, 200) : null),
      })

      setSlots(nextSlots)
      setMessages((prev) => [...prev, ...asstMsgs])
      clearFile()
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: uid('asst'),
          role: 'assistant',
          text: 'Something went wrong on this device. Try again, or open portal.nelf.gov.ng directly.',
          timestamp: Date.now(),
        },
      ])
    } finally {
      setBusy(false)
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    await sendQuestion(input)
  }

  function onFeedback(messageId: string, vote: 'up' | 'down', intent?: string | null) {
    if (feedback[messageId]) return
    trackFeedback(vote, {
      intent: intent || slots.intent,
      institutionId: slots.institutionId || institutionId,
    })
    setFeedback((prev) => ({ ...prev, [messageId]: vote }))
    if (vote === 'up') setHelpfulShareId(messageId)
    else if (helpfulShareId === messageId) setHelpfulShareId(null)
  }

  const schoolLabel =
    institutions.find((i) => i.id === institutionId)?.shortName ||
    institutions.find((i) => i.id === institutionId)?.name ||
    (institutionId === OTHER_INSTITUTION ? 'Other school' : null)

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper">
      <header className="sticky top-0 z-20 border-b border-forest-100 bg-white/95 px-3 py-2.5 backdrop-blur-xl sm:px-4">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <img
              src="/brand/logo.svg"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 rounded-lg object-contain ring-1 ring-forest-900/10"
              decoding="async"
            />
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold tracking-tight text-forest-800">
                NELFUND Support
              </p>
              <label className="sr-only" htmlFor="ask-school">
                School
              </label>
              <select
                id="ask-school"
                className="max-w-[11rem] truncate border-0 bg-transparent p-0 text-[11px] font-medium text-ink/55 focus:outline-none focus:ring-0 sm:max-w-[14rem]"
                value={institutionId || ''}
                onChange={(e) => setInstitutionId(e.target.value || null)}
              >
                <option value="">Select school</option>
                {institutions.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.shortName || i.name}
                  </option>
                ))}
                <option value={OTHER_INSTITUTION}>Other / not listed</option>
              </select>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              className="rounded-full px-2 py-1.5 text-xs font-medium text-forest-700 hover:bg-forest-50"
              onClick={() => {
                setMessages([])
                setSlots(createInitialSlots(institutionId))
                clearFile()
                setHelpfulShareId(null)
                setFeedback({})
              }}
            >
              New
            </button>
            <ShareGuide variant="icon" />
            <Link
              to="/"
              className="rounded-full px-2 py-1.5 text-xs font-medium text-ink/55 hover:bg-forest-50 hover:text-ink"
            >
              Exit
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-lg flex-1 px-3 py-4 sm:px-4">
        <div className="space-y-3 pb-32">
          {messages.length === 0 && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-forest-100 bg-white p-4 shadow-sm">
                <p className="font-display text-sm font-semibold text-ink">
                  Ask anything about NELFUND
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/60">
                  Application steps, pending status, portal errors, school fees vs upkeep. Pidgin or
                  English is fine.
                </p>
                {schoolLabel && (
                  <p className="mt-2 text-xs text-forest-700">School set: {schoolLabel}</p>
                )}
              </div>
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-ink/45">
                Frequent student questions
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={busy}
                    onClick={() => void sendQuestion(q)}
                    className="rounded-full border border-forest-100 bg-white px-3.5 py-2 text-left text-xs font-medium text-ink/75 shadow-sm transition hover:border-forest-300 hover:bg-forest-50 hover:text-ink disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className="space-y-1.5">
              {m.role === 'user' ? (
                <div className="ml-auto max-w-[92%] rounded-2xl rounded-br-md bg-forest-800 px-3.5 py-2.5 text-sm text-paper shadow-sm">
                  {m.imagePreview && (
                    <img
                      src={m.imagePreview}
                      alt="Uploaded"
                      className="mb-2 max-h-40 rounded-lg object-cover"
                    />
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                </div>
              ) : (
                <>
                  <div className="mr-auto max-w-[92%] rounded-2xl rounded-bl-md border border-forest-100 bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm">
                    <LinkifiedText text={m.text} className="leading-relaxed" />
                    {m.answer && <AnswerCards answer={m.answer} />}
                  </div>
                  <div className="mr-auto max-w-[92%] space-y-2 px-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-ink/55">
                      <span className="text-[11px] font-medium">
                        {feedback[m.id]
                          ? feedback[m.id] === 'up'
                            ? 'Thanks, marked helpful'
                            : 'Thanks, we will use this to improve'
                          : 'Was this helpful?'}
                      </span>
                      {!feedback[m.id] && (
                        <>
                          <button
                            type="button"
                            onClick={() => onFeedback(m.id, 'up', m.answer?.intent)}
                            className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-forest-800 shadow-sm ring-1 ring-forest-100 hover:bg-forest-50"
                            aria-label="Helpful"
                          >
                            👍 Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => onFeedback(m.id, 'down', m.answer?.intent)}
                            className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-ink/70 shadow-sm ring-1 ring-forest-100 hover:bg-rust-50"
                            aria-label="Not helpful"
                          >
                            👎 No
                          </button>
                        </>
                      )}
                    </div>
                    {helpfulShareId === m.id && (
                      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-forest-50 px-2.5 py-2 text-xs text-ink/70">
                        <span>If this helped, send the guide to another student.</span>
                        <ShareGuide variant="button" className="!min-h-[32px] !px-3 !py-1 !text-xs" />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
          {busy && <p className="text-xs text-ink/50">Thinking…</p>}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-forest-100 bg-white/95 px-3 py-3 backdrop-blur-xl sm:px-4">
        <div className="mx-auto max-w-lg">
          {preview && (
            <div className="mb-2 flex items-center gap-2 text-xs text-ink/60">
              <img
                src={preview}
                alt="upload"
                className="h-12 w-12 rounded-lg object-cover ring-1 ring-forest-100"
              />
              <button type="button" className="font-medium text-forest-700" onClick={clearFile}>
                Remove
              </button>
            </div>
          )}
          <form onSubmit={onSubmit} className="flex items-end gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
            <button
              type="button"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-forest-100 bg-white text-lg text-forest-700 shadow-sm hover:bg-forest-50"
              onClick={() => fileRef.current?.click()}
              aria-label="Attach screenshot"
            >
              +
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={1}
              placeholder="Ask anything about NELFUND..."
              className="max-h-28 min-h-[44px] flex-1 resize-none rounded-2xl border border-forest-100 bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm placeholder:text-ink/40 focus:border-forest-300 focus:outline-none focus:ring-2 focus:ring-forest-100"
            />
            <button
              type="submit"
              disabled={busy}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-700 text-white shadow-sm transition hover:bg-forest-600 disabled:opacity-50"
              aria-label="Send"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                <path d="M12 4l-1.4 1.4 5.6 5.6H4v2h12.2l-5.6 5.6L12 20l8-8-8-8z" />
              </svg>
            </button>
          </form>
          <p className="mt-2 text-center text-[10px] text-ink/40">
            Independent student guide · Verify critical details on the official portal
          </p>
        </div>
      </div>
    </div>
  )
}
