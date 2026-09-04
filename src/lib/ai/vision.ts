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
  /nelfund|nelf\.gov|portal\.nelf|student\s*loan|jamb|nigerian|password|log\s*in|sign\s*in|apply|pending|approved|matric|bvn|nin|upkeep|eligibility|verify|loan\s*portal|invalid|format/i

/** Boost contrast / grayscale so red error banners OCR more reliably */
async function preprocessForOcr(file: Blob): Promise<Blob> {
  try {
    if (typeof createImageBitmap === 'undefined' || typeof document === 'undefined') {
      return file
    }
    const bitmap = await createImageBitmap(file)
    const canvas = document.createElement('canvas')
    const maxW = 1280
    const scale = bitmap.width > maxW ? maxW / bitmap.width : 1
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const d = img.data
    for (let i = 0; i < d.length; i += 4) {
      // Grayscale + mild contrast stretch (helps red-on-white banners)
      const g = 0.299 * d[i]! + 0.587 * d[i + 1]! + 0.114 * d[i + 2]!
      const v = g < 128 ? Math.max(0, g * 0.75) : Math.min(255, g * 1.15)
      d[i] = d[i + 1] = d[i + 2] = v
    }
    ctx.putImageData(img, 0, 0)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png'),
    )
    return blob || file
  } catch {
    return file
  }
}

export async function extractTextFromImage(file: Blob): Promise<OcrResult> {
  try {
    const worker = await getWorker()
    const prepared = await preprocessForOcr(file)
    const {
      data: { text, confidence },
    } = await worker.recognize(prepared)

    // Preserve line breaks; keep punctuation used in portal errors (e.g. commas)
    const cleaned = (text || '')
      .replace(/\r/g, '')
      .split('\n')
      .map((line) =>
        line
          .replace(/[^\w\s\-–—.,:()%/₦?@']/g, ' ')
          .replace(/[ \t]+/g, ' ')
          .trim(),
      )
      .filter(Boolean)
      .join('\n')
      .trim()

    const conf = typeof confidence === 'number' ? confidence : 0
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
