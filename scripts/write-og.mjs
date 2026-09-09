import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
mkdirSync(publicDir, { recursive: true })
const ogJpg = Buffer.from('PLACEHOLDER_B64', 'base64')
writeFileSync(join(publicDir, 'og-image.jpg'), ogJpg)
writeFileSync(join(publicDir, 'og-image-square.png'), ogJpg)
console.log('OG image written', ogJpg.length, 'bytes')
