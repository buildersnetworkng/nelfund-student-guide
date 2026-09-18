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
  const { institutionId, setInstitutionId } = useInstitution()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [slots, setSlots] = useState<ConversationSlots>(() => createInitialSlots())
  const [ocrText, setOcrText] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({})
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

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
    if (fileRef.current) fileRef.current.value = ''
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    try {
      const text = await extractTextFromImage(file)
      setOcrText(text)
    } catch {
      setOcrText(null)
    }
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
    // Show your message in the green bubble immediately
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
      // Keep the green user bubble; only append AI replies
      setMessages((prev) => [...prev, ...asstMsgs])
      if (asstMsgs.length > 0) markShareValue()
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

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void sendQuestion(input)
  }

  function onFeedback(id: string, vote: 'up' | 'down', intent?: string) {
    setFeedback((prev) => ({ ...prev, [id]: vote }))
    trackFeedback(vote, { intent, institutionId })
    if (vote === 'up') markShareValue()
  }

  const suggestionList = (
    <div className="flex flex-col gap-1.5">
      {SUGGESTIONS.map((s) => (
        <button
          key={s}
          type="button"
          disabled={busy}
          onClick={() => void sendQuestion(s)}
          className="rounded-full border border-forest-100 bg-white px-3 py-2 text-left text-xs text-ink/70 shadow-sm transition hover:border-forest-300 hover:bg-forest-50 hover:text-ink disabled:opacity-50"
        >
          {s}
        </button>
      ))}
    </div>
  )

  const lastAssistantId = [...messages].reverse().find((m) => m.role === 'assistant')?.id

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col bg-paper">
      <ShareSoftPrompt />
      <header className="sticky top-0 z-20 border-b border-forest-100/80 bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2 sm:px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-700 text-xs font-bold text-white">
              N
            </span>
            <span className="hidden text-sm font-semibold text-ink sm:inline">NELFUND Support</span>
          </Link>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <select
              className="max-w-[9rem] truncate rounded-full border border-forest-100 bg-white px-2.5 py-1.5 text-xs text-ink sm:max-w-[12rem]"
              value={institutionId || ''}
              onChange={(e) => setInstitutionId(e.target.value || null)}
              aria-label="Select school"
            >
              <option value="">Select school</option>
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>
                  {schoolOptionLabel(i)}
                </option>
              ))}
              <option value={OTHER_INSTITUTION}>Other / not listed</option>
            </select>
            <button
              type="button"
              onClick={() => {
                setMessages([])
                setSlots(createInitialSlots())
                clearFile()
                setFeedback({})
              }}
              className="h-7 px-1.5 text-[11px] font-medium text-forest-700"
            >
              New
            </button>
            <ShareGuide
              variant="icon"
              className="!h-7 !min-h-0 !w-7 !gap-0 !border-0 !bg-transparent !px-0 !shadow-none [&_span]:hidden"
            />
            <Link to="/" className="h-7 px-1.5 text-[11px] font-medium leading-7 text-ink/55">
              Exit
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-3 py-4 sm:px-4 lg:flex-row lg:gap-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-ink/35">
            Frequent student questions
          </p>
          {suggestionList}
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          {messages.length === 0 && (
            <div className="mb-4">
              <h1 className="font-display text-lg font-semibold text-ink sm:text-xl">
                Ask anything about NELFUND
              </h1>
              <p className="mt-1 text-sm text-ink/55">
                Application steps, pending status, portal errors, school fees vs upkeep. Pidgin or
                English is fine.
              </p>
              <div className="lg:hidden">
                <p className="mb-2 mt-4 px-1 text-[10px] font-semibold uppercase tracking-wide text-ink/35">
                  Frequent student questions
                </p>
                {suggestionList}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className="mb-3 space-y-1.5">
              {m.role === 'user' ? (
                <div
                  className="bubble-user ml-auto max-w-[92%] rounded-2xl rounded-br-md px-3.5 py-2.5 text-sm shadow-md lg:max-w-[70%]"
                  style={{ backgroundColor: '#0A4F2E', color: '#FFFFFF' }}
                >
                  {m.imagePreview && (
                    <img
                      src={m.imagePreview}
                      alt="Uploaded"
                      className="mb-2 max-h-40 rounded-lg object-cover"
                    />
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed" style={{ color: '#FFFFFF' }}>
                    {m.text || '\u2026'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="mr-auto max-w-[92%] rounded-2xl rounded-bl-md border border-forest-100 bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm lg:max-w-[80%]">
                    <LinkifiedText text={m.text} className="leading-relaxed" />
                    {m.answer && <AnswerCards answer={m.answer} />}
                  </div>
                  <div className="mr-auto max-w-[92%] space-y-2 px-1 lg:max-w-[80%]">
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
                            className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-forest-700 shadow-sm ring-1 ring-forest-100 hover:bg-forest-50"
                            aria-label="Helpful"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => onFeedback(m.id, 'down', m.answer?.intent)}
                            className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-ink/60 shadow-sm ring-1 ring-forest-100 hover:bg-forest-50"
                            aria-label="Not helpful"
                          >
                            No
                          </button>
                        </>
                      )}
                    </div>
                    {m.id === lastAssistantId && (
                      <div className="pt-1">
                        <WhatsAppClassLink
                          source="ask-after-answer"
                          className="!min-h-[36px] !px-3 !py-1.5 !text-xs"
                        />
                        <p className="mt-1 text-[11px] leading-relaxed text-ink/40">
                          Search your class or department group name. Do not tap one classmate.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}

          {busy && (
            <div className="mb-3 mr-auto max-w-[92%] rounded-2xl rounded-bl-md border border-forest-100 bg-white px-3.5 py-2.5 text-sm text-ink/50 shadow-sm">
              <span className="typing-dots">
                <span />
                <span />
                <span />
              </span>
            </div>
          )}

          <div ref={bottomRef} />
        </main>
      </div>

      <div className="sticky bottom-0 border-t border-forest-100/80 bg-paper/95 backdrop-blur">
        <form onSubmit={onSubmit} className="mx-auto flex max-w-6xl items-end gap-2 px-3 py-3 sm:px-4">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-forest-100 bg-white text-lg text-forest-700 shadow-sm hover:bg-forest-50"
            aria-label="Attach image"
          >
            +
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void sendQuestion(input)
              }
            }}
            rows={1}
            placeholder="Ask anything about NELFUND..."
            className="max-h-28 min-h-[44px] flex-1 resize-none rounded-2xl border border-forest-100 bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-300"
          />
          <button
            type="submit"
            disabled={busy || (!input.trim() && !ocrText)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-700 text-white shadow-sm transition hover:bg-forest-600 disabled:opacity-50"
            aria-label="Send"
          >
            →
          </button>
        </form>
        <p className="pb-2 text-center text-[10px] text-ink/40">
          Independent student guide · Verify critical details on the official portal
        </p>
      </div>
    </div>
  )
}
