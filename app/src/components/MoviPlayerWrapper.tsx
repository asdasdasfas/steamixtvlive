import { useEffect, useRef, useState } from 'react'

interface Props {
  src: string
  poster?: string
  title?: string
  onEnded?: () => void
}

export default function MoviPlayerWrapper({ src, poster, title, onEnded }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const playerRef = useRef<any>(null)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const { MoviPlayer } = await import('movi-player/player')
        if (cancelled || !canvasRef.current) return
        const player = new MoviPlayer({
          source: { type: 'url', url: src },
          canvas: canvasRef.current,
        })
        playerRef.current = player
        player.on('error', (e: any) => { if (!cancelled) setError(e?.message || 'Playback error') })
        player.on('ended', () => onEnded?.())
        await player.load()
        if (!cancelled) { setLoaded(true); player.play() }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to initialize player')
      }
    }
    init()
    return () => { cancelled = true; playerRef.current?.destroy(); playerRef.current = null }
  }, [src])

  return (
    <div className="w-full aspect-video bg-black relative">
      <canvas ref={canvasRef} className="w-full h-full" />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <p className="text-sm text-red-400 max-w-xs text-center px-4">{error}</p>
        </div>
      )}
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-8 h-8 border-2 border-[#0099ff] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
