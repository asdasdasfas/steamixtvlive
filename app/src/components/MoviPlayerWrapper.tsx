import { useEffect, useRef, useState, createElement } from 'react'
import 'movi-player'

interface Props {
  src: string
  poster?: string
  title?: string
  onEnded?: () => void
}

export default function MoviPlayerWrapper({ src, poster, title, onEnded }: Props) {
  const ref = useRef<any>(null)
  const [error, setError] = useState('')
  const [retryNative, setRetryNative] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onErr = (e: any) => {
      const msg = e?.detail?.message || e?.message || 'Playback error'
      setError(msg)
    }
    const onEnd = () => onEnded?.()
    el.addEventListener('error', onErr)
    el.addEventListener('ended', onEnd)
    if (src) el.src = src
    return () => {
      el.removeEventListener('error', onErr)
      el.removeEventListener('ended', onEnd)
    }
  }, [src, onEnded])

  if (retryNative) {
    return (
      <div className="w-full aspect-video bg-black relative">
        <video
          src={src}
          poster={poster}
          className="w-full h-full"
          controls
          playsInline
          crossOrigin="anonymous"
        />
        <p className="absolute bottom-2 left-2 text-[10px] text-gray-500 bg-black/60 px-2 py-1 rounded">
          Native mode (no audio)
        </p>
      </div>
    )
  }

  return (
    <div className="w-full aspect-video bg-black relative">
      {createElement('movi-player', {
        ref,
        src,
        poster,
        title,
        controls: true,
        autoplay: true,
        muted: true,
        playsinline: true,
        theme: 'dark',
        themecolor: '#0099ff',
        style: { width: '100%', height: '100%', display: 'block' },
      })}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-10 gap-3">
          <p className="text-sm text-red-400 max-w-xs text-center px-4">{error}</p>
          <button
            onClick={() => { setError(''); setRetryNative(true) }}
            className="px-4 py-2 rounded-lg bg-[#0099ff] text-white text-xs"
          >
            Native Player ile Dene (Sessiz)
          </button>
        </div>
      )}
    </div>
  )
}
