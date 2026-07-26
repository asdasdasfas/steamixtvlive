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
    const score = (u: string) => {
      if (u.endsWith('.mp4')) return 0   // MP4 en önce (AAC ses garantili)
      if (u.endsWith('.m3u8')) return 1  // HLS ikinci (genelde AAC)
      if (u.endsWith('.mkv')) return 3   // MKV en son (AC3 sessiz olabilir)
      return 2
    }
    return score(a) - score(b)
  })
}

// Decode proxy URL to direct provider URL (for external player)
function decodeProxyDirect(proxyPath: string): string | null {
  if (!proxyPath) return null
  if (proxyPath.startsWith('http://') || proxyPath.startsWith('https://')) return proxyPath
  const b64decode = (s: string) => { try { return atob(s.replace(/-/g,'+').replace(/_/g,'/')) } catch { return null } }
  const KNOWN = {
    '/dyn/': null,   // dynamic base64
    '/p2095/': 'http://dzcvip1.xyz:2095',
    '/p8080/': 'http://dzcvip1.xyz:8080',
    '/xtream-api/': 'http://ctn34.xyz:8080',
    '/xtream/': 'http://dzcvip1.xyz:2095',
  }
  for (const [prefix, base] of Object.entries(KNOWN)) {
    if (!proxyPath.startsWith(prefix)) continue
    const rest = proxyPath.slice(prefix.length)
    if (base) return base + rest
    // dynamic: /dyn/{b64(base_url)}/{path}
    const si = rest.indexOf('/')
    if (si <= 0) continue
    const decoded = b64decode(rest.slice(0, si))
    if (decoded) return decoded.replace(/\/+$/,'') + rest.slice(si)
  }
  // /p/{b64(base_url)}/{path}
  const pm = proxyPath.match(/^\/p\/([A-Za-z0-9\-_]+)(\/.*)$/)
  if (pm) { const d = b64decode(pm[1]); if (d) return d.replace(/\/+$/,'') + pm[2] }
  // /v/{b64}/{path}
  const vm = proxyPath.match(/^\/v\/([A-Za-z0-9\-_]+)(\/.*)$/)
  if (vm) { const d = b64decode(vm[1]); if (d) return d.replace(/\/+$/,'') + vm[2] }
  // /audio-fix/{b64(base_url)}/{path}
  const af = proxyPath.match(/^\/audio-fix\/([A-Za-z0-9\-_]+)(\/.*)$/)
  if (af) { const d = b64decode(af[1]); if (d) return d.replace(/\/+$/,'') + af[2] }
  // /audio-fix/s/{b64(absolute_url)}
  const afs = proxyPath.match(/^\/audio-fix\/s\/([A-Za-z0-9\-_]+)$/)
  if (afs) { const d = b64decode(afs[1]); if (d) return d }
  return null
}

// Build MX Player / VLC Android Intent URL from a proxy path
function buildPlayerIntents(proxyPath: string): { mx: string; vlc: string; raw: string } | null {
  if (!proxyPath) return null
  const directUrl = decodeProxyDirect(proxyPath) || proxyPath
  const absUrl = directUrl.startsWith('http') ? directUrl : window.location.origin + directUrl
  const scheme = absUrl.startsWith('https') ? 'https' : 'http'
  const hostPath = absUrl.replace(/^https?:\/\//, '')
  const encUrl = encodeURIComponent(absUrl)
  return {
    mx: `intent://${hostPath}#Intent;package=com.mxtech.videoplayer.ad;action=android.intent.action.VIEW;type=video/*;scheme=${scheme};S.browser_fallback_url=${encUrl};end`,
    vlc: `intent://${hostPath}#Intent;package=org.videolan.vlc;action=android.intent.action.VIEW;type=video/*;scheme=${scheme};S.browser_fallback_url=${encUrl};end`,
    raw: absUrl,
  }
}

// Convert proxy URLs for server-side AC3→AAC transcoding (fallback)
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
  const [mxIntentUrl, setMxIntentUrl] = useState('')
  const [vlcIntentUrl, setVlcIntentUrl] = useState('')
  const [steamixIntentUrl, setSteamixIntentUrl] = useState('')
  const [apkDownloadUrl] = useState('https://www.dropbox.com/s/xxxxx/SteamixPlayer-v1.0.apk?dl=1') // KULLANICI DOLDURACAK

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
          let directUrl = ''
          if (isMobile) {
            const mkvAt = allUrls.findIndex(u => u.startsWith('/dyn/') && u.endsWith('.mkv'))
            const mp4At = mkvAt < 0 ? allUrls.findIndex(u => u.startsWith('/dyn/') && u.endsWith('.mp4')) : -1
            const found = mkvAt >= 0 ? mkvAt : mp4At
            if (found >= 0) {
              nativeUrl = window.location.origin + allUrls[found]
              const decoded = decodeProxyDirect(allUrls[found])
              if (decoded) directUrl = decoded.startsWith('http') ? decoded : window.location.origin + decoded
            }
          }
          if (nativeUrl) {
            const intents = buildPlayerIntents(nativeUrl)
            if (intents) { setNativePlayerUrl(intents.raw); setMxIntentUrl(intents.mx); setVlcIntentUrl(intents.vlc) }
            if (directUrl) setSteamixIntentUrl(`steamixtv://play?url=${encodeURIComponent(directUrl)}`)
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
              const mkvAt = ordered.findIndex(u => u.startsWith('/dyn/') && u.endsWith('.mkv'))
              const mp4At = mkvAt < 0 ? ordered.findIndex(u => u.startsWith('/dyn/') && u.endsWith('.mp4')) : -1
              const found = mkvAt >= 0 ? mkvAt : mp4At
              if (found >= 0) {
                const nativeUrl = window.location.origin + ordered[found]
                const intents = buildPlayerIntents(nativeUrl)
                setNativePlayerUrl(intents?.raw || '')
                if (intents) { setMxIntentUrl(intents.mx); setVlcIntentUrl(intents.vlc) }
                const decoded = decodeProxyDirect(ordered[found])
                if (decoded) { const absUrl = decoded.startsWith('http') ? decoded : window.location.origin + decoded; setSteamixIntentUrl(`steamixtv://play?url=${encodeURIComponent(absUrl)}`) }
                setUrl(ordered[0]); setFallbackUrls(ordered.slice(1))
              } else {
                setUrl(ordered[0]); setFallbackUrls(ordered.slice(1))
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
      ) : url ? (
        <div className="flex-1 flex items-center justify-center bg-black">
          <div className="w-full max-w-full md:max-w-5xl">
            {rotationId ? (
              <LivePlayer channelId={rotationId} title={title} src={url} onEnded={() => navigate(-1)} onChannelChange={handleChannelChange} />
            ) : (
              <>
                <VideoPlayer key={url} src={url} fallbackSrcs={fallbackUrls} title={title} onEnded={() => navigate(-1)} />
                {isMobile && (steamixIntentUrl || mxIntentUrl || vlcIntentUrl) && (
                  <div className="flex flex-col items-center gap-2 px-4 py-3 bg-black/60">
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      {steamixIntentUrl && (
                        <a href={steamixIntentUrl} className="px-5 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold transition shadow-lg shadow-orange-600/30">
                          Steamix Player'da İzle
                        </a>
                      )}
                      <a href={apkDownloadUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-500 hover:text-gray-300 underline">
                        APK yüklü değil mi? İndir
                      </a>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider">Alternatif:</span>
                      {mxIntentUrl && (
                        <a href={mxIntentUrl} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition">
                          MX Player
                        </a>
                      )}
                      {vlcIntentUrl && (
                        <a href={vlcIntentUrl} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition">
                          VLC
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
