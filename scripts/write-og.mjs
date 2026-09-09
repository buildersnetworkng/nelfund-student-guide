import { writeFileSync, readFileSync, mkdirSync, readdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
const chunksDir = join(__dirname, 'og-chunks')
mkdirSync(publicDir, { recursive: true })
const files = readdirSync(chunksDir).filter((f) => f.startsWith('c') && f.endsWith('.txt')).sort()
const b64 = files.map((f) => readFileSync(join(chunksDir, f), 'utf8')).join('')
const buf = Buffer.from(b64, 'base64')
writeFileSync(join(publicDir, 'og-image.jpg'), buf)
writeFileSync(join(publicDir, 'og-image-square.png'), buf)
console.log('OG image written', buf.length, 'bytes from', files.length, 'chunks')
