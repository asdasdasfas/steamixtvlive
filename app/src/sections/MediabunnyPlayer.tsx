import { useEffect, useRef, useState, useCallback } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react'
import {
  Input,
  ALL_FORMATS,
  UrlSource,
  CanvasSink,
  AudioBufferSink,
  type WrappedCanvas,
  type WrappedAudioBuffer,
} from 'mediabunny'

const IS_MOBILE = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

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
  const isPlayingRef = useRef(false)
  const [ended, setEnded] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loadError, setLoadError] = useState('')
  const [showControls, setShowControls] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const playStopRef = useRef<() => void>(() => {})
  const dbg = (_msg: string) => {}

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
    lastScheduledEnd: number
    lastBufferTime: number
    src: string
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
      if (isPlayingRef.current) {
        return p.audioContext.currentTime - (p.audioContextStartTime ?? 0) + p.playbackTimeAtStart
      }
      return p.playbackTimeAtStart
    }
    return 0
  }, [])

  const updateNextFrame = useCallback(async () => {
    if (updatingFrameRef.current) return
    updatingFrameRef.current = true
    const p = playerRef.current
    if (!p || !p.videoIterator) { updatingFrameRef.current = false; return }
    const currentAsyncId = p.asyncId
    let gotFrame = false
    try {
      while (true) {
        const result = await p.videoIterator.next()
        if (result.done || !result.value) {
          if (currentAsyncId === p.asyncId && p.videoSink) {
            const pos = getPlaybackTime()
            p.videoIterator = p.videoSink.canvases(pos)
            continue
          }
          break
        }
        if (currentAsyncId !== p.asyncId) break
        const frame = result.value as WrappedCanvas
        const playbackTime = getPlaybackTime()
        const ctx = canvasRef.current?.getContext('2d')
        if (frame.timestamp <= playbackTime) {
          if (ctx) {
            ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)
            ctx.drawImage(frame.canvas, 0, 0)
          }
          gotFrame = true
        } else {
          p.nextFrame = frame
          return
        }
      }
    } finally {
      updatingFrameRef.current = false
    }
    // hic frame gelmedi - siyah ekran korumasi
    if (!gotFrame && playerRef.current?.asyncId === currentAsyncId) {
      blackScreenWarnRef.current++
      if (blackScreenWarnRef.current > 5) {
        dbg(`Black screen detected at ${getPlaybackTime().toFixed(1)}s — recreating video`)
        blackScreenWarnRef.current = 0
        const pp = playerRef.current
        if (pp?.videoSink) {
          const pos = getPlaybackTime()
          pp.asyncId++
          const newId = pp.asyncId
          pp.videoIterator = pp.videoSink.canvases(pos)
          pp.nextFrame = null
          pp.videoIterator.next().then(r1 => {
            if (r1.done || !r1.value || playerRef.current?.asyncId !== newId) return
            const ctx = canvasRef.current?.getContext('2d')
            if (ctx) {
              ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)
              ctx.drawImage(r1.value.canvas, 0, 0)
            }
            pp.videoIterator!.next().then(r2 => {
              pp.nextFrame = (r2.done ? null : r2.value) as WrappedCanvas | null
            })
          })
        }
      } else {
        updateNextFrame()
      }
    } else {
      blackScreenWarnRef.current = 0
    }
  }, [getPlaybackTime])

  const fixBuffer = useCallback((buf: AudioBuffer, ctx: AudioContext): AudioBuffer => {
    const sameSr = buf.sampleRate === ctx.sampleRate
    const sameCh = buf.numberOfChannels <= 2
    if (sameSr && sameCh) return buf
    const outCh = Math.min(buf.numberOfChannels, 2)
    const ratio = buf.sampleRate / ctx.sampleRate
    const outLen = sameSr ? buf.length : Math.round(buf.length / ratio)
    const out = ctx.createBuffer(outCh, outLen, ctx.sampleRate)
    const ch = buf.numberOfChannels
    for (let oc = 0; oc < outCh; oc++) {
      const dst = out.getChannelData(oc)
      if (ch <= 2) {
        const src = buf.getChannelData(oc)
        if (sameSr) { dst.set(src); continue }
        for (let i = 0; i < outLen; i++) {
          const si = i * ratio; const i1 = Math.floor(si); const i2 = Math.min(i1 + 1, src.length - 1); const f = si - i1
          dst[i] = src[i1] + (src[i2] - src[i1]) * f
        }
      } else {
        const FL = buf.getChannelData(0), FR = buf.getChannelData(1)
        const FC = ch >= 3 ? buf.getChannelData(2) : null, LFE = ch >= 4 ? buf.getChannelData(3) : null
        const BL = ch >= 5 ? buf.getChannelData(4) : null, BR = ch >= 6 ? buf.getChannelData(5) : null
        if (sameSr) {
          for (let i = 0; i < outLen; i++) {
            const l = FL[i] + (FC ? FC[i] * 0.707 : 0) + (BL ? BL[i] * 0.707 : 0) + (LFE ? LFE[i] * 0.5 : 0)
            const r = FR[i] + (FC ? FC[i] * 0.707 : 0) + (BR ? BR[i] * 0.707 : 0) + (LFE ? LFE[i] * 0.5 : 0)
            dst[i] = oc === 0 ? l : r
          }
        } else {
          for (let i = 0; i < outLen; i++) {
            const si = i * ratio; const i1 = Math.floor(si); const i2 = Math.min(i1 + 1, FL.length - 1); const f = si - i1
            const fl = FL[i1] + (FL[i2] - FL[i1]) * f
            const fr = FR[i1] + (FR[i2] - FR[i1]) * f
            const fc = FC ? FC[i1] + (FC[i2] - FC[i1]) * f : 0
            const lfe = LFE ? LFE[i1] + (LFE[i2] - LFE[i1]) * f : 0
            const bl = BL ? BL[i1] + (BL[i2] - BL[i1]) * f : 0
            const br = BR ? BR[i1] + (BR[i2] - BR[i1]) * f : 0
            dst[i] = oc === 0
              ? fl + fc * 0.707 + bl * 0.707 + lfe * 0.5
              : fr + fc * 0.707 + br * 0.707 + lfe * 0.5
          }
        }
      }
    }
    return out
  }, [])

  const scheduleAudioBuffer = useCallback((buffer: AudioBuffer, timestamp: number) => {
    const p = playerRef.current
    if (!p || !p.audioContext || !p.gainNode) return
    const node = p.audioContext.createBufferSource()
    node.buffer = fixBuffer(buffer, p.audioContext)
    node.connect(p.gainNode)
    const startTime = (p.audioContextStartTime ?? 0) + timestamp - p.playbackTimeAtStart
    const rounded = Math.round(p.audioContext.sampleRate * startTime) / p.audioContext.sampleRate
    if (rounded >= p.audioContext.currentTime) {
      node.start(rounded)
      if (audioBufCountRef.current <= 1) dbg(`Sched ts=${timestamp.toFixed(2)} cur=${p.audioContext.currentTime.toFixed(2)} start=${rounded.toFixed(2)} OK`)
    } else {
      node.start(p.audioContext.currentTime, p.audioContext.currentTime - rounded)
      if (audioBufCountRef.current <= 1) dbg(`Sched ts=${timestamp.toFixed(2)} cur=${p.audioContext.currentTime.toFixed(2)} start=${p.audioContext.currentTime.toFixed(2)} offset=${(p.audioContext.currentTime - rounded).toFixed(3)} LATE`)
    }
    p.queuedNodes.add(node)
    node.onended = () => { p.queuedNodes.delete(node) }
    p.lastBufferTime = Date.now()
    const bufEnd = rounded + node.buffer.duration
    if (bufEnd > (p.lastScheduledEnd ?? 0)) p.lastScheduledEnd = bufEnd
  }, [fixBuffer])

  const audioBufCountRef = useRef(0)
  const audioStallTimeout = (ms: number) => new Promise<'timeout'>(resolve => setTimeout(() => resolve('timeout'), ms))
  const pendingPlayRef = useRef(false)
  const firstPlayDoneRef = useRef(false)
  const seekTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSeekTimeRef = useRef(0)
  const pendingSeekRef = useRef<number | null>(null)
  const autoRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioRetryCount = useRef(0)
  const recreateCount = useRef(0)
  const RECREATE_LIMIT = 3
  const updatingFrameRef = useRef(false)
  const blackScreenWarnRef = useRef(0)

  const forceReload = useCallback(() => {
    const pos = getPlaybackTime()
    try { localStorage.setItem('mb_resume_pos', String(pos)); localStorage.setItem('mb_resume_src', src) } catch {}
    dbg(`FORCE RELOAD at ${pos.toFixed(2)}s (recreateCount=${recreateCount.current})`)
    setTimeout(() => location.reload(), 100)
  }, [getPlaybackTime, src])

  const runAudioIterator = useCallback(async (asyncId: number) => {
    dbg(`Audio iterator started (id=${asyncId})`)
    const p = playerRef.current
    if (!p || !p.audioSink || !p.audioContext || !p.gainNode || !p.audioIterator) { dbg('Audio exit: missing refs'); return }
    let it = p.audioIterator
    let bufCount = 0
    try {
      while (true) {
        if (playerRef.current?.asyncId !== asyncId) { dbg(`Audio exit: asyncId changed`); break }
        const timeoutMs = bufCount === 0 ? (recreateCount.current > 0 ? 8000 : 2000) : 30000
        const raced = await Promise.race([
          it.next().then(r => ({ tag: 'next' as const, done: r.done, value: r.value })),
          audioStallTimeout(timeoutMs),
        ])
        if (playerRef.current?.asyncId !== asyncId) { dbg(`Audio exit: asyncId changed`); break }
        if (raced === 'timeout' || raced.done) {
          const count = bufCount
          if (raced === 'timeout') dbg(`Audio TIMEOUT after ${count} buffers (id=${asyncId})`)
          it.return?.()
          const pp = playerRef.current
          if (count === 0 && pp && pp.asyncId === asyncId) {
            // Hic buffer gelmedi, decoder olmus — direkt recreate (retry yok)
            dbg(`Decoder dead at ${getPlaybackTime().toFixed(2)}s (id=${asyncId}) — recreating session`)
            recreateSession()
          } else if (count > 0 && pp && pp.asyncId === asyncId) {
            audioRetryCount.current = 0
            const curPos = getPlaybackTime()
            dbg(`Audio stalled — restart at ${curPos.toFixed(2)}s`)
            for (const node of pp.queuedNodes) { try { node.stop() } catch {} }; pp.queuedNodes.clear()
            pp.playbackTimeAtStart = curPos
            pp.audioContextStartTime = pp.audioContext?.currentTime ?? 0
            pp.asyncId++
            const newId = pp.asyncId
            try { pp.audioIterator = pp.audioSink?.buffers(curPos) ?? null } catch (e) { dbg(`Stall restart error: ${e}`); pp.audioIterator = null }
            if (pp.audioIterator) runAudioIterator(newId)
          } else {
            dbg('Audio ended')
          }
          break
        }
        if (playerRef.current?.asyncId !== asyncId) break
        const { buffer, timestamp } = raced.value as { buffer: AudioBuffer; timestamp: number }
        const beforeSched = performance.now()
        scheduleAudioBuffer(buffer, timestamp)
        recreateCount.current = 0  // basarili buffer -> recreate sayaci sifir
        lastSeekTimeRef.current = 0  // seek kilidi acik (pipeline stabilize)
        if (bufCount === 0) {
          dbg(`First buf arrived ts=${timestamp.toFixed(2)} sched_dur=${(performance.now()-beforeSched).toFixed(1)}ms`)
          if (Math.abs(timestamp - p.playbackTimeAtStart) > 2) {
            dbg(`Desync: adj playbackTimeAtStart ${p.playbackTimeAtStart.toFixed(2)} -> ${timestamp.toFixed(2)}`)
            p.playbackTimeAtStart = timestamp
            p.audioContextStartTime = p.audioContext?.currentTime ?? 0
          }
        }
        bufCount++
        if (bufCount === 1 || bufCount % 30 === 0) {
          const pt = getPlaybackTime()
          dbg(`Audio buf#${bufCount} ts=${timestamp.toFixed(2)} ctx=${p.audioContext.currentTime.toFixed(2)} playTime=${pt.toFixed(2)}`)
        }
        if (p.queuedNodes.size > 256) {
          await new Promise<void>(resolve => {
            const check = () => { if (!playerRef.current || playerRef.current.queuedNodes.size < 128 || playerRef.current.asyncId !== asyncId) resolve(); else setTimeout(check, 50) }
            check()
          })
        }
      }
    } catch (err) {
      dbg(`Audio iterator ERROR: ${err}`)
    }
    // HER ZAMAN iterator'i temizle (asyncId degisse bile!)
    try { it.return() } catch {}
    if (playerRef.current?.audioIterator === it) playerRef.current.audioIterator = null
    dbg(`Audio iterator DONE (id=${asyncId})`)
  }, [getPlaybackTime, scheduleAudioBuffer])

  const recreateSession = useCallback(async () => {
    const p = playerRef.current
    if (!p || !p.src) { dbg(`Recreate: no player`); return }
    recreateCount.current++
    if (recreateCount.current > RECREATE_LIMIT) {
      dbg(`Recreate limit exceeded (${recreateCount.current}) — force reload`)
      forceReload()
      return
    }
    const pos = getPlaybackTime()
    dbg(`Recreating Mediabunny session #${recreateCount.current} at ${pos.toFixed(2)}s`)
    try {
      const newInput = new Input({
        source: new UrlSource(p.src, {
          requestInit: { credentials: 'include' },
        }),
        formats: ALL_FORMATS,
      })
      let newVideoTrack = await newInput.getPrimaryVideoTrack()
      let newAudioTrack = await newInput.getPrimaryAudioTrack()
      if (newVideoTrack) {
        const codec = await newVideoTrack.getCodec()
        if (!codec || !(await newVideoTrack.canDecode())) newVideoTrack = null
      }
      if (newAudioTrack) {
        const codec = await newAudioTrack.getCodec()
        if (!codec || !(await newAudioTrack.canDecode())) newAudioTrack = null
      }
      if (!newVideoTrack && !newAudioTrack) { dbg(`Recreate: no tracks`); return }
      const newVideoSink = newVideoTrack && new CanvasSink(newVideoTrack, { poolSize: 2, fit: 'contain' })
      const newAudioSink = newAudioTrack && new AudioBufferSink(newAudioTrack)
      if (newVideoTrack && canvasRef.current) {
        canvasRef.current.width = await newVideoTrack.getDisplayWidth()
        canvasRef.current.height = await newVideoTrack.getDisplayHeight()
      }
      const startPos = Math.min(pos, p.endTimestamp - 0.5)
      p.input = newInput
      p.videoSink = newVideoSink
      p.audioSink = newAudioSink
      p.videoIterator = newVideoSink ? newVideoSink.canvases(startPos) : null
      p.audioIterator = null
      p.nextFrame = null
      p.playbackTimeAtStart = startPos
      p.audioContextStartTime = p.audioContext?.currentTime ?? 0
      p.asyncId++
      const newId = p.asyncId
      for (const node of p.queuedNodes) { try { node.stop() } catch {} }; p.queuedNodes.clear()
      p.lastScheduledEnd = 0
      p.lastBufferTime = 0
      audioRetryCount.current = 0
      if (newAudioSink) {
        try { p.audioIterator = newAudioSink.buffers(startPos) } catch (e) { dbg(`Recreate buffers() error: ${e}`) }
        if (p.audioIterator) runAudioIterator(newId)
      }
      if (newVideoSink && p.videoIterator) {
        ;(async () => {
          const first = await p.videoIterator!.next()
          if (first.done || !first.value || playerRef.current?.asyncId !== newId) return
          const second = await p.videoIterator!.next()
          if (playerRef.current?.asyncId !== newId) return
          p.nextFrame = (second.done ? null : second.value) as WrappedCanvas | null
          const ctx = canvasRef.current?.getContext('2d')
          if (ctx) {
            ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)
            ctx.drawImage(first.value.canvas, 0, 0)
          }
        })()
      }
      dbg(`Recreate done at ${startPos.toFixed(2)}s`)
    } catch (e) {
      dbg(`Recreate failed: ${e}`)
    }
  }, [getPlaybackTime, runAudioIterator])

  const startPlayback = useCallback(async (seconds?: number) => {
    const p = playerRef.current
    if (!p || !p.audioContext) { dbg('Start: no player'); return }
    if (p.audioContext.state === 'suspended') await p.audioContext.resume()

    const pos = seconds ?? getPlaybackTime()
    dbg(`Start playback at ${pos.toFixed(2)}s (firstPlay=${firstPlayDoneRef.current})`)

    if (pos >= p.endTimestamp) {
      p.playbackTimeAtStart = p.firstTimestamp
      p.nextFrame = null
      setEnded(false)
    }

    p.playbackTimeAtStart = pos
    p.audioContextStartTime = p.audioContext.currentTime
    p.audioIterator?.return()
    audioRetryCount.current = 0
    recreateCount.current = 0

    // Her seek'te asyncId artir (audio+video korelasyonu icin)
    p.asyncId++
    const seekId = p.asyncId

    // Ses ONCE baslasin (video frame'leri beklenmez)
    const audioSink = p.audioSink
    if (audioSink && p.loaded) {
      dbg(`Audio iterator from ${pos.toFixed(3)}s (id=${seekId})`)
      try { p.audioIterator = audioSink.buffers(pos) } catch (e) { dbg(`Start buffers() error: ${e}`); p.audioIterator = null }
      if (p.audioIterator) runAudioIterator(seekId)
    } else if (p.audioSink) {
      dbg(`Audio pending (loaded=${p.loaded})`)
      pendingPlayRef.current = true
    }

    // isPlayingRef hemen true (video seek beklenmez, getPlaybackTime calissin)
    setPlaying(true)
    isPlayingRef.current = true

    // Video karelerini arka planda getir (await YOK, bloklama yok)
    if (p.videoSink) {
      const oldIt = p.videoIterator
      const it = p.videoSink.canvases(pos)
      p.videoIterator = it
      oldIt?.return()
      dbg(`Video seek start pos=${pos.toFixed(2)}`)
      ;(async () => {
        const first = await it.next()
        if (first.done || !first.value || playerRef.current?.asyncId !== seekId) return
        const second = await it.next()
        if (playerRef.current?.asyncId !== seekId) return
        p.nextFrame = (second.done ? null : second.value) as WrappedCanvas | null
        const ctx = canvasRef.current?.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)
          ctx.drawImage(first.value.canvas, 0, 0)
        }
        dbg(`Video seek done pos=${pos.toFixed(2)}`)
      })()
    }

    if (!firstPlayDoneRef.current) {
      firstPlayDoneRef.current = true
      if (!IS_MOBILE) {
        autoRefreshTimeoutRef.current = setTimeout(() => {
          autoRefreshTimeoutRef.current = null
          if (!isPlayingRef.current || !playerRef.current) return
          const jumpTo = getPlaybackTime() + 0.1
          if (jumpTo < (playerRef.current.endTimestamp ?? 0)) {
            dbg(`Auto-refresh seek +0.1s`)
            const pp = playerRef.current
            pp.asyncId++
            if (pp.videoSink) {
              pp.videoIterator = pp.videoSink.canvases(jumpTo)
              pp.videoIterator.next().then(r1 => {
                if (r1.done || !r1.value) return
                const ctx = canvasRef.current?.getContext('2d')
                if (ctx && canvasRef.current) {
                  ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
                  ctx.drawImage((r1.value as WrappedCanvas).canvas, 0, 0)
                }
                pp.videoIterator!.next().then(r2 => {
                  pp.nextFrame = (r2.done ? null : r2.value) as WrappedCanvas | null
                })
              })
            }
            pp.audioIterator?.return()
            const newAudioId = pp.asyncId
            pp.audioIterator = pp.audioSink?.buffers(jumpTo) ?? null
            if (pp.audioIterator) runAudioIterator(newAudioId)
          }
        }, 800)
      }
    }
  }, [runAudioIterator])

  const stop = useCallback((caller = '?') => {
    const p = playerRef.current
    if (!p) return
    dbg(`Stop at ${getPlaybackTime().toFixed(2)}s [${caller}]`)
    if (autoRefreshTimeoutRef.current) { clearTimeout(autoRefreshTimeoutRef.current); autoRefreshTimeoutRef.current = null }
    if (seekTimeoutRef.current) { clearTimeout(seekTimeoutRef.current); seekTimeoutRef.current = null }
    p.asyncId++
    p.playbackTimeAtStart = getPlaybackTime()
    setPlaying(false)
    isPlayingRef.current = false
    p.audioIterator?.return()
    p.audioIterator = null
    const count = p.queuedNodes.size
    for (const node of p.queuedNodes) node.stop()
    p.queuedNodes.clear()
    dbg(`Stopped ${count} audio nodes`)
  }, [getPlaybackTime])

  const handlePlayStop = useCallback(() => {
    if (isPlayingRef.current) stop('hps')
    else {
      if (IS_MOBILE) {
        const p = playerRef.current
        if (p?.audioContext?.state === 'suspended') {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
          p.audioContext.close()
          p.audioContext = new AudioContextClass()
          p.gainNode = p.audioContext.createGain()
          p.gainNode.connect(p.audioContext.destination)
        }
      }
      startPlayback()
    }
  }, [stop, startPlayback, IS_MOBILE])

  // Keep ref in sync so button callback is stable
  playStopRef.current = handlePlayStop

  const seekTo = useCallback(async (seconds: number) => {
    if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current)
    pendingSeekRef.current = seconds
    seekTimeoutRef.current = setTimeout(() => {
      seekTimeoutRef.current = null
      const target = pendingSeekRef.current
      pendingSeekRef.current = null
      if (target === null) return
      const now = Date.now()
      if (now - lastSeekTimeRef.current < 1500) { dbg(`Seek skip (too fast) ${target.toFixed(1)}`); return }
      lastSeekTimeRef.current = now
      const p = playerRef.current
      if (!p) return
      const wasPlaying = isPlayingRef.current
      const curPos = getPlaybackTime()
      dbg(`Seek ${curPos.toFixed(1)} → ${target.toFixed(1)} (wasPlaying=${wasPlaying})`)
      if (wasPlaying) stop('seek')
      p.playbackTimeAtStart = target
      if (wasPlaying && target < p.endTimestamp) startPlayback(target)
    }, 200)
  }, [stop, startPlayback, getPlaybackTime])

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

        dbg(`Init: ${src.substring(0,120)}`)
        const input = new Input({
          source: new UrlSource(src, {
            requestInit: { credentials: 'include' },
          }),
          formats: ALL_FORMATS,
        })

        let videoTrack = await input.getPrimaryVideoTrack()
        let audioTrack = await input.getPrimaryAudioTrack()
        dbg(`Tracks: video=${!!videoTrack} audio=${!!audioTrack}`)

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
        dbg(`FirstTs=${firstTs.toFixed(2)} EndTs=${endTs.toFixed(2)}`)

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

        if (audioTrack && !IS_MOBILE) {
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
          src,
          queuedNodes: new Set(),
          rafId: 0,
          intervalId: 0,
          asyncId: 0,
          loaded: false,
          lastScheduledEnd: 0,
          lastBufferTime: 0,
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

        // Reload sonrasi pozisyonu geri yukle
        try {
          const resumeSrc = localStorage.getItem('mb_resume_src')
          const resumePos = localStorage.getItem('mb_resume_pos')
          const pp = playerRef.current
          if (pp && resumeSrc === pp.src && resumePos) {
            const pos = parseFloat(resumePos)
            if (isFinite(pos) && pos > 0 && pos < endTs) {
              dbg(`Resuming from ${pos.toFixed(2)}s (reload resume)`)
              pp.playbackTimeAtStart = pos
              pp.firstTimestamp = pos
              localStorage.removeItem('mb_resume_src')
              localStorage.removeItem('mb_resume_pos')
            }
          }
        } catch {}

        playerRef.current.loaded = true
        if (pendingPlayRef.current) {
          pendingPlayRef.current = false
          dbg('Init complete, executing pending start')
          startPlayback()
        }
      } catch (err: any) {
        if (!cancelled) setLoadError(err.message || 'Playback failed')
      }
    }
    init()
    return () => {
      cancelled = true
      if (seekTimeoutRef.current) { clearTimeout(seekTimeoutRef.current); seekTimeoutRef.current = null }
      if (autoRefreshTimeoutRef.current) { clearTimeout(autoRefreshTimeoutRef.current); autoRefreshTimeoutRef.current = null }
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
      try {
        const pp = playerRef.current
        if (!pp || !pp.loaded) return

        const playbackTime = getPlaybackTime()
        if (playbackTime >= pp.endTimestamp) {
          if (playing) {
            stop('tick')
            setEnded(true)
            onEnded?.()
          }
        }

        if (playing && playbackTime < pp.endTimestamp) {
          const now = Date.now()
          if (pp.queuedNodes.size === 0 && (pp.lastScheduledEnd ?? 0) > 0 && playbackTime > (pp.lastScheduledEnd ?? 0) + 0.5) {
            dbg(`Audio queue empty at ${playbackTime.toFixed(2)}s — recreating`)
            recreateSession()
          } else if ((pp.lastBufferTime ?? 0) > 0 && now - (pp.lastBufferTime ?? 0) > 10000) {
            dbg(`No buffer for 10s at ${playbackTime.toFixed(2)}s — recreating`)
            recreateSession()
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
        } else if (!pp.nextFrame) {
          updateNextFrame()
        }

        setCurrentTime(playbackTime)
      } catch (err) {
        dbg(`Tick error: ${err}`)
      }
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
  }, [playing, getPlaybackTime, stop, onEnded, updateNextFrame, runAudioIterator, recreateSession])

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
      {ended && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <svg className="w-8 h-8 text-white ml-1" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      )}

      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-16 pb-3 px-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer mb-3 group/progress hover:h-2.5 transition-all" onClick={e => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); const pct = (e.clientX - rect.left) / rect.width; seekTo(pct * duration) }}>
          <div className="h-full bg-white/30 rounded-full" style={{ width: `${progress}%` }}>
            <div className="h-full bg-[#0099ff] rounded-full" style={{ width: '100%' }} />
          </div>
        </div>
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-1 sm:gap-3">
            <button onClick={e => { e.stopPropagation(); seekTo(Math.max(currentTime - 10, 0)) }} className="p-2 sm:p-0 hover:text-[#0099ff]"><SkipBack className="w-5 h-5 sm:w-5 sm:h-5" /></button>
            <div role="button" tabIndex={0} onPointerDown={e => { e.preventDefault(); e.stopPropagation(); playStopRef.current() }} className="p-2 sm:p-0 hover:text-[#0099ff] cursor-pointer">{playing ? <Pause className="w-7 h-7 sm:w-6 sm:h-6" /> : <Play className="w-7 h-7 sm:w-6 sm:h-6" />}</div>
            <button onClick={e => { e.stopPropagation(); seekTo(Math.min(currentTime + 10, duration)) }} className="p-2 sm:p-0 hover:text-[#0099ff]"><SkipForward className="w-5 h-5 sm:w-5 sm:h-5" /></button>
            <div className="flex items-center gap-1 sm:gap-2">
              <button onClick={e => { e.stopPropagation(); setMuted(!muted) }} className="p-2 sm:p-0 hover:text-[#0099ff]">{muted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</button>
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
              {fullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
