import type { VercelRequest, VercelResponse } from '@vercel/node'

/** Official NELFUND Student Guide OG image (JPEG) for WhatsApp / social previews */
const P0 = 'PART0_PLACEHOLDER'
const P1 = 'PART1_PLACEHOLDER'
const P2 = 'PART2_PLACEHOLDER'
const B64 = P0 + P1 + P2

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const buf = Buffer.from(B64, 'base64')
  res.setHeader('Content-Type', 'image/jpeg')
  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
  res.setHeader('Content-Length', String(buf.length))
  return res.status(200).send(buf)
}
