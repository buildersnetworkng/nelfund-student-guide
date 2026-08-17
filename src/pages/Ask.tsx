import { FormEvent, ChangeEvent, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  processUserTurn,
  createInitialSlots,
  extractTextFromImage,
  disposeOcrWorker,
} from '../lib/ai'
import type { ChatMessage, ConversationSlots, ConversationTurn } from '../lib/ai'
import { useInstitution } from '../context/InstitutionContext'
import { AnswerCards } from '../components/AnswerCards'
import { trackAiQuestion } from '../lib/analytics'

const SUGGESTIONS = [
  'My NELFUND application is pending',
  'My school is not showing on the portal',
  "I'm seeing Missing Information",
  'How do I apply for NELFUND?',
  'The portal is not accepting my JAMB number',
]

export default function Ask() {
  const { institutionId } = useInstitution()
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
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingPreview, setPendingPreview] = useState<string | null>(null)
  const [showAttachMenu, setShowAttachMenu] = useState(false)

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
    const result = processUserTurn({
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
    const unresolved =
      !assistantWithAnswer?.answer ||
      intent === 'unknown' ||
      (assistantWithAnswer.answer.clarifyingQuestions?.length ?? 0) > 0

    trackAiQuestion({
      intent,
      institutionId: nextSlots.institutionId || institutionId,
      hasImage: !!file,
      unresolved,
      isNewConversation: !hadUserMessage,
    })

    setSlots(nextSlots)
    setMessages((prev) => [...prev, ...result.messages])
    setPendingFile(null)
    setPendingPreview(null)
    setBusy(false)
    setBusyLabel('Thinking…')
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void handleTurn(input, pendingFile)
  }

  function onFilePicked(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    setShowAttachMenu(false)
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          role: 'assistant',
          text: 'Please choose an image file (screenshot or photo of the portal error).',
          isFollowUp: true,
          timestamp: Date.now(),
        },
      ])
      return
    }
    if (pendingPreview?.startsWith('blob:')) URL.revokeObjectURL(pendingPreview)
    setPendingFile(file)
    setPendingPreview(URL.createObjectURL(file))
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
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-paper">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-forest-100 bg-paper/95 px-3 backdrop-blur-md sm:h-14 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            to="/"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-forest-700 text-xs font-bold text-gold-300"
            aria-label="Back to home"
          >
            N
          </Link>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">NELFUND AI</p>
            {slots.institutionName && (
              <p className="truncate text-[11px] text-forest-700">{slots.institutionName}</p>
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
              <div
                key={m.id}
                className={`slide-up flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'user' ? (
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-forest-700 px-4 py-2.5 text-sm leading-relaxed text-white">
                    {m.imagePreview && (
                      <img
                        src={m.imagePreview}
                        alt="Uploaded portal screenshot"
                        className="mb-2 max-h-48 rounded-lg object-contain"
                      />
                    )}
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  </div>
                ) : (
                  <div className="w-full max-w-full text-sm leading-relaxed text-ink">
                    {m.imagePreview && (
                      <img
                        src={m.imagePreview}
                        alt="Uploaded portal screenshot"
                        className="mb-2 max-h-48 rounded-lg border border-forest-100 object-contain"
                      />
                    )}
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{m.text}</p>
                    {m.answer && <AnswerCards answer={m.answer} />}
                  </div>
                )}
              </div>
            ))}

            {busy && (
              <div className="flex items-center gap-2 text-sm text-ink/50">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-forest-600" />
                {busyLabel}
              </div>
            )}
            <div ref={bottomRef} className="h-4" />
          </div>
        )}
      </div>

      <div
        className="shrink-0 border-t border-forest-100 bg-paper/95 px-3 pt-2 backdrop-blur-md sm:px-4"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto max-w-2xl">
          {pendingPreview && (
            <div className="mb-2 flex items-center gap-2 rounded-xl border border-forest-100 bg-white p-2">
              <img
                src={pendingPreview}
                alt="Selected screenshot"
                className="h-12 w-12 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-ink">Screenshot attached</p>
                <p className="text-[10px] text-ink/45">Don't include passwords, OTPs, or PINs.</p>
              </div>
              <button
                type="button"
                onClick={clearPendingImage}
                className="rounded-full px-2 py-1 text-xs font-medium text-rust-500 hover:bg-rust-100"
              >
                Remove
              </button>
            </div>
          )}

          <form
            onSubmit={onSubmit}
            className="flex items-end gap-2 rounded-2xl border border-forest-100 bg-white px-2 py-2 shadow-card"
          >
            <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={onFilePicked} />
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={onFilePicked}
            />

            <div className="relative shrink-0">
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowAttachMenu((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-forest-700 transition hover:bg-forest-50 disabled:opacity-50"
                aria-label="Attach photo or screenshot"
                aria-expanded={showAttachMenu}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M4 16l4.6-6.1a1 1 0 011.6 0L14 15l1.4-1.9a1 1 0 011.6 0L20 16M4 16h16M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="9" cy="8" r="1.5" fill="currentColor" />
                </svg>
              </button>
              {showAttachMenu && (
                <div className="absolute bottom-12 left-0 z-20 w-44 overflow-hidden rounded-xl border border-forest-100 bg-white shadow-lift">
                  <button
                    type="button"
                    className="block w-full px-3 py-2.5 text-left text-sm text-ink hover:bg-forest-50"
                    onClick={() => galleryRef.current?.click()}
                  >
                    Choose from gallery
                  </button>
                  <button
                    type="button"
                    className="block w-full border-t border-forest-100 px-3 py-2.5 text-left text-sm text-ink hover:bg-forest-50"
                    onClick={() => cameraRef.current?.click()}
                  >
                    Take photo
                  </button>
                </div>
              )}
            </div>

            <label htmlFor="chat-input" className="sr-only">
              Ask about NELFUND
            </label>
            <textarea
              ref={textareaRef}
              id="chat-input"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void handleTurn(input, pendingFile)
                }
              }}
              placeholder="Ask anything about NELFUND…"
              className="max-h-[140px] min-h-[40px] flex-1 resize-none bg-transparent px-1 py-2 text-sm text-ink placeholder:text-ink/35 focus:outline-none"
              disabled={busy}
            />

            <button
              type="submit"
              disabled={busy || (!input.trim() && !pendingFile)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest-700 text-paper transition hover:bg-forest-900 disabled:opacity-40"
              aria-label="Send message"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 19V5M12 5l-6 6M12 5l6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>
          <p className="mt-1.5 text-center text-[10px] text-ink/35">
            Independent student guide · Verify critical details on the official portal
          </p>
        </div>
      </div>
    </div>
  )
}
