/**
 * Client-side screenshot analysis for NELFUND portal errors / dashboard.
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
          .replace(/[^\w\s\-–—.,:()%/₦?]/g, ' ')
          .replace(/[ \t]+/g, ' ')
          .trim(),
      )
      .filter(Boolean)
      .join('\n')
      .trim()

    // Keep usable portal text even when confidence is mediocre
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
