import { useEffect, useRef, useState } from 'react'
import { MoviPlayer } from 'movi-player/player'

interface Props {
  src: string
  poster?: string
  title?: string
  onEnded?: () => void
}

export default function MoviPlayerCustom({ src, onEnded }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const playerRef = useRef<MoviPlayer | null>(null)
  const [status, setStatus] = useState<'loading' | 'error' | 'paused' | 'playing'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !src) return

    let mounted = true
    let player: MoviPlayer | null = null

    console.log(`[MoviCustom] init src=${src?.substring(0, 100)}`)

    ;(async () => {
      try {
        player = new MoviPlayer({
          source: { type: 'url', url: src },
          renderer: 'canvas',
          canvas,
        })
        playerRef.current = player

        player.on('stateChange', (s) => {
          if (!mounted) return
          console.log('[MoviCustom] state:', s)
          if (s === 'playing') setStatus('playing')
          else if (s === 'paused' || s === 'ready') setStatus('paused')
          else if (s === 'error') { setStatus('error'); setErrorMsg('Oynatma hatası') }
        })

        player.on('timeUpdate', (t) => { if (mounted && isFinite(t)) setCurrentTime(t) })
        player.on('durationChange', (d) => { if (mounted && isFinite(d)) setDuration(d) })

        player.on('error', (e) => {
          if (!mounted) return
          console.error('[MoviCustom] error:', e)
          setStatus('error')
          setErrorMsg(e?.message || 'Bilinmeyen hata')
        })

        player.on('ended', () => { if (mounted) onEnded?.() })

        console.log('[MoviCustom] load...')
        await player.load()
        console.log('[MoviCustom] loaded, play...')
        await player.play()
        console.log('[MoviCustom] playing')
      } catch (e: any) {
        if (!mounted) return
        console.error('[MoviCustom] init error:', e.message || e)
        setStatus('error')
        setErrorMsg(e?.message || 'Player başlatılamadı')
      }
    })()

    return () => {
      mounted = false
      playerRef.current = null
      if (player) {
        console.log('[MoviCustom] destroy')
        player.destroy()
      }
    }
  }, [src, retryKey])

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
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-pointer"
        onClick={togglePlay}
      />

      {/* loading spinner */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <span className="text-sm text-white/50">Yükleniyor...</span>
          </div>
        </div>
      )}

      {/* error with retry */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 gap-4">
          <p className="text-sm text-red-400 max-w-xs text-center px-4">{errorMsg}</p>
          <button
            onClick={() => { setStatus('loading'); setErrorMsg(''); setRetryKey(k => k + 1) }}
            className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition cursor-pointer"
          >
            Tekrar Dene
          </button>
        </div>
      )}

      {/* bottom controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={togglePlay}
            className="text-white text-xl leading-none w-8 h-8 flex items-center justify-center cursor-pointer"
          >
            {status === 'playing' ? '⏸' : '▶'}
          </button>
          <span className="text-xs text-white/70 font-mono select-none">
            {fmt(currentTime)} / {fmt(duration)}
          </span>
        </div>
      </div>
    </div>
  )
}
