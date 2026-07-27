const logs: string[] = []
const maxLogs = 5000

function ts() {
  return new Date().toLocaleTimeString('tr-TR', { hour12: false })
}

export const debugLog = {
  info: (msg: string) => { logs.push(`[${ts()}] INFO: ${msg}`); if (logs.length > maxLogs) logs.splice(0, logs.length - maxLogs) },
  api: (url: string, status: number, count: number, durMs: number) => { logs.push(`[${ts()}] API: ${status} | ${count} items | ${durMs}ms | ${url.slice(0, 200)}`); if (logs.length > maxLogs) logs.splice(0, logs.length - maxLogs) },
  apiErr: (url: string, err: string) => { logs.push(`[${ts()}] API-ERR: ${err} | ${url.slice(0, 200)}`); if (logs.length > maxLogs) logs.splice(0, logs.length - maxLogs) },
  scroll: (y: number, max: number, visible: number, total: number) => { logs.push(`[${ts()}] SCROLL: y=${y} max=${max} visible=${visible}/${total}`); if (logs.length > maxLogs) logs.splice(0, logs.length - maxLogs) },
  getLogs: () => [...logs],
  clear: () => { logs.length = 0 },
}
