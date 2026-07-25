import { useEffect, useRef, useState, useCallback } from 'react'
import Hls from 'hls.js'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward } from 'lucide-react'
import MediabunnyPlayer from './MediabunnyPlayer'


const decodeProxyUrl = (url: string): string | null => {
  const m = url.match(/^\/(?:dyn|p2095|p8080|audio-fix)\/([A-Za-z0-9\-_]+)(\/.*)$/)
  if (!m) return null
  try {
    const base = atob(m[1].replace(/-/g, '+').replace(/_/g, '/'))
    if (base.startsWith('http://') || base.startsWith('https://')) return base.replace(/\/+$/, '') + m[2]
  } catch {}
  return null
}

const openExternalPlayer = (url: string) => {
  const directUrl = decodeProxyUrl(url)
  if (!directUrl) return
  const isAndroid = /android/i.test(navigator.userAgent)
  if (isAndroid) {
    const encUrl = encodeURIComponent(directUrl)
    // Chrome intent:// scheme: HOST/PATH + #Intent params
    const hostPath = directUrl.replace(/^https?:\/\//, '')
    const intentUrl = `intent://${hostPath}#Intent;action=android.intent.action.VIEW;type=video%2F*;S.browser_fallback_url=${encUrl};end`
    const a = document.createElement('a')
    a.href = intentUrl
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => {
      try { if (document.hidden === false) window.location.href = directUrl }
      catch { window.location.href = directUrl }
    }, 1000)
  } else {
    window.location.href = directUrl
  }
}

const toAudioFix = (url: string) => {
  if (url.startsWith('/dyn/') && !url.includes('.m3u8')) return url.replace('/dyn/', '/audio-fix/')
  if (url.startsWith('/p2095/') && !url.includes('.m3u8')) return url.replace('/p2095/', '/audio-fix/')
  if (url.startsWith('/p8080/') && !url.includes('.m3u8')) return url.replace('/p8080/', '/audio-fix/')
  return url
}

const debugBuffer: string[] = []
const MAX_DEBUG = 500
function dbg(msg: string) {
  debugBuffer.push(`[${new Date().toISOString().slice(11,19)}] ${msg}`)
  if (debugBuffer.length > MAX_DEBUG) debugBuffer.splice(0, debugBuffer.length - MAX_DEBUG)
  console.log(msg)
}

interface VideoPlayerProps {
  src: string
  poster?: string
  title?: string
  onEnded?: () => void
  fallbackSrcs?: string[]
  onToggleFullscreen?: () => void
}

const IS_MOBILE = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
const PROXY_PREFIXES = ['/dyn/', '/p2095/', '/p8080/']

const isDirectMkv = (url: string) => url && !PROXY_PREFIXES.some(p => url.startsWith(p)) && url.split('?')[0].toLowerCase().endsWith('.mkv')

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
  const retryCountRef = useRef(0)
  const [useMediabunny, setUseMediabunny] = useState<boolean | null>(null)

  // Detect which player to use for this source
  useEffect(() => {
    const directMkv = isDirectMkv(src)
    dbg(`KARAR: directMkv=${directMkv} mobil=${IS_MOBILE} src=${src?.substring(0,60)}`)
    if (directMkv && !IS_MOBILE) {
      setUseMediabunny(true)
      dbg(`KARAR: Mediabunny (PC direct MKV)`)
    } else {
      setUseMediabunny(false)
      dbg(`KARAR: native video/HLS`)
    }
  }, [src, fallbackSrcs])

  // Build full URL list — mobile MKV'leri /audio-fix/ ile degistir
  useEffect(() => {
    const rewrite = (u: string) => IS_MOBILE ? toAudioFix(u) : u
    const urls = [rewrite(src), ...(fallbackSrcs || []).map(rewrite)]
    const filtered = urls.filter(Boolean)
    allUrlsRef.current = filtered
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

  // Watchdog: every 2s check if video made progress, if stuck try next URL
  const startWatchdog = useCallback((video: HTMLVideoElement) => {
    clearInterval(watchdogRef.current)
    lastProgressRef.current = video.currentTime || 0
    let stuckCount = 0
    const urlIdx = urlIndexRef.current
    const total = allUrlsRef.current.length
    const currentSrc = allUrlsRef.current[urlIdx] || ''
    const maxStuck = currentSrc.startsWith('/audio-fix/') ? 20 : (currentSrc.endsWith('.mkv') ? 15 : 5)
    watchdogRef.current = setInterval(() => {
      if (!video || video.seeking) return
      if (video.readyState >= 2 && video.currentTime > lastProgressRef.current) {
        if (stuckCount > 0) console.log(`%c[WATCHDOG] Kurtuldu! ilerleme var: ${video.currentTime}s`, 'color:lime')
        lastProgressRef.current = video.currentTime
        stuckCount = 0
        return
      }
      stuckCount++
      console.log(`[WATCHDOG] Takildi! #${urlIdx}/${total} stuck:${stuckCount}/${maxStuck} readyState:${video.readyState} currentTime:${video.currentTime.toFixed(2)}s lastProgress:${lastProgressRef.current.toFixed(2)}s buffered:${video.buffered?.length||0}`)
      if (stuckCount >= maxStuck) {
        console.log(`%c[WATCHDOG] ${maxStuck} kez takildi -> SONRAKI URL`, 'color:red')
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
    retryCountRef.current = 0

    console.log(`%c[TRYURL] ======== DENEME #${idx}/${urls.length} ========`, 'color:yellow;font-size:14px')
    console.log(`[TRYURL] URL: ${currentSrc}`)
    console.log(`[TRYURL] Protokol: ${currentSrc?.startsWith('https') ? 'HTTPS' : currentSrc?.startsWith('http') ? 'HTTP' : currentSrc?.startsWith('/api') ? 'API_PROXY' : 'OTHER'}`)
    console.log(`[TRYURL] Sayfa: ${window.location.protocol}//${window.location.host}`)

    const ctrl = new AbortController()
    fetch(currentSrc, { signal: ctrl.signal }).then(r => {
      const ct = r.headers.get('content-type') || ''
      console.log(`[TRYURL] FETCH test: status=${r.status} ct=${ct}`)
      ctrl.abort()
    }).catch(() => {})

    // Destroy previous HLS and reset video element fully
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
    video.pause()
    video.removeAttribute('src')
    video.load()
    video.muted = false
    setMuted(false)

    const srcNoQuery = currentSrc.split('?')[0]
    const isHls = srcNoQuery.endsWith('.m3u8')
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    console.log(`[TRYURL] isHLS:${isHls} HLS.destek:${Hls.isSupported()} Safari:${isSafari}`)
    if (currentSrc.startsWith('/audio-fix/')) dbg(`/audio-fix/ -> AC3->AAC transcode bekleniyor`)

    if (isHls && Hls.isSupported() && !isSafari) {
      const isVirtualHls = currentSrc.startsWith('/v/')
      console.log(`[TRYURL] HLS.js baslatiliyor... virtual=${isVirtualHls}`)
      const hls = new Hls({
        enableWorker: false, lowLatencyMode: isVirtualHls, debug: true,
        fragLoadingTimeOut: isVirtualHls ? 0 : 3000,
        fragLoadingMaxRetry: 0,
        fragLoadingRetryDelay: 0,
        manifestLoadingTimeOut: 3000,
        fetchSetup: (context, init) => {
          let url = context.url
          // Proxy Akamai URLs through our server for CORS
          if (url.includes('akamaized.net')) {
            try {
              const u = new URL(url)
              const base = u.protocol + '//' + u.hostname + ':' + (u.port || (u.protocol === 'https:' ? 443 : 80))
              const b64 = btoa(base).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
              url = '/p/' + b64 + u.pathname + (u.search || '')
              console.log(`[FETCH-SETUP] Akamai URL proxied: ${url.substring(0, 120)}`)
            } catch (e) {}
          }
          return new Request(url, {
            ...init,
            credentials: 'include',
            referrerPolicy: 'unsafe-url',
            referrer: currentSrc,
          })
        }
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
        const levelDetails = d as any
        console.log(`[HLS] LEVEL_LOADED: level=${data.level} totalduration=${levelDetails?.totalduration?.toFixed(1)}s frags=${levelDetails?.fragments?.length} audioCodec=${levelDetails?.audioCodec||'?'}`)
        if (levelDetails?.fragments) { levelDetails.fragments.slice(0,2).forEach((f: any) => console.log(`[HLS] Fragment: ${f.relurl||f.url} ${f?.audioCodec?`ac=${f.audioCodec}`:''}`)) }
      })
      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_e, data) => {
        const tracks: any[] = data.audioTracks || []
        console.log(`[HLS] AUDIO_TRACKS_UPDATED:`, tracks.map(t => `id=${t.id} lang=${t.lang} name=${t.name} groupId=${t.groupId} type=${t.type}`))
        if (tracks.length > 0) {
          const track = tracks[0]
          console.log(`[HLS] Selecting audio track: id=${track.id} name=${track.name}`)
          hls.audioTrack = track.id
        } else {
          dbg(`HLS'de HIC ses kanali yok! AC3 veya desteklenmeyen codec`) 
        }
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
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            console.log(`%c[HLS] MEDIA_ERROR -> swapAudioCodec (AC3 cozumu deneniyor)`, 'color:orange')
            hls.swapAudioCodec()
            hls.recoverMediaError()
            return
          }
          console.log(`%c[HLS] FATAL -> sonraki URL`, 'color:red')
          clearInterval(watchdogRef.current)
          hls.destroy(); hlsRef.current = null
          urlIndexRef.current++
          tryUrl(video)
        }
      })
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

  if (useMediabunny && src) {
    return (
      <MediabunnyPlayer
        key={src}
        src={src}
        poster={poster}
        title={title}
        onEnded={onEnded}
        onToggleFullscreen={onToggleFullscreen}
      />
    )
  }

  return (
    <div ref={containerRef} className="relative bg-black group cursor-pointer" onClick={togglePlay} onMouseMove={startHideTimer}>
      <video ref={videoRef} className="w-full aspect-video object-contain" poster={poster} playsInline crossOrigin="anonymous" />
      <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(debugBuffer.join('\n')).then(() => dbg('KOPYALANDI')).catch(() => dbg('KLIPBOARD HATA')) }}
        className="absolute top-2 right-2 z-30 w-7 h-7 rounded-full bg-yellow-500/80 flex items-center justify-center text-[10px] font-bold text-black">D</button>
      {title && <div className="absolute top-4 left-4 text-white text-sm font-medium drop-shadow-lg bg-black/40 px-3 py-1.5 rounded-lg">{title}</div>}
      {IS_MOBILE && !playing && !loadError && (
        <button onClick={e => { e.stopPropagation(); openExternalPlayer(allUrlsRef.current[0] || src) }}
          className="absolute top-4 right-12 z-30 px-3 py-1.5 rounded-lg bg-orange-500/80 text-white text-xs font-medium backdrop-blur-sm">
          MX Player'da Aç
        </button>
      )}
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
          <div className="text-center max-w-xs">
            <p className="text-sm text-gray-400 mb-3">{loadError}</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => { setLoadError(''); urlIndexRef.current = 0; tryUrl(videoRef.current!) }}
                className="px-4 py-2 rounded-lg bg-[#0099ff] text-white text-xs">Tekrar Dene</button>
              <button onClick={() => openExternalPlayer(allUrlsRef.current[0] || src)}
                className="px-4 py-2 rounded-lg bg-orange-500 text-white text-xs">MX Player</button>
            </div>
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