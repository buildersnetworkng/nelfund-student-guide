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
import { trackAiQuestion, trackAiFeedback } from '../lib/analytics'

const SUGGESTIONS = [
  'My NELFUND application is pending',
  'My school is not showing on the portal',
  "I'm seeing Missing Information",
  'How do I apply for NELFUND?',
  'The portal is not accepting my JAMB number',
]

export default function Ask() {
  const { institutionId, institution, setInstitutionId } = useInstitution()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [slots, setSlots] = useState<ConversationSlots>(() => createInitialSlots(institutionId))
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [busyLabel, setBusyLabel] = useState('Thinking…')
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const schoolMenuRef = useRef<HTMLDivElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingPreview, setPendingPreview] = useState<string | null>(null)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [showSchoolMenu, setShowSchoolMenu] = useState(false)
  /** messageId → 'up' | 'down' — privacy-safe, session only */
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({})

  const hasConversation = messages.some((m) => m.role === 'user')

  useEffect(() => {
    setSlots((prev) => {
      if (!institutionId) return prev
      if (prev.institutionId === institutionId) return prev
      return createInitialSlots(institutionId)
    })
  }, [institutionId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  useEffect(() => {
    return () => {
      void disposeOcrWorker()
    }
  }, [])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }, [input])

  useEffect(() => {
    if (!showSchoolMenu) return
    function onPointerDown(e: MouseEvent | TouchEvent) {
      const el = schoolMenuRef.current
      if (el && !el.contains(e.target as Node)) setShowSchoolMenu(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowSchoolMenu(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [showSchoolMenu])

  const displaySchoolName =
    slots.institutionName ||
    institution?.name ||
    (institutionId === OTHER_INSTITUTION ? 'Other institution' : null)

  function handleSchoolChange(id: string | null) {
    setInstitutionId(id)
    setSlots(createInitialSlots(id))
    setShowSchoolMenu(false)
  }

  function historyFromMessages(msgs: ChatMessage[], currentIntent?: string | null): ConversationTurn[] {
    return msgs
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        text: m.text,
        intent: (m.answer?.intent || currentIntent || undefined) as ConversationTurn['intent'],
      }))
      .slice(-12)
  }

  async function handleTurn(userText: string, file?: File | null) {
    const text = userText.trim()
    if (!text && !file) return
    if (busy) return

    setBusy(true)
    setInput('')
    setShowAttachMenu(false)

    let ocrText: string | null = null
    let imagePreview: string | null = null

    if (file) {
      setBusyLabel('Reading screenshot…')
      imagePreview = URL.createObjectURL(file)
      try {
        const ocr = await extractTextFromImage(file)
        ocrText = ocr.lowSignal ? null : ocr.text
      } catch {
        ocrText = null
      }
    } else {
      setBusyLabel('Checking verified NELFUND information…')
    }

    await new Promise((r) => setTimeout(r, 40))

    const hist = historyFromMessages(messages, slots.intent)
    const hadUserMessage = messages.some((m) => m.role === 'user')
    const result = await processUserTurn({
      userText: text,
      ocrText,
      imagePreview,
      uiInstitutionId: institutionId,
      slots,
      history: hist,
    })

    const nextSlots = result.slots
    const assistantWithAnswer = result.messages.find((m) => m.role === 'assistant' && m.answer)
    const intent = assistantWithAnswer?.answer?.intent || nextSlots.intent || null
    const answer = assistantWithAnswer?.answer
    const unresolved =
      Boolean(answer?.escalation?.needed) ||
      intent === 'unknown' ||
      intent === 'offline:unknown'

    const resolutionClosed = Boolean(answer && !unresolved && answer.sources?.length)
    const escalationFired =
      Boolean(answer?.escalation?.needed) &&
      ((answer?.escalation?.institutionContacts?.length ?? 0) > 0 ||
        (answer?.escalation?.nelfundContacts?.length ?? 0) > 0)

    trackAiQuestion({
      intent: intent || 'unknown',
      institutionId: nextSlots.institutionId || institutionId,
      resolutionClosed,
      escalationFired,
      hadPriorTurns: hadUserMessage,
    })

    setSlots(nextSlots)
    setMessages((prev) => [...prev, ...result.messages])
    setBusy(false)
    setBusyLabel('Thinking…')
    clearPendingImage()
  }

  function onFeedback(messageId: string, vote: 'up' | 'down') {
    setFeedback((prev) => {
      if (prev[messageId] === vote) {
        const next = { ...prev }
        delete next[messageId]
        return next
      }
      return { ...prev, [messageId]: vote }
    })
    trackAiFeedback({
      vote,
      messageId,
      institutionId: slots.institutionId || institutionId,
    })
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void handleTurn(input, pendingFile)
  }

  function onFilePicked(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (pendingPreview?.startsWith('blob:')) URL.revokeObjectURL(pendingPreview)
    setPendingFile(file)
    setPendingPreview(URL.createObjectURL(file))
    setShowAttachMenu(false)
  }

  function clearPendingImage() {
    if (pendingPreview?.startsWith('blob:')) URL.revokeObjectURL(pendingPreview)
    setPendingFile(null)
    setPendingPreview(null)
  }

  function clearSession() {
    messages.forEach((m) => {
      if (m.imagePreview?.startsWith('blob:')) URL.revokeObjectURL(m.imagePreview)
    })
    clearPendingImage()
    setMessages([])
    setSlots(createInitialSlots(institutionId))
    setInput('')
    setBusy(false)
    setShowAttachMenu(false)
    setFeedback({})
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-paper">
      {/* Minimal AI header */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-forest-100 bg-paper/95 px-3 backdrop-blur-md sm:h-14 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            to="/"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-forest-700 text-xs font-bold text-gold-300"
            aria-label="Back to home"
          >
            N
          </Link>
          <div className="relative min-w-0" ref={schoolMenuRef}>
            <p className="truncate text-sm font-semibold text-ink">NELFUND AI</p>
            <button
              type="button"
              onClick={() => setShowSchoolMenu((v) => !v)}
              className="group flex max-w-[min(70vw,16rem)] items-center gap-1 truncate text-left text-[11px] font-medium text-forest-700 transition hover:text-forest-900"
              aria-haspopup="listbox"
              aria-expanded={showSchoolMenu}
              aria-label={
                displaySchoolName
                  ? `Current school: ${displaySchoolName}. Click to switch school`
                  : 'Select your school'
              }
            >
              <span className="truncate underline decoration-forest-300/60 underline-offset-2 group-hover:decoration-forest-600">
                {displaySchoolName || 'Select school'}
              </span>
              <svg
                className={`h-3 w-3 shrink-0 text-forest-600/70 transition group-hover:text-forest-800 ${showSchoolMenu ? 'rotate-180' : ''}`}
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 4.5L6 7.5L9 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {showSchoolMenu && (
              <div
                role="listbox"
                aria-label="Switch school"
                className="absolute left-0 top-full z-50 mt-1 max-h-64 w-[min(92vw,18rem)] overflow-y-auto rounded-xl border border-forest-100 bg-white py-1 shadow-lg ring-1 ring-black/5"
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={!institutionId}
                  onClick={() => handleSchoolChange(null)}
                  className={`flex w-full px-3 py-2 text-left text-xs transition hover:bg-forest-50 ${
                    !institutionId ? 'font-semibold text-forest-800' : 'text-ink/80'
                  }`}
                >
                  Not selected
                </button>
                {institutions.map((i) => (
                  <button
                    key={i.id}
                    type="button"
                    role="option"
                    aria-selected={institutionId === i.id}
                    onClick={() => handleSchoolChange(i.id)}
                    className={`flex w-full px-3 py-2 text-left text-xs transition hover:bg-forest-50 ${
                      institutionId === i.id ? 'font-semibold text-forest-800' : 'text-ink/80'
                    }`}
                  >
                    {i.name}
                  </button>
                ))}
                <button
                  type="button"
                  role="option"
                  aria-selected={institutionId === OTHER_INSTITUTION}
                  onClick={() => handleSchoolChange(OTHER_INSTITUTION)}
                  className={`flex w-full border-t border-forest-50 px-3 py-2 text-left text-xs transition hover:bg-forest-50 ${
                    institutionId === OTHER_INSTITUTION
                      ? 'font-semibold text-forest-800'
                      : 'text-ink/80'
                  }`}
                >
                  Other / not listed
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {hasConversation && (
            <button
              type="button"
              onClick={clearSession}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-forest-700 transition hover:bg-forest-50"
            >
              New chat
            </button>
          )}
          <Link
            to="/"
            className="rounded-full px-3 py-1.5 text-xs font-medium text-ink/50 transition hover:bg-forest-50 hover:text-ink"
          >
            Exit
          </Link>
        </div>
      </header>

      {/* Conversation / empty state */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {!hasConversation && !busy ? (
          <div className="mx-auto flex h-full max-w-2xl flex-col justify-center px-4 py-10 sm:px-6">
            <div className="fade-in text-center">
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                How can NELFUND AI help?
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink/55">
                Guidance on applications, portal errors, school records, and verified support contacts, based on official NELFUND information.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={busy}
                  onClick={() => void handleTurn(s)}
                  className="rounded-full border border-forest-100 bg-white px-3.5 py-2 text-left text-xs font-medium text-ink/75 shadow-sm transition hover:border-forest-300 hover:text-ink sm:text-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:px-6">
            {messages.map((m) => (
              <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={
                    m.role === 'user'
                      ? 'max-w-[85%] rounded-2xl rounded-br-md bg-forest-700 px-3.5 py-2.5 text-sm text-paper'
                      : 'max-w-[92%] space-y-2'
                  }
                >
                  {m.imagePreview && (
                    <img
                      src={m.imagePreview}
                      alt="Uploaded screenshot"
                      className="mb-2 max-h-48 rounded-xl border border-forest-100 object-contain"
                    />
                  )}
                  {m.role === 'user' ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                  ) : (
                    <>
                      <div className="rounded-2xl rounded-bl-md border border-forest-100 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-ink shadow-sm">
                        <p className="whitespace-pre-wrap">{m.text}</p>
                        {m.answer && <AnswerCards answer={m.answer} />}
                      </div>
                      <div className="flex items-center gap-1 px-1">
                        <button
                          type="button"
                          onClick={() => onFeedback(m.id, 'up')}
                          className={`rounded-full px-2 py-1 text-sm transition ${
                            feedback[m.id] === 'up'
                              ? 'bg-forest-50 text-forest-800'
                              : 'text-ink/40 hover:bg-forest-50 hover:text-ink/70'
                          }`}
                          aria-label="Helpful"
                          aria-pressed={feedback[m.id] === 'up'}
                        >
                          👍
                        </button>
                        <button
                          type="button"
                          onClick={() => onFeedback(m.id, 'down')}
                          className={`rounded-full px-2 py-1 text-sm transition ${
                            feedback[m.id] === 'down'
                              ? 'bg-rust-50 text-rust-700'
                              : 'text-ink/40 hover:bg-forest-50 hover:text-ink/70'
                          }`}
                          aria-label="Not helpful"
                          aria-pressed={feedback[m.id] === 'down'}
                        >
                          👎
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-forest-100 bg-white px-3.5 py-2.5 text-sm text-ink/55 shadow-sm">
                  {busyLabel}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-forest-100 bg-paper/95 px-3 py-3 backdrop-blur-md sm:px-5">
        <form onSubmit={onSubmit} className="mx-auto flex max-w-2xl flex-col gap-2">
          {pendingPreview && (
            <div className="flex items-center gap-2 rounded-xl border border-forest-100 bg-white px-2 py-1.5">
              <img src={pendingPreview} alt="Pending" className="h-12 w-12 rounded-lg object-cover" />
              <p className="flex-1 truncate text-xs text-ink/60">Screenshot attached</p>
              <button
                type="button"
                onClick={clearPendingImage}
                className="rounded-full px-2 py-1 text-xs font-semibold text-ink/50 hover:bg-forest-50 hover:text-ink"
              >
                Remove
              </button>
            </div>
          )}
          <div className="relative flex items-end gap-2 rounded-2xl border border-forest-100 bg-white px-2 py-1.5 shadow-sm focus-within:border-forest-300 focus-within:ring-2 focus-within:ring-forest-500/20">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAttachMenu((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-ink/45 transition hover:bg-forest-50 hover:text-ink"
                aria-label="Attach screenshot"
              >
                +
              </button>
              {showAttachMenu && (
                <div className="absolute bottom-full left-0 mb-1 w-40 overflow-hidden rounded-xl border border-forest-100 bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => galleryRef.current?.click()}
                    className="block w-full px-3 py-2 text-left text-xs text-ink/80 hover:bg-forest-50"
                  >
                    Photo library
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraRef.current?.click()}
                    className="block w-full px-3 py-2 text-left text-xs text-ink/80 hover:bg-forest-50"
                  >
                    Camera
                  </button>
                </div>
              )}
              <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFilePicked}
              />
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={onFilePicked}
              />
            </div>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void handleTurn(input, pendingFile)
                }
              }}
              rows={1}
              placeholder="Ask about NELFUND…"
              className="max-h-[140px] min-h-[36px] flex-1 resize-none bg-transparent py-2 text-sm text-ink outline-none placeholder:text-ink/35"
              disabled={busy}
            />
            <button
              type="submit"
              disabled={busy || (!input.trim() && !pendingFile)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-forest-700 text-sm font-semibold text-paper transition enabled:hover:bg-forest-800 disabled:opacity-40"
              aria-label="Send"
            >
              ↑
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
