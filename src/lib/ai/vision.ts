/**
 * Client-side screenshot analysis for NELFUND portal / website screens.
 * Uses Tesseract.js OCR in the browser. No image is uploaded to any server.
 */

export interface OcrResult {
  text: string
  confidence: number
  lowSignal: boolean
}

let workerPromise: Promise<import('tesseract.js').Worker> | null = null

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const Tesseract = await import('tesseract.js')
      const worker = await Tesseract.createWorker('eng', 1, {
        logger: () => {},
      })
      return worker
    })()
  }
  return workerPromise
}

const PORTAL_HINT =
  /nelfund|nelf\.gov|portal\.nelf|student\s*loan|jamb|nigerian|password|log\s*in|sign\s*in|apply|pending|approved|matric|bvn|nin|upkeep|eligibility|verify|loan\s*portal/i

export async function extractTextFromImage(file: Blob): Promise<OcrResult> {
  try {
    const worker = await getWorker()
    const {
      data: { text, confidence },
    } = await worker.recognize(file)

    // Preserve line breaks so form labels and apply steps stay structured
    const cleaned = (text || '')
      .replace(/\r/g, '')
      .split('\n')
      .map((line) =>
        line
          .replace(/[^\w\s\-–—.,:()%/₦?@]/g, ' ')
          .replace(/[ \t]+/g, ' ')
          .trim(),
      )
      .filter(Boolean)
      .join('\n')
      .trim()

    const conf = typeof confidence === 'number' ? confidence : 0
    // Never treat portal-related OCR as empty signal — keep it for analysis
    const hasPortalHint = PORTAL_HINT.test(cleaned)
    const lowSignal =
      cleaned.length < 8 || (!hasPortalHint && conf < 20 && cleaned.length < 30)

    return {
      text: cleaned.slice(0, 2500),
      confidence: conf,
      lowSignal,
    }
  } catch {
    return { text: '', confidence: 0, lowSignal: true }
  }
}

export async function disposeOcrWorker() {
  if (workerPromise) {
    try {
      const w = await workerPromise
      await w.terminate()
    } catch {
      /* ignore */
    }
    workerPromise = null
  }
}
