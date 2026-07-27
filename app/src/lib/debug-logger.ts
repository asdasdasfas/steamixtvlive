const logs: string[] = []
const maxLogs = 5000

function add(entry: string) {
  const t = new Date().toLocaleTimeString('tr-TR', { hour12: false })
  logs.push(`[${t}] ${entry}`)
  if (logs.length > maxLogs) logs.splice(0, logs.length - maxLogs)
}

const origLog = console.log
const origWarn = console.warn
const origError = console.error

console.log = (...args: any[]) => { add(`LOG: ${args.map(a => typeof a === 'object' ? JSON.stringify(a).slice(0, 500) : String(a)).join(' ')}`); origLog(...args) }
console.warn = (...args: any[]) => { add(`WARN: ${args.map(a => typeof a === 'object' ? JSON.stringify(a).slice(0, 500) : String(a)).join(' ')}`); origWarn(...args) }
console.error = (...args: any[]) => { add(`ERROR: ${args.map(a => typeof a === 'object' ? JSON.stringify(a).slice(0, 500) : String(a)).join(' ')}`); origError(...args) }

export const debugLog = {
  info: (msg: string) => add(`INFO: ${msg}`),
  api: (url: string, status: number, count: number, durMs: number) => add(`API: ${status} | ${count} items | ${durMs}ms | ${url.slice(0, 200)}`),
  apiErr: (url: string, err: string) => add(`API-ERR: ${err} | ${url.slice(0, 200)}`),
  scroll: (y: number, max: number, visible: number, total: number) => add(`SCROLL: y=${y} max=${max} visible=${visible}/${total}`),
  getLogs: () => [...logs],
  clear: () => { logs.length = 0 },
}
