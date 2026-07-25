import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { liveUrl, seriesUrls, fetchVodInfo, fetchSeriesInfo, fetchLiveStreams, vodUrlTesters, vodUrlWithExt, proxyUrl } from '@/lib/supabase'
import { getChannelById } from '@/lib/rotation'
import VideoPlayer from '@/sections/VideoPlayer'
import LivePlayer from '@/sections/LivePlayer'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'

export default function Watch() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { server } = useAuth()
  const [url, setUrl] = useState('')
  const [fallbackUrls, setFallbackUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')

  const streamId = params.get('stream_id')
  const rotationId = params.get('rotation_id')
  const type = params.get('type') || 'live'
  const season = params.get('season') || '1'
  const episode = params.get('episode') || '1'
  const ext = params.get('ext') || ''
  const seriesId = params.get('series_id') || ''
  const debugRef = useRef<string[]>([])
  const [debugTxt, setDebugTxt] = useState('')

  // Capture console logs on mobile
  useEffect(() => {
    const isM = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    if (!isM) return
    const origLog = console.log; const origErr = console.error
    console.log = (...args) => { debugRef.current.push('[LOG] '+args.map(a=>typeof a==='object'?JSON.stringify(a):String(a)).join(' ')); origLog.apply(console,args) }
    console.error = (...args) => { debugRef.current.push('[ERR] '+args.map(a=>typeof a==='object'?JSON.stringify(a):String(a)).join(' ')); origErr.apply(console,args) }
    return () => { console.log = origLog; console.error = origErr }
  }, [])

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
          const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
          const allUrls = ext
            ? [vodUrlWithExt(base_url, xtream_user, xtream_pass, sid, ext), ...vodUrlTesters.map(fn => fn(base_url, xtream_user, xtream_pass, sid))]
            : vodUrlTesters.map(fn => fn(base_url, xtream_user, xtream_pass, sid))
          let finalUrls = allUrls
          let nativeUrl = ''
          if (isMobile) {
            const mkvAt = allUrls.findIndex(u => u.startsWith('/dyn/') && (u.endsWith('.mkv') || u.endsWith('.mp4')))
            if (mkvAt >= 0) { 
              nativeUrl = allUrls[mkvAt]
              finalUrls = ['/audio-fix/' + allUrls[mkvAt].slice('/dyn/'.length), ...allUrls] 
            }
          }
          if (!cancelled) { 
            if (isMobile && nativeUrl) {
              // Mobilde direkt native playera yönlendir
              setUrl(nativeUrl); setFallbackUrls([])
              setTimeout(() => { if (!cancelled) window.location.href = nativeUrl }, 1500)
            } else {
              setUrl(finalUrls[0]); setFallbackUrls(finalUrls.slice(1))
            }
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
          if (!cancelled) { setUrl(allUrls[0]); setFallbackUrls(allUrls.slice(1)) }
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
        {/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && (
          <button onClick={() => { const isM=!/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)?'no':'yes'; const info={ua:navigator.userAgent,type,streamId,rotationId,season,episode,ext,seriesId,url:url?.substring(0,200),fallbackUrls:fallbackUrls.map(u=>u?.substring(0,150)),loading,error,isMobile:isM,params:{stream_id:params.get('stream_id'),type:params.get('type'),ext:params.get('ext')}}; const full={...info,logs:debugRef.current.slice(-100)}; navigator.clipboard.writeText(JSON.stringify(full,null,2)).then(()=>setDebugTxt('Kopyalandi!')).catch(()=>setDebugTxt('Hata!')); setTimeout(()=>setDebugTxt(''),3000) }}
            className="w-8 h-8 rounded-full bg-yellow-500/80 flex items-center justify-center text-[10px] font-bold text-black pointer-events-auto">{debugTxt || 'D'}</button>
        )}
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
      ) : /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && url && !rotationId ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm px-6">
            <Loader2 className="w-10 h-10 text-[#0099ff] animate-spin mx-auto mb-4" />
            <p className="text-base text-white font-semibold mb-2">Mobil cihazınızda açılıyor...</p>
            <p className="text-xs text-gray-500">Telefonunuzun video player'ına yönlendiriliyorsunuz.</p>
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
