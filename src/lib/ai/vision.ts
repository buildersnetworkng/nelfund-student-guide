/**
 * Client-side screenshot analysis for NELFUND portal errors / dashboard.
 *
 * Uses Tesseract.js OCR in the browser. No image is uploaded to any server.
 * Extracted text is kept only in session memory for diagnosis.
 */

export interface OcrResult {
  text: string
  confidence: number
  /** True when OCR ran but found little useful text */
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

/**
 * Run OCR on an image File or Blob.
 * Returns cleaned text focused on portal-style messages and dashboard labels.
 */
export async function extractTextFromImage(file: Blob): Promise<OcrResult> {
  try {
    const worker = await getWorker()
    const {
      data: { text, confidence },
    } = await worker.recognize(file)

    const cleaned = (text || '')
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-–—.,:()%/]/g, ' ')
      .trim()

    // Keep usable portal dashboard text even when confidence is mediocre
    const lowSignal = cleaned.length < 12 || (confidence < 25 && cleaned.length < 40)

    return {
      text: cleaned.slice(0, 2000),
      confidence: typeof confidence === 'number' ? confidence : 0,
      lowSignal,
    }
  } catch {
    return { text: '', confidence: 0, lowSignal: true }
  }
}

/** Optional: terminate worker when leaving the page (best-effort). */
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
