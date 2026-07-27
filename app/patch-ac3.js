import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const codecPath = resolve(__dirname, 'node_modules/mediabunny/dist/modules/src/codec.js')

try {
  let src = readFileSync(codecPath, 'utf8')
  const patched = src
    .replace("codecString === 'ac-3' || codecString === 'ac3'", "codecString === 'ac-3' || codecString === 'ac3' || codecString === 'mp4a.a5'")
    .replace("codecString === 'ec-3' || codecString === 'eac3'", "codecString === 'ec-3' || codecString === 'eac3' || codecString === 'mp4a.a6'")
  if (src !== patched) {
    writeFileSync(codecPath, patched, 'utf8')
    console.log('[patch-ac3] OK: mp4a.a5/mp4a.a6 codec recognition patched')
  } else {
    console.log('[patch-ac3] SKIP: already patched or no match')
  }
} catch (e) {
  console.error('[patch-ac3] FAIL:', e.message)
}
