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
import { ShareGuide } from '../components/ShareGuide'

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
  const [slots, setSlots] = useState<ConversationSlots>(() => createInitialSlots())
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [ocrText, setOcrText] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

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
      const text = await extractTextFromImage(f)
      setOcrText(text || null)
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

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text && !file && !ocrText) return
    setBusy(true)
    setInput('')
    const hadUserMessage = messages.some((m) => m.role === 'user')
    try {
      const hist = historyFromMessages(messages, slots.intent)
      const result = await processUserTurn({
        userText: text || (ocrText ? 'Please read this portal screenshot.' : ''),
        ocrText,
        imagePreview: preview,
        uiInstitutionId: institutionId === OTHER_INSTITUTION ? null : institutionId,
        slots,
        history: hist,
      })
      const nextSlots = result.slots
      const assistantWithAnswer = result.messages.find((m) => m.role === 'assistant' && m.answer)
      const intentRaw = assistantWithAnswer?.answer?.intent || nextSlots.intent || null
      const intent =
        intentRaw && intentRaw !== 'unknown' && !String(intentRaw).endsWith(':unknown')
          ? intentRaw
          : 'current-information'
      const answer = assistantWithAnswer?.answer
      const unresolved =
        !answer || (answer.clarifyingQuestions?.length ?? 0) > 0 || !result.diagnosed
      const resolutionClosed =
        result.diagnosed &&
        Boolean(answer) &&
        (answer?.hasEvidence !== false || Boolean(answer?.escalation))
      const escalationFired = Boolean(answer?.escalation)

      trackAiQuestion({
        intent,
        institutionId: nextSlots.institutionId || institutionId,
        hasImage: !!file,
        unresolved,
        isNewConversation: !hadUserMessage,
        resolutionClosed,
        escalationFired,
        userText: text || (ocrText ? ocrText.slice(0, 200) : null),
      })

      setSlots(nextSlots)
      setMessages((prev) => [...prev, ...result.messages])
      clearFile()
    } catch (err) {
      console.error(err)
      setMessages((prev) => [
        ...prev,
        {
          id: uid('user'),
          role: 'user',
          text: text || '[screenshot]',
          timestamp: Date.now(),
        },
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

  function onFeedback(messageId: string, vote: 'up' | 'down', intent?: string | null) {
    trackFeedback(vote, {
      intent: intent || slots.intent,
      institutionId: slots.institutionId || institutionId,
    })
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-canvas">
      <header className="sticky top-0 z-10 border-b border-ink/10 bg-canvas/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-brand">NELFUND Support</p>
            <h1 className="text-base font-semibold text-ink">Ask</h1>
          </div>
          <div className="flex items-center gap-2">
            <ShareGuide compact />
            <Link to="/" className="text-sm text-ink/60 hover:text-ink">
              Exit
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        <label className="mb-3 block text-xs font-medium text-ink/60">School (optional)</label>
        <select
          className="mb-4 w-full rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm"
          value={institutionId || ''}
          onChange={(e) => setInstitutionId(e.target.value || null)}
        >
          <option value="">Select institution</option>
          {institutions.map((i) => (
            <option key={i.id} value={i.id}>
              {i.shortName || i.name}
            </option>
          ))}
          <option value={OTHER_INSTITUTION}>Other / not listed</option>
        </select>

        <div className="space-y-3 pb-28">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-ink/10 bg-white p-4 text-sm text-ink/70">
              Ask about apply, login, pending status, JAMB, school fees vs upkeep, or paste a portal error.
              Pidgin is fine. Official portal: portal.nelf.gov.ng
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={
                m.role === 'user'
                  ? 'ml-8 rounded-2xl bg-brand px-3 py-2 text-sm text-white'
                  : 'mr-4 rounded-2xl border border-ink/10 bg-white px-3 py-2 text-sm text-ink'
              }
            >
              <p className="whitespace-pre-wrap">{m.text}</p>
              {m.answer && <AnswerCards answer={m.answer} />}
              {m.role === 'assistant' && (
                <div className="mt-2 flex gap-2 text-xs text-ink/50">
                  <button type="button" onClick={() => onFeedback(m.id, 'up', m.answer?.intent)}>
                    Helpful
                  </button>
                  <button type="button" onClick={() => onFeedback(m.id, 'down', m.answer?.intent)}>
                    Not helpful
                  </button>
                </div>
              )}
            </div>
          ))}
          {busy && <p className="text-xs text-ink/50">Thinking…</p>}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-ink/10 bg-canvas/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-lg">
          {preview && (
            <div className="mb-2 flex items-center gap-2 text-xs">
              <img src={preview} alt="upload" className="h-12 w-12 rounded object-cover" />
              <button type="button" className="text-brand" onClick={clearFile}>
                Remove
              </button>
            </div>
          )}
          <form onSubmit={onSubmit} className="flex items-end gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
            <button
              type="button"
              className="rounded-xl border border-ink/10 px-2 py-2 text-sm"
              onClick={() => fileRef.current?.click()}
              aria-label="Attach screenshot"
            >
              ＋
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={1}
              placeholder="Ask in English or Pidgin…"
              className="max-h-28 min-h-[40px] flex-1 resize-none rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-brand px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              ↑
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
