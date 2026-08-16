import { FormEvent, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  processUserTurn,
  createInitialSlots,
  createWelcomeMessage,
  extractTextFromImage,
  disposeOcrWorker,
} from '../lib/ai'
import type { ChatMessage, ConversationSlots, ConversationTurn } from '../lib/ai'
import { useInstitution } from '../context/InstitutionContext'
import InstitutionNotice from '../components/InstitutionNotice'
import { AnswerCards } from '../components/AnswerCards'

const EXAMPLE_PROMPTS = [
  "I'm trying to open that nelfund stuff but it is showing missing information",
  'The nelfund portal is not accepting my Jamb registration number',
  'My school no dey show for the portal',
  "I've submitted since and this thing is still pending",
  'Bro this NELFUND thing no dey work, e dey show missing info',
]

export default function Ask() {
  const { institutionId } = useInstitution()
  const [messages, setMessages] = useState<ChatMessage[]>(() => [createWelcomeMessage()])
  const [slots, setSlots] = useState<ConversationSlots>(() => createInitialSlots(institutionId))
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [busyLabel, setBusyLabel] = useState('Thinking…')
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

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
      setBusyLabel('Thinking…')
    }

    await new Promise((r) => setTimeout(r, 40))

    const hist = historyFromMessages(messages, slots.intent)
    const result = processUserTurn({
      userText: text,
      ocrText,
      imagePreview,
      uiInstitutionId: institutionId,
      slots,
      history: hist,
    })

    setSlots(result.slots)
    setMessages((prev) => [...prev, ...result.messages])
    setBusy(false)
    setBusyLabel('Thinking…')
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void handleTurn(input)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          role: 'assistant',
          text: 'Please upload an image file (screenshot or photo of the portal error).',
          isFollowUp: true,
          timestamp: Date.now(),
        },
      ])
      return
    }
    void handleTurn(input, file)
  }

  function clearSession() {
    messages.forEach((m) => {
      if (m.imagePreview?.startsWith('blob:')) URL.revokeObjectURL(m.imagePreview)
    })
    setMessages([createWelcomeMessage()])
    setSlots(createInitialSlots(institutionId))
    setInput('')
    setBusy(false)
  }

  return (
    <div className="container-page flex min-h-[calc(100vh-8rem)] flex-col py-6 sm:py-10">
      <div className="shrink-0">
        <p className="eyebrow">Support agent</p>
        <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">Talk through your NELFUND problem</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink/65">
          Chat naturally or upload a portal screenshot. The agent asks only what it needs, diagnoses from
          verified knowledge, and helps you escalate to the right office — without inventing contacts or
          policies.
        </p>
        <div className="mt-2">
          <InstitutionNotice />
        </div>
      </div>

      <div className="mt-5 flex min-h-0 flex-1 flex-col rounded-2xl border border-forest-700/15 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-forest-700/10 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-forest-600" />
            <span className="text-xs font-medium text-ink/70">NELFUND support session</span>
            {slots.institutionName && (
              <span className="rounded-full bg-forest-50 px-2 py-0.5 text-[10px] font-semibold text-forest-800">
                {slots.institutionName}
              </span>
            )}
            {slots.intent && slots.intent !== 'unknown' && (
              <span className="hidden rounded-full bg-ink/5 px-2 py-0.5 text-[10px] text-ink/50 sm:inline">
                {slots.intent.replace(/-/g, ' ')}
              </span>
            )}
          </div>
          <button type="button" onClick={clearSession} className="text-xs font-medium text-ink/50 hover:text-ink">
            New session
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:px-5" style={{ maxHeight: 'min(60vh, 560px)' }}>
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed sm:max-w-[85%] ${
                  m.role === 'user'
                    ? 'bg-forest-700 text-white'
                    : 'border border-forest-700/10 bg-forest-50/60 text-ink'
                }`}
              >
                {m.imagePreview && (
                  <img
                    src={m.imagePreview}
                    alt="Uploaded portal screenshot"
                    className="mb-2 max-h-48 rounded-lg border border-black/10 object-contain"
                  />
                )}
                <p className="whitespace-pre-wrap">{m.text}</p>
                {m.answer && <AnswerCards answer={m.answer} />}
              </div>
            </div>
          ))}

          {busy && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-forest-700/10 bg-forest-50/60 px-3.5 py-2.5 text-sm text-ink/60">
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-forest-600" />
                  {busyLabel}
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-forest-700/10 px-3 py-3 sm:px-4">
          {messages.length <= 2 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {EXAMPLE_PROMPTS.slice(0, 3).map((ex) => (
                <button
                  key={ex}
                  type="button"
                  disabled={busy}
                  onClick={() => void handleTurn(ex)}
                  className="rounded-full border border-forest-700/15 bg-white px-2.5 py-1 text-left text-[11px] text-ink/65 hover:border-forest-600/40 hover:text-ink"
                >
                  {ex.length > 52 ? `${ex.slice(0, 52)}…` : ex}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={onSubmit} className="flex items-end gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={onFileChange}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-forest-700/20 bg-white text-forest-800 hover:bg-forest-50 disabled:opacity-50"
              title="Upload screenshot"
              aria-label="Upload screenshot of portal error"
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
            <label htmlFor="chat-input" className="sr-only">
              Message
            </label>
            <textarea
              id="chat-input"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void handleTurn(input)
                }
              }}
              placeholder='e.g. "Missing information" or "JAMB no dey accept"'
              className="max-h-28 min-h-[44px] flex-1 resize-y rounded-2xl border border-forest-700/20 bg-white px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30"
              disabled={busy}
            />
            <button type="submit" disabled={busy || !input.trim()} className="btn-primary h-11 shrink-0 px-5">
              Send
            </button>
          </form>
          <p className="mt-1.5 text-[10px] text-ink/40">
            Screenshots stay on your device for OCR only. Never share passwords, OTP, PIN, NIN, or BVN in chat.
            {' · '}
            <Link to="/faq" className="underline">
              FAQ
            </Link>
            {' · '}
            <Link to="/troubleshooting" className="underline">
              Troubleshooting list
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
