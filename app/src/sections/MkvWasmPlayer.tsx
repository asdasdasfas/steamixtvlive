import { useEffect, useRef, useState, useCallback } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react'
import Ffwm from 'ffmpeg-wasm-mkv'
import muxjs from 'mux.js'

window.muxjs = muxjs

const CORE_JS = '/assets/core/ffmpeg-core.js'
const CORE_WASM = '/assets/core/ffmpeg-core.wasm'
const MUX_JS = '/assets/core/mux.min.js'
const BUFFER_SIZE = 11.4
const REFILL_THRESHOLD = 8


interface MkvWasmPlayerProps {
  src: string
  poster?: string
  title?: string
  onEnded?: () => void
  onToggleFullscreen?: () => void
}

export default function MkvWasmPlayer({ src, poster, title, onEnded, onToggleFullscreen }: MkvWasmPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const ffwmRef = useRef<Ffwm | null>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadPhase, setLoadPhase] = useState('')
  const [useNativeFallback, setUseNativeFallback] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60)
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const startHideTimer = useCallback(() => {
    clearTimeout(hideTimer.current)
    setShowControls(true)
    hideTimer.current = setTimeout(() => { if (playing) setShowControls(false) }, 3000)
  }, [playing])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) { video.play().catch(() => {}) } else { video.pause() }
    startHideTimer()
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    videoRef.current!.volume = v
    setVolume(v); setMuted(v === 0)
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = progressRef.current!.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    const target = pct * duration
    videoRef.current!.currentTime = target
  }

  const toggleFullscreen = async () => {
    if (onToggleFullscreen) { onToggleFullscreen(); return }
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen()
      setFullscreen(true)
      try { (screen as any).orientation?.lock?.('landscape') } catch {}
    } else {
      await document.exitFullscreen()
      setFullscreen(false)
      try { (screen as any).orientation?.unlock?.() } catch {}
    }
  }

  const skip = (sec: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime += sec
  }

  // Initialize ffmpeg-wasm-mkv
  useEffect(() => {
    let cancelled = false
    const init = async () => {
      try {
        setLoading(true)
        setLoadPhase('Downloading...')
        const resp = await fetch(src, { credentials: 'include' })
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const total = parseInt(resp.headers.get('content-length') || '0', 10)
        const maxBytes = 800 * (1 << 20) // 800MB limit — browser memory guard
        if (total > maxBytes) throw new Error(`File too large (${(total / (1 << 20)).toFixed(0)}MB > 800MB). Use PC.`)
        const reader = resp.body!.getReader()
        const chunks: Uint8Array[] = []
        let received = 0
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (value) { chunks.push(value); received += value.length }
          if (total > 0) setLoadPhase(`Downloading... ${(received / (1 << 20)).toFixed(0)}MB / ${(total / (1 << 20)).toFixed(0)}MB`)
          else setLoadPhase(`Downloading... ${(received / (1 << 20)).toFixed(0)}MB`)
        }
        const blob = new Blob(chunks as BlobPart[])
        const file = new File([blob], 'video.mkv')
        setLoadPhase('Loading ffmpeg WASM...')
        const ffwm = new Ffwm(CORE_JS, CORE_WASM, MUX_JS, BUFFER_SIZE, REFILL_THRESHOLD)
        if (cancelled) return
        ffwmRef.current = ffwm
        setLoadPhase('Parsing media...')
        const metadata = await ffwm.loadMedia(file)
        if (cancelled) return
        if (metadata.videoStreams.length === 0) throw new Error('No video streams found')
        const videoEl = videoRef.current
        if (!videoEl) return
        videoEl.src = metadata.src
        setDuration(ffwm.loadedMediaMetadata?.durationSeconds || 0)
        setLoadPhase('Starting playback...')
        await ffwm.start(metadata.videoStreams[0].id, metadata.audioStreams[0]?.id || null)
        if (cancelled) return
        setLoading(false)
        setLoadPhase('')
        try { await videoEl.play() } catch {}
        setPlaying(true)
      } catch (err: any) {
        if (!cancelled) {
          setLoadError(err.message || 'Failed to load')
          setLoading(false)
        }
      }
    }
    init()
    return () => {
      cancelled = true
      ffwmRef.current?.clean()
    }
  }, [src])

  // Sync timeupdate from video to state + refill buffer
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onTime = () => {
      const t = video.currentTime
      setCurrentTime(t)
      ffwmRef.current?.onTimeUpdate(t)
    }
    const onDur = () => setDuration(video.duration || 0)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnd = () => onEnded?.()
    video.addEventListener('timeupdate', onTime)
    video.addEventListener('loadedmetadata', onDur)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('ended', onEnd)
    return () => {
      video.removeEventListener('timeupdate', onTime)
      video.removeEventListener('loadedmetadata', onDur)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('ended', onEnd)
    }
  }, [onEnded])

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // Native fallback when WASM fails (e.g. file too large)
  if (useNativeFallback) {
    return (
      <div ref={containerRef} className="relative bg-black group cursor-pointer" onClick={togglePlay} onMouseMove={startHideTimer}>
        <video ref={videoRef} className="w-full aspect-video object-contain" poster={poster} playsInline crossOrigin="anonymous" src={src} />
        {title && <div className="absolute top-4 left-4 text-white text-sm font-medium drop-shadow-lg bg-black/40 px-3 py-1.5 rounded-lg">{title}</div>}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative bg-black group cursor-pointer" onClick={togglePlay} onMouseMove={startHideTimer}>
      <video ref={videoRef} className="w-full aspect-video object-contain" poster={poster} playsInline crossOrigin="anonymous" />
      {title && <div className="absolute top-4 left-4 text-white text-sm font-medium drop-shadow-lg bg-black/40 px-3 py-1.5 rounded-lg">{title}</div>}
      {(loading || loadError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
          <div className="text-center max-w-xs">
            {loading ? (
              <>
                <div className="w-8 h-8 border-2 border-[#0099ff] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-400">{loadPhase}</p>
              </>
            ) : (
              <>
                <p className="text-sm text-red-400 mb-3">{loadError}</p>
                <div className="flex gap-2 justify-center">
                  <button onClick={() => location.reload()} className="px-4 py-2 rounded-lg bg-[#0099ff] text-white text-xs">Tekrar Dene</button>
                  <button onClick={() => setUseNativeFallback(true)} className="px-4 py-2 rounded-lg bg-gray-600 text-white text-xs">Sessiz izle</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {!playing && !loading && !loadError && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
      )}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-16 pb-3 px-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div ref={progressRef} className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer mb-3 group/progress hover:h-2.5 transition-all" onClick={e => { e.stopPropagation(); handleSeek(e) }}>
          <div className="h-full bg-[#0099ff] rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-1 sm:gap-3">
            <button onClick={e => { e.stopPropagation(); skip(-10) }} className="p-2 sm:p-0 hover:text-[#0099ff]"><SkipBack className="w-5 h-5 sm:w-5 sm:h-5" /></button>
            <button onClick={e => { e.stopPropagation(); togglePlay() }} className="p-2 sm:p-0 hover:text-[#0099ff]">{playing ? <Pause className="w-7 h-7 sm:w-6 sm:h-6" /> : <Play className="w-7 h-7 sm:w-6 sm:h-6" />}</button>
            <button onClick={e => { e.stopPropagation(); skip(10) }} className="p-2 sm:p-0 hover:text-[#0099ff]"><SkipForward className="w-5 h-5 sm:w-5 sm:h-5" /></button>
            <div className="flex items-center gap-1 sm:gap-2">
              <button onClick={e => { e.stopPropagation(); toggleMute() }} className="p-2 sm:p-0 hover:text-[#0099ff]">{muted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</button>
              <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume} onChange={handleVolume} onClick={e => e.stopPropagation()} className="w-16 sm:w-20 accent-[#0099ff]" />
            </div>
            <span className="text-xs text-gray-300 hidden sm:inline">{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <span className="text-[10px] sm:text-xs text-gray-400 sm:hidden">{formatTime(currentTime)} / {formatTime(duration)}</span>
            <button onClick={e => { e.stopPropagation(); toggleFullscreen() }} className="p-2 sm:p-0 hover:text-[#0099ff]">{fullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
