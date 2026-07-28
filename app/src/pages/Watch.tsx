import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { liveUrl, seriesUrls, fetchVodInfo, fetchSeriesInfo, fetchLiveStreams, vodUrlTesters, vodUrlWithExt, proxyUrl } from '@/lib/supabase'
import { getChannelById } from '@/lib/rotation'
import VideoPlayer from '@/sections/VideoPlayer'
import LivePlayer from '@/sections/LivePlayer'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'

const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

function encBase(base: string): string {
  return btoa(base).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function proxyExternalUrl(url: string): string {
  if (url.startsWith('/') || url.startsWith('blob:')) return url
  try {
    const u = new URL(url)
    const base = u.protocol + '//' + u.hostname + (u.port ? ':' + u.port : '')
    const path = u.pathname + (u.search || '')
    return '/dyn/' + encBase(base) + path
  } catch { return url }
}

const reorderUrls = (urls: string[]) => {
  if (!isMobile) return urls
  // Mobile: MKV first (Mediabunny AC3 decoder icin), HLS/MP4 sonra
  return [...urls].sort((a, b) => {
    const aMkv = a.endsWith('.mkv'), bMkv = b.endsWith('.mkv')
    if (aMkv && !bMkv) return -1  // MKV once
    if (!aMkv && bMkv) return 1
    return 0
  })
}

export default function Watch() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { server } = useAuth()
  const [url, setUrl] = useState('')
  const [fallbackUrls, setFallbackUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)


  const streamId = params.get('stream_id')
  const rotationId = params.get('rotation_id')
  const type = params.get('type') || 'live'
  const season = params.get('season') || '1'
  const episode = params.get('episode') || '1'
  const ext = params.get('ext') || ''
  const seriesId = params.get('series_id') || ''


  const resolveStream = useCallback(async () => {
    if (!server) return
    let cancelled = false
    setLoading(true); setError(null)
    try {
      if (rotationId) {
        const ch = getChannelById(rotationId)
        if (!ch || ch.urls.length === 0) throw new Error('Kanal bulunamadı')
        if (!cancelled) { setUrl(proxyExternalUrl(ch.urls[0])); setFallbackUrls(ch.urls.slice(1).map(proxyExternalUrl)); setTitle(ch.name) }
      } else if (streamId) {
        const sid = parseInt(streamId)
        const { base_url, xtream_user, xtream_pass } = server
        if (type === 'movie') {
          const allUrls = reorderUrls(ext
            ? [vodUrlWithExt(base_url, xtream_user, xtream_pass, sid, ext), ...vodUrlTesters.map(fn => fn(base_url, xtream_user, xtream_pass, sid))]
            : vodUrlTesters.map(fn => fn(base_url, xtream_user, xtream_pass, sid)))
          if (!cancelled) { 
            setUrl(allUrls[0]); setFallbackUrls(allUrls.slice(1))
          }
          try {
            const info = await fetchVodInfo(base_url, xtream_user, xtream_pass, sid)
            if (!cancelled) setTitle((info as any)?.info?.name || `Film ${streamId}`)
          } catch {}
          if (!cancelled) setTitle(`Film ${streamId}`)
        } else if (type === 'series') {
          const allUrls: string[] = []
          const sidNum = seriesId ? parseInt(seriesId) : sid
          allUrls.push(...seriesUrls(base_url, xtream_user, xtream_pass, sid, season, episode, ext, sidNum))
          const tryIds = [sid, sidNum]
          for (const id of tryIds) {
            if (!isNaN(id)) {
              allUrls.push(...vodUrlTesters.map(fn => fn(base_url, xtream_user, xtream_pass, id)))
            }
          }
          if (streamId && base_url) {
            allUrls.push(proxyUrl(base_url, `/movie/${xtream_user}/${xtream_pass}/${streamId}.m3u8`))
            allUrls.push(proxyUrl(base_url, `/movie/${xtream_user}/${xtream_pass}/${streamId}.mp4`))
            allUrls.push(proxyUrl(base_url, `/movie/${xtream_user}/${xtream_pass}/${streamId}`))
            allUrls.push(`/p2095/movie/${xtream_user}/${xtream_pass}/${streamId}.mkv`)
            allUrls.push(`/p2095/movie/${xtream_user}/${xtream_pass}/${streamId}.m3u8`)
            allUrls.push(`/p2095/movie/${xtream_user}/${xtream_pass}/${streamId}.mp4`)
            allUrls.push(`/p2095/movie/${xtream_user}/${xtream_pass}/${streamId}`)
          }
          if (!cancelled) {
            const ordered = reorderUrls(allUrls)
            setUrl(ordered[0]); setFallbackUrls(ordered.slice(1))
          }
          try {
            const info = await fetchSeriesInfo(base_url, xtream_user, xtream_pass, sid)
            if (!cancelled) setTitle((info as any)?.info?.name || `Dizi ${streamId}`)
          } catch {}
          if (!cancelled) setTitle(`Dizi ${streamId}`)
        } else {
          const primaryUrl = liveUrl(base_url, xtream_user, xtream_pass, sid)
          const fbUrl = proxyUrl(base_url, `/live/${xtream_user}/${xtream_pass}/${sid}.m3u8`)
          if (!cancelled) { setUrl(primaryUrl); setFallbackUrls([fbUrl]); setTitle(`Kanal ${streamId}`) }
        }
      } else {
        throw new Error('Yayın ID belirtilmedi')
      }
    } catch (err: any) {
      if (!cancelled) setError(err.message || 'Yayın yüklenirken hata oluştu')
    } finally { if (!cancelled) setLoading(false) }
    return () => { cancelled = true }
  }, [streamId, rotationId, type, season, episode, ext, seriesId, server])

  useEffect(() => { resolveStream() }, [resolveStream])

  useEffect(() => {
    if (!streamId && !rotationId) return
    refreshTimerRef.current = setInterval(() => {
      setRefreshKey(k => k + 1)
    }, 90000)
    return () => clearInterval(refreshTimerRef.current)
  }, [streamId, rotationId])

  useEffect(() => {
    if (!refreshKey || !server) return
    if (streamId && type === 'live') {
      const sid = parseInt(streamId)
      const { base_url, xtream_user, xtream_pass } = server
      const newUrl = liveUrl(base_url, xtream_user, xtream_pass, sid)
      const newFb = proxyUrl(base_url, `/live/${xtream_user}/${xtream_pass}/${sid}.m3u8`)
      setUrl(newUrl)
      setFallbackUrls([newFb])
    } else if (rotationId) {
      const ch = getChannelById(rotationId)
      if (ch && ch.urls.length > 0) {
        setUrl(proxyExternalUrl(ch.urls[0]))
        setFallbackUrls(ch.urls.slice(1).map(proxyExternalUrl))
      }
    }
  }, [refreshKey, server, streamId, rotationId, type])

  const handleChannelChange = (newId: string, newUrl: string, newTitle: string) => {
    setUrl(proxyExternalUrl(newUrl)); setTitle(newTitle); setLoading(false); setError(null)
    const sp = new URLSearchParams(params)
    sp.set('rotation_id', newId)
    sp.delete('stream_id')
    setParams(sp, { replace: true })
  }

  if (!streamId && !rotationId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-500">Yayın ID belirtilmedi</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between pointer-events-none">
        <button onClick={() => navigate(-1)} className="w-10 h-10 md:w-9 md:h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 pointer-events-auto">
          <ArrowLeft className="w-5 h-5" />
        </button>
        {title && <span className="text-xs text-gray-400 truncate max-w-[160px] md:max-w-[200px] bg-black/40 px-2 py-1 rounded-lg">{title}</span>}

      </div>
      {loading && !url ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-[#0099ff] animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Yayın yükleniyor...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm px-6">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-red-400 mb-4">{error}</p>
            <button onClick={() => navigate(-1)} className="px-5 py-2 rounded-lg bg-white/10 text-white text-sm">Geri Dön</button>
          </div>
        </div>
      ) : url ? (
        <div className="flex-1 flex items-center justify-center bg-black">
          <div className="w-full max-w-full md:max-w-5xl">
            {rotationId ? (
              <LivePlayer channelId={rotationId} title={title} src={url} onEnded={() => navigate(-1)} onChannelChange={handleChannelChange} />
            ) : (
              <VideoPlayer src={url} fallbackSrcs={fallbackUrls} title={title} onEnded={() => navigate(-1)}
                onRefreshUrl={() => {
                  if (streamId && server && type === 'live') {
                    const sid = parseInt(streamId)
                    return liveUrl(server.base_url, server.xtream_user, server.xtream_pass, sid)
                  }
                  if (rotationId) {
                    const ch = getChannelById(rotationId)
                    return ch?.urls[0] ? proxyExternalUrl(ch.urls[0]) : undefined
                  }
                  return undefined
                }} />
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
