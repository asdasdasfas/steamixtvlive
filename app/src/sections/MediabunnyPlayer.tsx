import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Input,
  ALL_FORMATS,
  UrlSource,
  CanvasSink,
  AudioBufferSink,
  type WrappedCanvas,
  type WrappedAudioBuffer,
} from 'mediabunny'

interface MediabunnyPlayerProps {
  src: string
  poster?: string
  title?: string
  onEnded?: () => void
  onToggleFullscreen?: () => void
}

export default function MediabunnyPlayer({ src, poster, title, onEnded, onToggleFullscreen }: MediabunnyPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [ended, setEnded] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loadError, setLoadError] = useState('')
  const [showControls, setShowControls] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)

  const playerRef = useRef<{
    input: Input
    videoSink: CanvasSink | null
    audioSink: AudioBufferSink | null
    videoIterator: AsyncGenerator<WrappedCanvas, void, unknown> | null
    audioIterator: AsyncGenerator<WrappedAudioBuffer, void, unknown> | null
    nextFrame: WrappedCanvas | null
    audioContext: AudioContext | null
    gainNode: GainNode | null
    audioContextStartTime: number | null
    playbackTimeAtStart: number
    firstTimestamp: number
    endTimestamp: number
    queuedNodes: Set<AudioBufferSourceNode>
    rafId: number
    intervalId: number
    asyncId: number
    loaded: boolean
  } | null>(null)

  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const startHideTimer = useCallback(() => {
    clearTimeout(hideTimer.current)
    setShowControls(true)
    hideTimer.current = setTimeout(() => { if (playing) setShowControls(false) }, 3000)
  }, [playing])

  const getPlaybackTime = useCallback(() => {
    const p = playerRef.current
    if (!p) return 0
    if (p.loaded && p.audioContext) {
      if (playing) {
        return p.audioContext.currentTime - (p.audioContextStartTime ?? 0) + p.playbackTimeAtStart
      }
      return p.playbackTimeAtStart
    }
    return 0
  }, [playing])

  const updateNextFrame = useCallback(async () => {
    const p = playerRef.current
    if (!p || !p.videoIterator) return
    const currentAsyncId = p.asyncId
    while (true) {
      const result = await p.videoIterator.next()
      if (result.done || !result.value) break
      if (currentAsyncId !== p.asyncId) break
      const frame = result.value as WrappedCanvas
      const playbackTime = getPlaybackTime()
      const ctx = canvasRef.current?.getContext('2d')
      if (frame.timestamp <= playbackTime) {
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)
          ctx.drawImage(frame.canvas, 0, 0)
        }
      } else {
        p.nextFrame = frame
        break
      }
    }
  }, [getPlaybackTime])

  const runAudioIterator = useCallback(async () => {
    const p = playerRef.current
    if (!p || !p.audioSink || !p.audioIterator) return
    for await (const { buffer, timestamp } of p.audioIterator) {
      if (p.asyncId !== playerRef.current?.asyncId) break
      if (!p.audioContext || !p.gainNode) break
      const node = p.audioContext.createBufferSource()
      node.buffer = buffer
      node.connect(p.gainNode)
      let startTime = (p.audioContextStartTime ?? 0) + timestamp - p.playbackTimeAtStart
      startTime = Math.round(p.audioContext.sampleRate * startTime) / p.audioContext.sampleRate
      if (startTime >= p.audioContext.currentTime) {
        node.start(startTime)
      } else {
        node.start(p.audioContext.currentTime, p.audioContext.currentTime - startTime)
      }
      p.queuedNodes.add(node)
      node.onended = () => { p.queuedNodes.delete(node) }
      if (timestamp - getPlaybackTime() >= 1) {
        await new Promise<void>(resolve => {
          const id = setInterval(() => {
            if (timestamp - getPlaybackTime() < 1 || playerRef.current?.asyncId !== p.asyncId) {
              clearInterval(id)
              resolve()
            }
          }, 100)
        })
      }
    }
  }, [getPlaybackTime])

  const play = useCallback(async () => {
    const p = playerRef.current
    if (!p || !p.audioContext) return
    if (p.audioContext.state === 'suspended') await p.audioContext.resume()
    if (getPlaybackTime() >= p.endTimestamp) {
      p.playbackTimeAtStart = p.firstTimestamp
      p.nextFrame = null
      if (p.videoSink) {
        p.asyncId++
        p.videoIterator = p.videoSink.canvases(p.playbackTimeAtStart)
        const first = (await p.videoIterator.next()).value as WrappedCanvas | undefined
        const second = (await p.videoIterator.next()).value as WrappedCanvas | undefined
        p.nextFrame = second ?? null
        const ctx = canvasRef.current?.getContext('2d')
        if (first && ctx) {
          ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)
          ctx.drawImage(first.canvas, 0, 0)
        }
      }
      setEnded(false)
    }
    p.audioContextStartTime = p.audioContext.currentTime
    setPlaying(true)
    if (p.audioSink) {
      p.audioIterator = p.audioSink.buffers(getPlaybackTime())
      runAudioIterator()
    }
  }, [getPlaybackTime, runAudioIterator])

  const pause = useCallback(() => {
    const p = playerRef.current
    if (!p) return
    p.playbackTimeAtStart = getPlaybackTime()
    setPlaying(false)
    p.audioIterator?.return()
    p.audioIterator = null
    for (const node of p.queuedNodes) node.stop()
    p.queuedNodes.clear()
  }, [getPlaybackTime])

  const togglePlay = useCallback(() => {
    if (playing) pause()
    else play()
  }, [playing, play, pause])

  const seekTo = useCallback(async (seconds: number) => {
    const p = playerRef.current
    if (!p) return
    const wasPlaying = playing
    if (wasPlaying) pause()
    p.playbackTimeAtStart = seconds
    if (p.videoSink) {
      p.asyncId++
      p.videoIterator = p.videoSink.canvases(seconds)
      const first = (await p.videoIterator.next()).value as WrappedCanvas | undefined
      const second = (await p.videoIterator.next()).value as WrappedCanvas | undefined
      p.nextFrame = second ?? null
      const ctx = canvasRef.current?.getContext('2d')
      if (first && ctx) {
        ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)
        ctx.drawImage(first.canvas, 0, 0)
      }
    }
    if (wasPlaying && seconds < p.endTimestamp) play()
  }, [playing, pause, play])

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      try {
        if (!canvasRef.current) return
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Canvas 2D context not available')

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        const audioCtx = new AudioContextClass()
        const gain = audioCtx.createGain()
        gain.connect(audioCtx.destination)

        const input = new Input({
          source: new UrlSource(src, {
            requestInit: { credentials: 'include' },
          }),
          formats: ALL_FORMATS,
        })

        let videoTrack = await input.getPrimaryVideoTrack()
        let audioTrack = await input.getPrimaryAudioTrack()

        const tracks = [videoTrack, audioTrack].filter(t => t !== null) as NonNullable<typeof videoTrack>[]
        const firstTs = Math.max(await input.getFirstTimestamp(tracks), 0)
        const endTs = await input.getDurationFromMetadata(tracks, { skipLiveWait: true })
          ?? await input.computeDuration(tracks, { skipLiveWait: true }) ?? 0

        setDuration(endTs)

        if (videoTrack) {
          const codec = await videoTrack.getCodec()
          if (!codec || !(await videoTrack.canDecode())) {
            videoTrack = null
          }
        }
        if (audioTrack) {
          const codec = await audioTrack.getCodec()
          if (!codec || !(await audioTrack.canDecode())) {
            audioTrack = null
          }
        }

        if (!videoTrack && !audioTrack) throw new Error('No playable audio or video track found')

        const videoSink = videoTrack && new CanvasSink(videoTrack, { poolSize: 2, fit: 'contain' })
        const audioSink = audioTrack && new AudioBufferSink(audioTrack)

        if (videoTrack) {
          canvas.width = await videoTrack.getDisplayWidth()
          canvas.height = await videoTrack.getDisplayHeight()
          canvas.style.display = ''
        } else {
          canvas.style.display = 'none'
        }

        let activeAudioCtx = audioCtx
        let activeGain = gain

        if (audioTrack) {
          const sr = await audioTrack.getSampleRate()
          if (sr) {
            activeAudioCtx.close()
            activeAudioCtx = new AudioContextClass({ sampleRate: sr })
            activeGain = activeAudioCtx.createGain()
            activeGain.connect(activeAudioCtx.destination)
          }
        }

        playerRef.current = {
          input,
          videoSink,
          audioSink,
          videoIterator: videoSink ? videoSink.canvases(firstTs) : null,
          audioIterator: null,
          nextFrame: null,
          audioContext: activeAudioCtx,
          gainNode: activeGain,
          audioContextStartTime: null,
          playbackTimeAtStart: firstTs,
          firstTimestamp: firstTs,
          endTimestamp: endTs,
          queuedNodes: new Set(),
          rafId: 0,
          intervalId: 0,
          asyncId: 0,
          loaded: false,
        }

        if (videoSink && playerRef.current.videoIterator) {
          const first = (await playerRef.current.videoIterator.next()).value as WrappedCanvas | undefined
          const second = (await playerRef.current.videoIterator.next()).value as WrappedCanvas | undefined
          playerRef.current.nextFrame = second ?? null
          if (first) {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(first.canvas, 0, 0)
          }
        }

        playerRef.current.loaded = true
      } catch (err: any) {
        if (!cancelled) setLoadError(err.message || 'Playback failed')
      }
    }
    init()
    return () => {
      cancelled = true
      const p = playerRef.current
      if (p) {
        cancelAnimationFrame(p.rafId)
        clearInterval(p.intervalId)
        p.audioIterator?.return()
        for (const node of p.queuedNodes) node.stop()
        p.audioContext?.close()
      }
    }
  }, [src])

  useEffect(() => {
    const p = playerRef.current
    if (!p) return

    const tick = () => {
      const pp = playerRef.current
      if (!pp || !pp.loaded) { p.rafId = requestAnimationFrame(tick); return }

      const playbackTime = getPlaybackTime()
      if (playbackTime >= pp.endTimestamp) {
        if (playing) {
          pause()
          setEnded(true)
          onEnded?.()
        }
      }

      if (pp.nextFrame && pp.nextFrame.timestamp <= playbackTime) {
        const ctx = canvasRef.current?.getContext('2d')
        if (ctx && canvasRef.current) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
          ctx.drawImage(pp.nextFrame.canvas, 0, 0)
        }
        pp.nextFrame = null
        updateNextFrame()
      }

      setCurrentTime(playbackTime)
      p.rafId = requestAnimationFrame(tick)
    }
    p.rafId = requestAnimationFrame(tick)
    p.intervalId = window.setInterval(() => {
      setCurrentTime(getPlaybackTime())
    }, 500)

    return () => {
      cancelAnimationFrame(p.rafId)
      clearInterval(p.intervalId)
    }
  }, [playing, getPlaybackTime, pause, onEnded, updateNextFrame])

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  const formatTime = (s: number) => {
    if (!s || !isFinite(s)) return '0:00'
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60)
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      className="relative bg-black group cursor-pointer"
      onClick={togglePlay}
      onMouseMove={startHideTimer}
    >
      <canvas
        ref={canvasRef}
        className="w-full aspect-video object-contain"
        style={{ background: poster ? `url(${poster}) center/contain no-repeat` : undefined }}
      />
      {title && (
        <div className="absolute top-4 left-4 text-white text-sm font-medium drop-shadow-lg bg-black/40 px-3 py-1.5 rounded-lg">
          {title}
        </div>
      )}
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
          <div className="text-center max-w-xs">
            <p className="text-sm text-red-400 mb-3">{loadError}</p>
          </div>
        </div>
      )}
      {!playing && !ended && !loadError && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <svg className="w-8 h-8 text-white ml-1" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      )}
      {ended && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <svg className="w-8 h-8 text-white ml-1" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      )}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-16 pb-3 px-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer mb-3 group/progress hover:h-2.5 transition-all" onClick={e => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); const pct = (e.clientX - rect.left) / rect.width; seekTo(pct * duration) }}>
          <div className="h-full bg-[#0099ff]/40 rounded-full" style={{ width: `${progress}%` }}>
            <div className="h-full bg-[#0099ff] rounded-full" style={{ width: '100%' }} />
          </div>
        </div>
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-1 sm:gap-3">
            <button onClick={e => { e.stopPropagation(); seekTo(Math.max(currentTime - 10, 0)) }} className="p-2 sm:p-0 hover:text-[#0099ff]">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 17l-5-5 5-5"/><path d="M18 17l-5-5 5-5"/></svg>
            </button>
            <button onClick={e => { e.stopPropagation(); togglePlay() }} className="p-2 sm:p-0 hover:text-[#0099ff]">
              {playing
                ? <svg className="w-7 h-7 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>
                : <svg className="w-7 h-7 sm:w-6 sm:h-6 ml-1" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              }
            </button>
            <button onClick={e => { e.stopPropagation(); seekTo(Math.min(currentTime + 10, duration)) }} className="p-2 sm:p-0 hover:text-[#0099ff]">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 17l5-5-5-5"/><path d="M6 17l5-5-5-5"/></svg>
            </button>
            <div className="flex items-center gap-1 sm:gap-2">
              <button onClick={e => { e.stopPropagation(); setMuted(!muted) }} className="p-2 sm:p-0 hover:text-[#0099ff]">
                {muted || volume === 0
                  ? <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                  : <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                }
              </button>
              <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
                onChange={e => { const v = parseFloat(e.target.value); setVolume(v); setMuted(v === 0); playerRef.current?.gainNode?.gain.setValueAtTime(v ** 2, playerRef.current?.audioContext?.currentTime ?? 0) }}
                onClick={e => e.stopPropagation()}
                className="w-16 sm:w-20 accent-[#0099ff]"
              />
            </div>
            <span className="text-xs text-gray-300 hidden sm:inline">{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <span className="text-[10px] sm:text-xs text-gray-400 sm:hidden">{formatTime(currentTime)} / {formatTime(duration)}</span>
            <button onClick={e => {
              e.stopPropagation()
              if (onToggleFullscreen) { onToggleFullscreen(); return }
              if (!containerRef.current) return
              if (!document.fullscreenElement) {
                containerRef.current.requestFullscreen()
                try { (screen as any).orientation?.lock?.('landscape') } catch {}
              } else {
                document.exitFullscreen()
                try { (screen as any).orientation?.unlock?.() } catch {}
              }
            }} className="p-2 sm:p-0 hover:text-[#0099ff]">
              {fullscreen
                ? <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>
                : <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/></svg>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
