import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
mkdirSync(publicDir, { recursive: true })
const buf = Buffer.from('SEE_FULL_FILE', 'base64')
writeFileSync(join(publicDir, 'og-image.jpg'), buf)
writeFileSync(join(publicDir, 'og-image-square.png'), buf)
console.log('OG written', buf.length)
