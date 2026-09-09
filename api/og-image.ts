import type { VercelRequest, VercelResponse } from '@vercel/node'

/** Official NELFUND Student Guide OG image for WhatsApp / social link previews */
const B64 = 'SEE_FILE'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const buf = Buffer.from(B64, 'base64')
  res.setHeader('Content-Type', 'image/jpeg')
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
  res.setHeader('Content-Length', String(buf.length))
  return res.status(200).send(buf)
}
