const logs: string[] = []
const maxLogs = 7000

function ts() {
  return new Date().toLocaleTimeString('tr-TR', { hour12: false })
}

function push(s: string) {
  logs.push(`[${ts()}] ${s}`)
  if (logs.length > maxLogs) logs.splice(0, logs.length - maxLogs)
}

export const debugLog = {
  info: (msg: string) => push(`INFO: ${msg}`),
  api: (url: string, status: number, count: number, durMs: number) => push(`API: ${status} | ${count} items | ${durMs}ms | ${url.slice(0, 200)}`),
  apiErr: (url: string, err: string) => push(`API-ERR: ${err} | ${url.slice(0, 200)}`),
  scroll: (y: number, max: number, visible: number, total: number, domCards: number) => push(`SCROLL: dom=${domCards} data=${total} visible=${visible} y=${y}/${max}`),
  domCheck: (expected: number, actual: number, lastId: any, missingIds: string) => {
    if (actual < expected) push(`DOM-EKSIK: expected ${expected} cards, DOM'da ${actual} var! Son id=${lastId} ${missingIds ? 'Eksikler: ' + missingIds.slice(0, 200) : ''}`)
    else push(`DOM-TAM: ${actual} cards, hepsi DOM'da`)
  },
  getLogs: () => [...logs],
  clear: () => { logs.length = 0 },
}
