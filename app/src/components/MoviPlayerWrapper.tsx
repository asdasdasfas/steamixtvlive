import { useEffect, useRef, createElement } from 'react'
import 'movi-player'

interface Props {
  src: string
  poster?: string
  title?: string
  onEnded?: () => void
}

export default function MoviPlayerWrapper({ src, poster, title, onEnded }: Props) {
  const ref = useRef<any>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (onEnded) {
      el.addEventListener('ended', onEnded)
      return () => el.removeEventListener('ended', onEnded)
    }
  }, [onEnded])

  useEffect(() => {
    if (ref.current) ref.current.src = src
  }, [src])

  return createElement('movi-player', {
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
  })
}
