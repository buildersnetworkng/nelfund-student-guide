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
      !answer ||
      intent === 'unknown' ||
      (answer.clarifyingQuestions?.length ?? 0) > 0 ||
      !result.diagnosed

    const resolutionClosed =
      result.diagnosed &&
      Boolean(answer) &&
      intent !== 'unknown' &&
      (answer?.hasEvidence !== false || Boolean(answer?.escalation))

    const escalationFired = Boolean(
      answer?.escalation &&
        ((answer.escalation.institutionContacts?.length ?? 0) > 0 ||
          (answer.escalation.nelfundContacts?.length ?? 0) > 0 ||
          answer.escalation.supportMessage),
    )

    trackAiQuestion({
      intent,
      institutionId: nextSlots.institutionId || institutionId,
      hasImage: !!file,
      unresolved,
      isNewConversation: !hadUserMessage,
      resolutionClosed,
      escalationFired,
      userText: text,
    })

    setSlots(nextSlots)
    setMessages((prev) => [...prev, ...result.messages])
    setPendingFile(null)
    setPendingPreview(null)
    setBusy(false)
    setBusyLabel('Thinking…')
  }

  function onFeedback(messageId: string, vote: 'up' | 'down', intent?: string | null) {
    if (feedback[messageId]) return
    setFeedback((prev) => ({ ...prev, [messageId]: vote }))
    trackFeedback(vote, {
      intent: intent || slots.intent,
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
    setShowAttachMenu(false)
    if (!file) return
    if (!file.type.startsWith('image/')) return
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
    setFeedback({})
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
          <div className="relative min-w-0" ref={schoolMenuRef}>
            <p className="truncate text-sm font-semibold text-ink">NELFUND AI</p>
            <button
              type="button"
              onClick={() => setShowSchoolMenu((v) => !v)}
              className={`group flex max-w-[min(70vw,16rem)] items-center gap-1 truncate rounded-full px-2 py-0.5 text-left text-[11px] font-semibold transition ${
                displaySchoolName
                  ? 'bg-forest-50 text-forest-800 hover:bg-forest-100'
                  : 'bg-gold-50 text-forest-900 ring-1 ring-gold-300/50 hover:bg-gold-100'
              }`}
              aria-haspopup="listbox"
              aria-expanded={showSchoolMenu}
              aria-label={
                displaySchoolName
                  ? `Current school: ${displaySchoolName}. Click to switch school`
                  : 'Select your school'
              }
            >
              <span className="truncate">{displaySchoolName || 'Select school'}</span>
              <svg
                className={`h-3 w-3 shrink-0 text-forest-600/70 transition ${showSchoolMenu ? 'rotate-180' : ''}`}
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
              >
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {showSchoolMenu && (
              <div role="listbox" aria-label="Switch school" className="absolute left-0 top-full z-50 mt-1 max-h-64 w-[min(92vw,18rem)] overflow-y-auto rounded-xl border border-forest-100 bg-white py-1 shadow-lg ring-1 ring-black/5">
                <button type="button" role="option" aria-selected={!institutionId} onClick={() => handleSchoolChange(null)} className={`flex w-full px-3 py-2 text-left text-xs transition hover:bg-forest-50 ${!institutionId ? 'font-semibold text-forest-800' : 'text-ink/80'}`}>Not selected</button>
                {institutions.map((i) => (
                  <button key={i.id} type="button" role="option" aria-selected={institutionId === i.id} onClick={() => handleSchoolChange(i.id)} className={`flex w-full px-3 py-2 text-left text-xs transition hover:bg-forest-50 ${institutionId === i.id ? 'font-semibold text-forest-800' : 'text-ink/80'}`}>{i.name}</button>
                ))}
                <button type="button" role="option" aria-selected={institutionId === OTHER_INSTITUTION} onClick={() => handleSchoolChange(OTHER_INSTITUTION)} className={`flex w-full border-t border-forest-50 px-3 py-2 text-left text-xs transition hover:bg-forest-50 ${institutionId === OTHER_INSTITUTION ? 'font-semibold text-forest-800' : 'text-ink/80'}`}>Other / not listed</button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {hasConversation && (
            <button type="button" onClick={clearSession} className="rounded-full px-3 py-1.5 text-xs font-semibold text-forest-700 transition hover:bg-forest-50">New chat</button>
          )}
          <Link to="/" className="rounded-full px-3 py-1.5 text-xs font-medium text-ink/50 transition hover:bg-forest-50 hover:text-ink">Exit</Link>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {!hasConversation && !busy ? (
          <div className="mx-auto flex h-full max-w-2xl flex-col justify-center px-4 py-10 sm:px-6">
            <div className="fade-in text-center">
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">How can NELFUND AI help?</h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink/55">Guidance on applications, portal errors, school records, and verified support contacts, based on official NELFUND information.</p>
            </div>
            {!institutionId && (
              <div className="mx-auto mt-5 max-w-md rounded-2xl border border-gold-300/40 bg-gold-50/80 px-4 py-3 text-left shadow-sm">
                <p className="text-xs font-semibold text-ink/80">Select your school first</p>
                <p className="mt-1 text-xs leading-relaxed text-ink/55">Choosing your institution improves portal advice and routes you to the right campus desk. Use the{' '}<button type="button" onClick={() => setShowSchoolMenu(true)} className="font-semibold text-forest-800 underline decoration-forest-300 underline-offset-2">school selector</button>{' '}above, or type your school name in the chat.</p>
              </div>
            )}
            {institutionId && institutionId !== 'other' && displaySchoolName && (
              <p className="mx-auto mt-4 max-w-md text-center text-xs text-forest-800/80">Helping students at <span className="font-semibold">{displaySchoolName}</span></p>
            )}
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" disabled={busy} onClick={() => void handleTurn(s)} className="rounded-full border border-forest-100 bg-white px-3.5 py-2 text-left text-xs font-medium text-ink/75 shadow-sm transition hover:border-forest-300 hover:text-ink sm:text-sm">{s}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:px-6">
            {messages.map((m) => (
              <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={m.role === 'user' ? 'max-w-[85%] rounded-2xl rounded-br-md bg-forest-700 px-3.5 py-2.5 text-sm text-paper' : 'max-w-[92%] space-y-2'}>
                  {m.imagePreview && (<img src={m.imagePreview} alt="Uploaded screenshot" className="mb-2 max-h-48 rounded-xl border border-forest-100 object-contain" />)}
                  {m.role === 'user' ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                  ) : (
                    <>
                      <div className="rounded-2xl rounded-bl-md border border-forest-100 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-ink shadow-sm">
                        <LinkifiedText text={m.text} className="text-sm leading-relaxed text-ink" />
                        {m.answer && <AnswerCards answer={m.answer} />}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 rounded-xl border border-forest-100/80 bg-forest-50/40 px-2.5 py-1.5">
                        <span className="text-[11px] font-medium text-ink/55">{feedback[m.id] ? (feedback[m.id] === 'up' ? 'Thanks — marked helpful' : 'Thanks — we will use this to improve') : 'Was this helpful?'}</span>
                        {!feedback[m.id] && (
                          <>
                            <button type="button" onClick={() => onFeedback(m.id, 'up', m.answer?.intent)} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-forest-800 shadow-sm ring-1 ring-forest-100 transition hover:bg-forest-50" aria-label="Helpful">👍 Yes</button>
                            <button type="button" onClick={() => onFeedback(m.id, 'down', m.answer?.intent)} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-ink/70 shadow-sm ring-1 ring-forest-100 transition hover:bg-rust-50 hover:text-rust-700" aria-label="Not helpful">👎 No</button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-forest-100 bg-white px-3.5 py-2.5 text-sm text-ink/55 shadow-sm">{busyLabel}</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-forest-100 bg-paper/95 px-3 py-3 backdrop-blur-md sm:px-5">
        <div className="mx-auto max-w-2xl">
          {pendingPreview && (
            <div className="mb-2 flex items-center gap-2 rounded-xl border border-forest-100 bg-white px-2 py-1.5">
              <img src={pendingPreview} alt="Pending" className="h-12 w-12 rounded-lg object-cover" />
              <p className="flex-1 truncate text-xs text-ink/60">Screenshot attached</p>
              <button type="button" onClick={clearPendingImage} className="rounded-full px-2 py-1 text-xs font-semibold text-ink/50 hover:bg-forest-50 hover:text-ink">Remove</button>
            </div>
          )}
          <form onSubmit={onSubmit} className="relative flex items-end gap-2 rounded-2xl border border-forest-100 bg-white px-2 py-1.5 shadow-sm focus-within:border-forest-300 focus-within:ring-2 focus-within:ring-forest-500/20">
            <div className="relative">
              <button type="button" onClick={() => setShowAttachMenu((v) => !v)} className="flex h-9 w-9 items-center justify-center rounded-xl text-ink/45 transition hover:bg-forest-50 hover:text-ink" aria-label="Attach screenshot">+</button>
              {showAttachMenu && (
                <div className="absolute bottom-full left-0 mb-1 w-44 overflow-hidden rounded-xl border border-forest-100 bg-white shadow-lg">
                  <button type="button" className="block w-full px-3 py-2.5 text-left text-sm text-ink hover:bg-forest-50" onClick={() => galleryRef.current?.click()}>Choose from gallery</button>
                  <button type="button" className="block w-full border-t border-forest-100 px-3 py-2.5 text-left text-sm text-ink hover:bg-forest-50" onClick={() => cameraRef.current?.click()}>Take photo</button>
                </div>
              )}
              <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={onFilePicked} />
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFilePicked} />
            </div>
            <label htmlFor="chat-input" className="sr-only">Ask about NELFUND</label>
            <textarea ref={textareaRef} id="chat-input" rows={1} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleTurn(input, pendingFile) } }} placeholder="Ask anything about NELFUND…" className="max-h-[140px] min-h-[40px] flex-1 resize-none bg-transparent px-1 py-2 text-sm text-ink placeholder:text-ink/35 focus:outline-none" disabled={busy} />
            <button type="submit" disabled={busy || (!input.trim() && !pendingFile)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest-700 text-paper transition hover:bg-forest-900 disabled:opacity-40" aria-label="Send message">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 19V5M12 5l-6 6M12 5l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </form>
          <p className="mt-1.5 text-center text-[10px] text-ink/35">Independent student guide · Verify critical details on the official portal</p>
        </div>
      </div>
    </div>
  )
}
