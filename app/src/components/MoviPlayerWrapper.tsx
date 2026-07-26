import { useEffect, useRef, useState } from 'react'
import { MoviElement } from 'movi-player'

interface Props {
  src: string
  poster?: string
  title?: string
  onEnded?: () => void
}

if (typeof customElements !== 'undefined' && !customElements.get('movi-player')) {
  customElements.define('movi-player', MoviElement)
}

export default function MoviPlayerWrapper({ src, poster, title, onEnded }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'loading' | 'error' | 'blank'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container || !src) return

    console.log(`[MoviPlayer] mount src=${src?.substring(0,80)} defined=${!!customElements.get('movi-player')}`)
    container.innerHTML = ''

    // Create element via DOM (bypass React)
    const player = document.createElement('movi-player')
    player.setAttribute('src', src)
    player.setAttribute('controls', '')
    player.setAttribute('muted', '')
    player.setAttribute('playsinline', '')
    player.setAttribute('theme', 'dark')
    player.setAttribute('themecolor', '#0099ff')
    if (poster) player.setAttribute('poster', poster)
    if (title) player.setAttribute('title', title)
    player.style.cssText = 'width:100%;height:100%;display:block;position:absolute;inset:0'

    console.log(`[MoviPlayer] constructor=${player.constructor.name} isMovi=${player instanceof MoviElement}`)

    let settled = false

    player.addEventListener('loadeddata', () => {
      if (settled) return; settled = true
      console.log('[MoviPlayer] loadeddata')
      setState('blank')
    })

    player.addEventListener('statechange', ((e: CustomEvent) => {
      console.log('[MoviPlayer] state:', e.detail)
      if (e.detail === 'ready' || e.detail === 'playing') {
        if (!settled) { settled = true; setState('blank') }
      }
      if (e.detail === 'error' && !settled) {
        settled = true; setState('error'); setErrorMsg('Player state: error')
      }
    }) as EventListener)

    player.addEventListener('error', ((e: any) => {
      const msg = e?.detail?.message || e?.message || 'unknown error'
      console.log('[MoviPlayer] error event:', msg)
      if (!settled) { settled = true; setState('error'); setErrorMsg(msg) }
    }) as EventListener)

    player.addEventListener('ended', () => onEnded?.())

    container.appendChild(player)

    // Timeout: if nothing happens in 15s, show error
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true
        setState('error')
        setErrorMsg('15 saniyede yüklenemedi')
      }
    }, 15000)

    return () => {
      clearTimeout(timer)
      player.remove()
    }
  }, [src, poster, title, onEnded, retryKey])

  return (
    <div key={`mp-${src}-${retryKey}`} className="w-full aspect-video bg-black relative" ref={containerRef}>
      {state === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10" style={{ pointerEvents: 'none' }}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#0099ff] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-400">MoviPlayer yükleniyor...</span>
          </div>
        </div>
      )}
      {state === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-10 gap-3">
          <p className="text-sm text-red-400 max-w-xs text-center px-4">{errorMsg}</p>
          <button onClick={() => { setState('loading'); setErrorMsg(''); setRetryKey(k => k + 1) }} className="px-4 py-2 rounded-lg bg-[#0099ff] text-white text-xs cursor-pointer">
            Tekrar Dene
          </button>
        </div>
      )}
    </div>
  )
}
