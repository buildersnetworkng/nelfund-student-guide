import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Serves the official NELFUND Student Guide Open Graph image (JPEG).
 * WhatsApp / Facebook / Telegram use this for link previews.
 * Image source: public/og-image.b64.txt (base64 of the official logo card).
 */
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const host = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://nelfund-student-guide.vercel.app'
    const r = await fetch(`${host}/og-image.b64.txt`)
    if (!r.ok) {
      res.status(404).json({ error: 'OG image source missing' })
      return
    }
    const b64 = (await r.text()).trim()
    const buf = Buffer.from(b64, 'base64')
    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
    res.setHeader('Content-Length', String(buf.length))
    return res.status(200).send(buf)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to load OG image' })
  }
}
