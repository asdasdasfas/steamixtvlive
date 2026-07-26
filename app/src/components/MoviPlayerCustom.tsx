import { useEffect, useRef, useState } from 'react'

interface Props {
  src: string
  poster?: string
  title?: string
  onEnded?: () => void
}

export default function MoviPlayerCustom({ src, poster, onEnded }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const playerRef = useRef<any>(null)
  const [status, setStatus] = useState<'loading' | 'error' | 'paused' | 'playing' | 'native'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [retryKey, setRetryKey] = useState(0)
  const [nativeSrc, setNativeSrc] = useState('')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !src) return

    let mounted = true
    let player: any = null
    let stepLog: string[] = []

    const slog = (msg: string) => { stepLog.push(msg); console.log('[Movi]', msg) }

    slog('1 URL test...')
    // Quick HEAD test to see if proxy is working
    fetch(src, { method: 'HEAD', signal: AbortSignal.timeout(8000) })
      .then(r => slog(`1 HEAD ${r.status} ${r.ok?'OK':'FAIL'}`))
      .catch((e: any) => slog(`1 HEAD error ${e?.message?.substring(0,80)}`))

    ;(async () => {
      try {
        slog('2 CDN import...')
        // @ts-expect-error - CDN module
        const { MoviPlayer } = await import('https://cdn.jsdelivr.net/npm/movi-player@0.3.5/dist/player.js')
        if (!mounted) return
        slog('2 CDN OK')

        player = new MoviPlayer({
          source: { type: 'url', url: src },
          renderer: 'canvas',
          canvas,
        })
        playerRef.current = player

        player.on('stateChange', (s: string) => {
          if (!mounted) return
          slog('state: ' + s)
          if (s === 'playing') setStatus('playing')
          else if (s === 'paused' || s === 'ready') setStatus('paused')
          else if (s === 'error') { setStatus('error'); setErrorMsg('Oynatma durdu') }
        })
        player.on('timeUpdate', (t: number) => { if (mounted && isFinite(t)) setCurrentTime(t) })
        player.on('durationChange', (d: number) => { if (mounted && isFinite(d)) setDuration(d) })
        player.on('error', (e: any) => {
          if (!mounted) return
          slog('error: ' + (e?.message || e))
          setStatus('error'); setErrorMsg(e?.message || 'Bilinmeyen hata')
        })
        player.on('ended', () => { if (mounted) onEnded?.() })

        slog('3 load...')
        await player.load()
        slog('3 load OK')
        slog('4 play...')
        await player.play()
        slog('4 PLAYING!')
      } catch (e: any) {
        if (!mounted) return
        const msg = e?.message || String(e)
        slog('HATA: ' + msg.substring(0,200))
        setStatus('error')
        setErrorMsg(`[${stepLog.length}] ${msg.substring(0,150)}`)
      }
    })()

    return () => {
      mounted = false
      playerRef.current = null
      if (player) { slog('destroy'); player.destroy() }
    }
  }, [src, retryKey])

  // If user chose native fallback
  if (status === 'native' && nativeSrc) {
    return (
      <div className="w-full aspect-video bg-black relative">
        <video src={nativeSrc} poster={poster} className="w-full h-full" controls playsInline crossOrigin="anonymous" />
        <p className="absolute bottom-2 left-2 text-[10px] text-gray-500 bg-black/60 px-2 py-1 rounded">Native (ses yok)</p>
      </div>
    )
  }

  const togglePlay = () => {
    const p = playerRef.current
    if (!p) return
    if (status === 'playing') { p.pause(); setStatus('paused') }
    else { p.play(); setStatus('playing') }
  }

  const fmt = (s: number) => {
    if (!s || !isFinite(s)) return '0:00'
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60)
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  return (
    <div className="w-full aspect-video bg-black relative select-none overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full cursor-pointer" onClick={togglePlay} />

      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <span className="text-sm text-white/50">MoviPlayer yükleniyor (6MB)...</span>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 gap-4 px-6">
          <p className="text-sm text-red-400 text-center break-all">{errorMsg}</p>
          <div className="flex gap-3">
            <button onClick={() => { setStatus('loading'); setErrorMsg(''); setRetryKey(k => k + 1) }}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition cursor-pointer">
              Tekrar Dene
            </button>
            <button onClick={() => { setNativeSrc(src); setStatus('native') }}
              className="px-4 py-2 rounded-lg bg-yellow-600/80 hover:bg-yellow-600 text-white text-sm transition cursor-pointer">
              Native (Sessiz)
            </button>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <button onClick={togglePlay} className="text-white text-xl leading-none w-8 h-8 flex items-center justify-center cursor-pointer">
            {status === 'playing' ? '⏸' : '▶'}
          </button>
          <span className="text-xs text-white/70 font-mono select-none">{fmt(currentTime)} / {fmt(duration)}</span>
        </div>
      </div>
    </div>
  )
}
