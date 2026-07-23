import { useEffect, useRef, useState, useCallback } from 'react'
import Hls from 'hls.js'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward } from 'lucide-react'

interface VideoPlayerProps {
  src: string
  poster?: string
  title?: string
  onEnded?: () => void
  fallbackSrcs?: string[]
  onToggleFullscreen?: () => void
}

export default function VideoPlayer({ src, poster, title, onEnded, fallbackSrcs, onToggleFullscreen }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [buffered, setBuffered] = useState(0)
  const [loadError, setLoadError] = useState('')
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const urlIndexRef = useRef(0)
  const allUrlsRef = useRef<string[]>([])
  const watchdogRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const lastProgressRef = useRef(0)

  // Build full URL list
  useEffect(() => {
    const urls = [src, ...(fallbackSrcs || [])]
    allUrlsRef.current = urls.filter(Boolean)
    urlIndexRef.current = 0
    setLoadError('')
    console.log(`%c[VIDEO] URL list (${allUrlsRef.current.length})`, 'color:cyan', allUrlsRef.current.map((u,i)=>`#${i}: ${u?.substring(0,130)}`))
  }, [src, fallbackSrcs])

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

  const tryPlay = useCallback(async (video: HTMLVideoElement) => {
    try {
      await video.play()
      setPlaying(true)
    } catch {
      // Autoplay blocked — show overlay instead of auto-muting
      setPlaying(false)
    }
  }, [])

  const cleanup = useCallback(() => {
    clearInterval(watchdogRef.current)
    clearTimeout(hideTimer.current)
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
    const v = videoRef.current
    if (v) {
      v.pause()
      v.removeAttribute('src')
      v.load()
      v.onerror = null
    }
  }, [])

  // Watchdog: every 2s check if video made progress, if stuck for 5s try next URL
  const startWatchdog = useCallback((video: HTMLVideoElement) => {
    clearInterval(watchdogRef.current)
    lastProgressRef.current = video.currentTime || 0
    let stuckCount = 0
    const urlIdx = urlIndexRef.current
    const total = allUrlsRef.current.length
    console.log(`%c[WATCHDOG] Basladi URL#${urlIdx}/${total}`, 'color:yellow')
    watchdogRef.current = setInterval(() => {
      if (!video || video.seeking) return
      if (video.readyState >= 2 && video.currentTime > lastProgressRef.current) {
        if (stuckCount > 0) console.log(`%c[WATCHDOG] Kurtuldu! ilerleme var: ${video.currentTime}s`, 'color:lime')
        lastProgressRef.current = video.currentTime
        stuckCount = 0
        return
      }
      stuckCount++
      console.log(`[WATCHDOG] Takildi! #${urlIdx}/${total} stuck:${stuckCount}/3 readyState:${video.readyState} currentTime:${video.currentTime.toFixed(2)}s lastProgress:${lastProgressRef.current.toFixed(2)}s buffered:${video.buffered?.length||0}`)
      if (stuckCount >= 3) {
        console.log(`%c[WATCHDOG] 3 kez takildi -> SONRAKI URL`, 'color:red')
        clearInterval(watchdogRef.current)
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
    if (videoRef.current) videoRef.current.onerror = null
        video.src = ''
        video.load()
        urlIndexRef.current++
        if (urlIndexRef.current < allUrlsRef.current.length) {
          tryUrl(video)
        } else {
          console.log(`%c[WATCHDOG] TUM URL'LER DENENDI ${total} adet -> HATA`, 'color:red;font-size:16px')
          setLoadError('Hiçbir yayın kaynağı çalışmadı')
        }
      }
    }, 1800)
  }, [])

  // Try playing a URL from the list
  const tryUrl = useCallback((video: HTMLVideoElement) => {
    const idx = urlIndexRef.current
    const urls = allUrlsRef.current
    if (idx >= urls.length) { console.log(`%c[TRYURL] Hic URL kalmadi`, 'color:red'); setLoadError('Hiçbir yayın kaynağı çalışmadı'); return }
    const currentSrc = urls[idx]

    console.log(`%c[TRYURL] ======== DENEME #${idx}/${urls.length} ========`, 'color:yellow;font-size:14px')
    console.log(`[TRYURL] URL: ${currentSrc}`)
    console.log(`[TRYURL] Protokol: ${currentSrc?.startsWith('https') ? 'HTTPS' : currentSrc?.startsWith('http') ? 'HTTP' : currentSrc?.startsWith('/api') ? 'API_PROXY' : 'OTHER'}`)
    console.log(`[TRYURL] Sayfa: ${window.location.protocol}//${window.location.host}`)

    // Quick content-type check (abort body immediately)
    const ctrl = new AbortController()
    fetch(currentSrc, { signal: ctrl.signal }).then(r => {
      const ct = r.headers.get('content-type') || ''
      console.log(`[TRYURL] FETCH test: status=${r.status} ct=${ct}`)
      ctrl.abort() // don't download body
    }).catch(() => {})

    // Destroy previous HLS and reset video element fully
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
    video.pause()
    video.removeAttribute('src')
    video.load()
    video.muted = false
    setMuted(false)

    const isHls = currentSrc.endsWith('.m3u8')
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    console.log(`[TRYURL] isHLS:${isHls} HLS.destek:${Hls.isSupported()} Safari:${isSafari}`)

    if (isHls && Hls.isSupported() && !isSafari) {
      console.log(`[TRYURL] HLS.js baslatiliyor...`)
      const hls = new Hls({
        enableWorker: false, lowLatencyMode: false, debug: true,
        fragLoadingTimeOut: 5000,
        fragLoadingMaxRetry: 1,
        fragLoadingRetryDelay: 1000,
        manifestLoadingTimeOut: 5000,
        fetchSetup: (context, init) => new Request(context.url, {
          ...init,
          credentials: 'include',
          referrerPolicy: 'unsafe-url',
          referrer: currentSrc,
        })
      })
      hlsRef.current = hls
      hls.loadSource(currentSrc)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log(`%c[HLS] MANIFEST_PARSED OK`, 'color:lime')
        tryPlay(video)
        startWatchdog(video)
      })
      hls.on(Hls.Events.MANIFEST_LOADED, (_e, data) => {
        console.log(`[HLS] MANIFEST_LOADED:`, data.url?.substring(0,120), `levels:${data.levels?.length}`)
      })
      hls.on(Hls.Events.LEVEL_LOADED, (_e, data) => {
        const d = data.details
        console.log(`[HLS] LEVEL_LOADED: level=${data.level} totalduration=${d?.totalduration?.toFixed(1)}s frags=${d?.fragments?.length}`)
        if (d?.fragments) { d.fragments.slice(0,2).forEach(f => console.log(`[HLS] Fragment: ${f.relurl||f.url}`)) }
      })
      hls.on(Hls.Events.FRAG_LOADING, (_e, data) => {
        console.log(`[HLS] FRAG_LOADING: ${data.frag?.relurl||data.frag?.url}`)
      })
      hls.on(Hls.Events.FRAG_LOADED, (_e, data) => {
        console.log(`[HLS] FRAG_LOADED: ${data.frag?.relurl||data.frag?.url} size:${data.payload?.byteLength}`)
      })
      hls.on(Hls.Events.FRAG_BUFFERED, (_e, data) => {
        console.log(`[HLS] FRAG_BUFFERED: ${data.frag?.relurl||data.frag?.url}`)
      })
      hls.on(Hls.Events.ERROR, (_e, data) => {
        console.log(`%c[HLS] ERROR type=${data.type} details=${data.details} fatal=${data.fatal}`, 'color:orange',
          data.response ? `status=${data.response.code}` : '',
          data.frag ? `frag=${data.frag.relurl||data.frag.url}` : '',
          data.error ? `error=${data.error.message}` : ''
        )
        if (data.fatal) {
          console.log(`%c[HLS] FATAL -> sonraki URL`, 'color:red')
          clearInterval(watchdogRef.current)
          hls.destroy(); hlsRef.current = null
          urlIndexRef.current++
          tryUrl(video)
        }
      })
      startWatchdog(video)
    } else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      console.log(`[TRYURL] Safari native HLS`)
      video.src = currentSrc
      const onReady = () => { video.removeEventListener('canplay', onReady); tryPlay(video); startWatchdog(video) }
      video.addEventListener('canplay', onReady)
      video.addEventListener('error', (e) => { console.log(`[VIDEO] error:`, video.error?.message) }, { once: true })
      startWatchdog(video)
    } else {
      console.log(`[TRYURL] Direkt video.src`)
      video.src = currentSrc
      video.onerror = () => {
        console.log(`[VIDEO] onerror: code=${video.error?.code} message=${video.error?.message}`)
        clearInterval(watchdogRef.current)
        urlIndexRef.current++
        tryUrl(video)
      }
      video.muted = false; setMuted(false)
      const onReady = () => { video.removeEventListener('canplay', onReady); tryPlay(video); startWatchdog(video) }
      video.addEventListener('canplay', onReady)
      startWatchdog(video)
    }
  }, [startWatchdog])

  // Initialize on src change
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    urlIndexRef.current = 0
    setLoadError('')
    tryUrl(video)

    return () => { cleanup() }
  }, [src, fallbackSrcs, tryUrl, cleanup])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) { tryPlay(video) } else { video.pause(); setPlaying(false) }
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
    videoRef.current!.currentTime = pct * duration
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
    lastProgressRef.current = video.currentTime
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onTime = () => { setCurrentTime(video.currentTime); startHideTimer() }
    const onDur = () => setDuration(video.duration || 0)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onProg = () => { if (video.buffered.length > 0) setBuffered(video.buffered.end(video.buffered.length - 1)) }
    const onEnd = () => onEnded?.()
    video.addEventListener('timeupdate', onTime)
    video.addEventListener('loadedmetadata', onDur)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('progress', onProg)
    video.addEventListener('ended', onEnd)
    return () => {
      video.removeEventListener('timeupdate', onTime)
      video.removeEventListener('loadedmetadata', onDur)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('progress', onProg)
      video.removeEventListener('ended', onEnd)
    }
  }, [onEnded, startHideTimer])

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0

  return (
    <div ref={containerRef} className="relative bg-black group cursor-pointer" onClick={togglePlay} onMouseMove={startHideTimer}>
      <video ref={videoRef} className="w-full aspect-video object-contain" poster={poster} playsInline />
      {title && <div className="absolute top-4 left-4 text-white text-sm font-medium drop-shadow-lg bg-black/40 px-3 py-1.5 rounded-lg">{title}</div>}
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
          <div className="text-center max-w-xs">
            <p className="text-sm text-gray-400 mb-3">{loadError}</p>
            <button onClick={() => { setLoadError(''); urlIndexRef.current = 0; tryUrl(videoRef.current!) }}
              className="px-4 py-2 rounded-lg bg-[#0099ff] text-white text-xs">Tekrar Dene</button>
          </div>
        </div>
      )}
      {!playing && !loadError && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
      )}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-16 pb-3 px-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div ref={progressRef} className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer mb-3 group/progress hover:h-2.5 transition-all" onClick={handleSeek}>
          <div className="h-full bg-white/30 rounded-full relative" style={{ width: `${bufferedPct}%` }}>
            <div className="absolute inset-0 bg-[#0099ff] rounded-full" style={{ width: `${bufferedPct > 0 ? (progress / bufferedPct) * 100 : 0}%` }} />
          </div>
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