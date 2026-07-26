import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { liveUrl, seriesUrls, fetchVodInfo, fetchSeriesInfo, fetchLiveStreams, vodUrlTesters, vodUrlWithExt, proxyUrl } from '@/lib/supabase'
import { getChannelById } from '@/lib/rotation'
import VideoPlayer from '@/sections/VideoPlayer'
import LivePlayer from '@/sections/LivePlayer'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'

const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

const reorderUrls = (urls: string[]) => {
  if (!isMobile) return urls
  return [...urls].sort((a, b) => {
    const aMkv = a.endsWith('.mkv'), bMkv = b.endsWith('.mkv')
    if (aMkv && !bMkv) return -1
    if (!aMkv && bMkv) return 1
    return 0
  })
}

// Convert any VOD proxy URL to its /audio-fix/ equivalent for AC3→AAC transcoding on mobile
function toAudioFixUrl(url: string): string | null {
  if (url.startsWith('/audio-fix/')) return null
  const enc = (s: string) => btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
  if (url.startsWith('/dyn/')) return '/audio-fix/' + url.slice('/dyn/'.length)
  if (url.startsWith('/p/')) return '/audio-fix/' + url.slice('/p/'.length)
  if (url.startsWith('/p2095/')) return '/audio-fix/' + enc('http://dzcvip1.xyz:2095') + url.slice('/p2095'.length)
  if (url.startsWith('/p8080/')) return '/audio-fix/' + enc('http://dzcvip1.xyz:8080') + url.slice('/p8080'.length)
  if (url.startsWith('/xtream-api/')) return '/audio-fix/' + enc('http://ctn34.xyz:8080') + url.slice('/xtream-api'.length)
  if (url.startsWith('/xtream/')) return '/audio-fix/' + enc('http://dzcvip1.xyz:2095') + url.slice('/xtream'.length)
  if (url.startsWith('/v/')) return '/audio-fix/' + url.slice('/v/'.length)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try { const u = new URL(url); const base = u.protocol + '//' + u.hostname + (u.port ? ':' + u.port : ''); const p = u.pathname + u.search; return '/audio-fix/' + enc(base) + p } catch {}
  }
  return null
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
  const [nativePlayerUrl, setNativePlayerUrl] = useState('')
  const [genericIntentUrl, setGenericIntentUrl] = useState('')

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
        if (!cancelled) { setUrl(ch.urls[0]); setFallbackUrls(ch.urls.slice(1)); setTitle(ch.name) }
      } else if (streamId) {
        const sid = parseInt(streamId)
        const { base_url, xtream_user, xtream_pass } = server
        if (type === 'movie') {
          const allUrls = reorderUrls(ext
            ? [vodUrlWithExt(base_url, xtream_user, xtream_pass, sid, ext), ...vodUrlTesters.map(fn => fn(base_url, xtream_user, xtream_pass, sid))]
            : vodUrlTesters.map(fn => fn(base_url, xtream_user, xtream_pass, sid)))
          let finalUrls = allUrls
          let nativeUrl = ''
          if (isMobile) {
            finalUrls = allUrls.map(u => toAudioFixUrl(u) || u)
            const mkvAt = allUrls.findIndex(u => u.startsWith('/dyn/') && (u.endsWith('.mkv') || u.endsWith('.mp4')))
            if (mkvAt >= 0) nativeUrl = allUrls[mkvAt]
          }
          if (!cancelled) { 
            setUrl(finalUrls[0]); setFallbackUrls(finalUrls.slice(1))
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
            if (isMobile) {
              const audioFixUrls = ordered.map(u => toAudioFixUrl(u) || u)
              const mkvAt = ordered.findIndex(u => u.startsWith('/dyn/') && (u.endsWith('.mkv') || u.endsWith('.mp4')))
              if (mkvAt >= 0) {
                const nativeUrl = ordered[mkvAt]
                const fullUrl = window.location.origin + nativeUrl
                const m3uFullUrl = window.location.origin + '/m3u/' + btoa(fullUrl).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
                setNativePlayerUrl(fullUrl)
                setGenericIntentUrl('intent://' + m3uFullUrl.replace(/^https?:\/\//, '') + '#Intent;action=android.intent.action.VIEW;type=application/x-mpegurl;scheme=https;end')
                setUrl(audioFixUrls[0]); setFallbackUrls(audioFixUrls.slice(1))
              } else {
                setUrl(audioFixUrls[0]); setFallbackUrls(audioFixUrls.slice(1))
              }
            } else {
              setUrl(ordered[0]); setFallbackUrls(ordered.slice(1))
            }
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

  const handleChannelChange = (newId: string, newUrl: string, newTitle: string) => {
    setUrl(newUrl); setTitle(newTitle); setLoading(false); setError(null)
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
      ) : isMobile && nativePlayerUrl && !rotationId ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm px-6">
            <p className="text-base text-white font-semibold mb-1">Film / Dizi</p>
            <p className="text-xs text-gray-500 mb-4">Ses codec uyumu için AAC'ye dönüştürülüyor. İlk açılışta 30-60sn sürebilir.</p>
            <button onClick={() => { setNativePlayerUrl(''); setUrl(fallbackUrls[0] || ''); setFallbackUrls(fallbackUrls.slice(1)) }}
              className="block w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0099ff] to-blue-600 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-[#0099ff]/20">
              İzle (AAC Ses)
            </button>
            <div className="h-px bg-white/5 my-4" />
            <button onClick={() => { window.location.href = genericIntentUrl }}
              className="block w-full py-3 rounded-xl bg-white/10 text-gray-300 text-sm hover:bg-white/20 transition-all mb-2">
              Player'da Aç (AC3)
            </button>
            <button onClick={() => { navigator.share({ url: nativePlayerUrl }).catch(() => window.location.href = nativePlayerUrl) }}
              className="w-full py-2.5 rounded-xl bg-white/5 text-gray-500 text-xs hover:text-white transition-all">
              Paylaşarak Aç
            </button>
          </div>
        </div>
      ) : url ? (
        <div className="flex-1 flex items-center justify-center bg-black">
          <div className="w-full max-w-full md:max-w-5xl">
            {rotationId ? (
              <LivePlayer channelId={rotationId} title={title} src={url} onEnded={() => navigate(-1)} onChannelChange={handleChannelChange} />
            ) : (
              <VideoPlayer key={url} src={url} fallbackSrcs={fallbackUrls} title={title} onEnded={() => navigate(-1)} />
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
