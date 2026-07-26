import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { fetchVodInfo, fetchSeriesInfo, fetchVods, fetchSeries } from '@/lib/supabase'
import DetailView from '@/sections/DetailView'
import { Loader2, Download } from 'lucide-react'
import { isFavorite, toggleFavorite } from '@/lib/favorites'
import { buildSteamixIntentUrl, APK_DOWNLOAD_URL, INSTALL_FLAG_KEY } from '@/lib/player-intents'

export default function Detail() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { server } = useAuth()
  const id = params.get('id')
  const type = params.get('type') || 'live'
  const urlIcon = params.get('icon') || ''
  const ext = params.get('ext') || ''
  const catId = params.get('cat') || ''
  const [data, setData] = useState<any>(null)
  const [similar, setSimilar] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isFav, setIsFav] = useState(isFavorite(parseInt(id || '0'), type as 'movie' | 'series'))
  const [showApkPrompt, setShowApkPrompt] = useState(false)

  useEffect(() => {
    if (!id || !server) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const { base_url, xtream_user, xtream_pass } = server

        if (type === 'movie') {
          const info: any = await fetchVodInfo(base_url, xtream_user, xtream_pass, parseInt(id))
          if (!cancelled && info) {
            const movieData = info?.info?.movie_data?.info
            setData({
              id: parseInt(id), name: info?.info?.name || 'İsimsiz',
              stream_icon: urlIcon || movieData?.movie_image || info?.info?.cover || '',
              stream_type: 'movie', plot: movieData?.plot || info?.info?.plot || '',
              genre: movieData?.genre || info?.info?.genre || '',
              rating: movieData?.rating || info?.info?.rating || '',
              releasedate: movieData?.releasedate || (info?.info?.releaseDate || ''),
              duration: movieData?.duration || info?.info?.duration || '',
              backdrop_path: [urlIcon || movieData?.movie_image || info?.info?.cover || ''],
              category_id: catId || info?.info?.category_id || '',
              cast: movieData?.cast || info?.info?.cast || '',
              director: movieData?.director || info?.info?.director || '',
            })
            // Load similar from same category (silent, parallel)
            if (catId || info?.info?.category_id) {
              const cid = catId || info?.info?.category_id
              fetchVods(base_url, xtream_user, xtream_pass, cid).then(allVods => {
                if (!cancelled && allVods) {
                  const sim = allVods.filter((m: any) => String(m.stream_id) !== id).slice(0, 10)
                  setSimilar(sim.map((s: any) => ({ id: s.stream_id, name: s.name, stream_icon: s.stream_icon, stream_type: 'movie' })))
                }
              }).catch(() => {})
            }
          }
        } else if (type === 'series') {
          const info: any = await fetchSeriesInfo(base_url, xtream_user, xtream_pass, parseInt(id))
          if (!cancelled && info) {
            const si = info?.info
            const episodes: Record<string, any[]> = {}
            if (info?.episodes) {
              for (const [season, eps] of Object.entries(info.episodes)) {
                episodes[season] = (eps as any[]).map((e: any) => ({
                  id: e.id, episode_num: e.episode_num, title: e.title, plot: e.plot, stream_id: e.stream_id, season: e.season, container_extension: e.container_extension || '',
                }))
              }
            }
            setData({
              id: parseInt(id), name: si?.name || 'İsimsiz',
              stream_icon: urlIcon || si?.cover || si?.thumbnail || '',
              stream_type: 'series', plot: si?.plot || '',
              genre: si?.genre || '', rating: si?.rating || '',
              releasedate: si?.releaseDate || '',
              backdrop_path: [urlIcon || si?.cover || ''],
              category_id: catId || si?.category_id || '',
              cast: si?.cast || '', director: si?.director || '',
              episodes,
            })
            // Load similar from same category (silent, parallel)
            if (catId || si?.category_id) {
              const cid = catId || si?.category_id
              fetchSeries(base_url, xtream_user, xtream_pass, cid).then(allSeries => {
                if (!cancelled && allSeries) {
                  const sim = allSeries.filter((s: any) => String(s.series_id) !== id).slice(0, 10)
                  setSimilar(sim.map((s: any) => ({ id: s.series_id, name: s.name, stream_icon: s.cover || s.thumbnail, stream_type: 'series' })))
                }
              }).catch(() => {})
            }
          }
        }
      } catch { setData(null) }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [id, type, ext, urlIcon, catId, server])

  const handleSimilarClick = (item: any) => {
    const sp = new URLSearchParams({ id: String(item.id), type: item.stream_type })
    if (item.stream_icon) sp.set('icon', item.stream_icon)
    navigate(`/detail?${sp}`)
  }

  const handleToggleFav = () => {
    const nowFav = toggleFavorite({
      id: data?.id || parseInt(id || '0'),
      type: type as 'movie' | 'series',
      name: data?.name || '',
      image: data?.stream_icon || urlIcon,
      addedAt: Date.now(),
    })
    setIsFav(nowFav)
  }

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  const handlePlay = () => {
    if (isMobile && (type === 'movie' || type === 'series') && server) {
      const { base_url, xtream_user, xtream_pass } = server
      const sid = parseInt(id || '0')
      const url = buildSteamixIntentUrl(base_url, xtream_user, xtream_pass, sid, ext)
      if (localStorage.getItem(INSTALL_FLAG_KEY)) {
        window.location.href = url
        return
      }
      // First time: try intent, show modal on failure
      setShowApkPrompt(false)
      window.location.href = url
      let fallback = setTimeout(() => setShowApkPrompt(true), 1500)
      const onVis = () => {
        if (document.hidden) clearTimeout(fallback)
      }
      document.addEventListener('visibilitychange', onVis, { once: true })
      localStorage.setItem(INSTALL_FLAG_KEY, '1')
      return
    }
    if (type === 'series') {
      const firstSeason = Object.keys(data.episodes || {})[0] || '1'
      const firstEp = data.episodes?.[firstSeason]?.[0]
      if (firstEp) {
        const sp = new URLSearchParams({ stream_id: String(firstEp.id || firstEp.stream_id), type: 'series', season: firstSeason, episode: firstEp.episode_num })
        if (firstEp.container_extension) sp.set('ext', firstEp.container_extension)
        if (data.stream_icon) sp.set('icon', data.stream_icon)
        sp.set('series_id', String(data.id))
        navigate(`/watch?${sp}`)
      } else {
        const sp = new URLSearchParams({ stream_id: id!, type: 'series', season: '1', episode: '1' })
        if (ext) sp.set('ext', ext)
        if (data.stream_icon) sp.set('icon', data.stream_icon)
        sp.set('series_id', String(data.id))
        navigate(`/watch?${sp}`)
      }
    } else {
      const sp = new URLSearchParams({ stream_id: id!, type })
      if (ext) sp.set('ext', ext)
      if (data.stream_icon) sp.set('icon', data.stream_icon)
      navigate(`/watch?${sp}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0099ff] animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <p className="text-gray-500">İçerik bulunamadı</p>
      </div>
    )
  }

  return (
    <>
      <DetailView
        data={data}
        similarItems={similar}
        onSimilarClick={handleSimilarClick}
        isFav={isFav}
        onToggleFav={handleToggleFav}
        onPlay={handlePlay}
      />
      {showApkPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#1e293b] rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-white font-semibold text-lg mb-2">Steamix Player Gerekli</h3>
            <p className="text-gray-400 text-sm mb-5">Bu içeriği izlemek için Steamix Player uygulamasını yüklemeniz gerekiyor.</p>
            <a href={APK_DOWNLOAD_URL}
              onClick={() => localStorage.setItem(INSTALL_FLAG_KEY, '1')}
              className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-[#0099ff] text-white font-semibold text-sm hover:bg-[#0088ee] transition-all mb-3">
              <Download className="w-4 h-4" />APK'yı İndir (2.8 MB)
            </a>
            <p className="text-xs text-gray-500 text-center">Kurulumdan sonra geri gelip tekrar <span className="text-[#0099ff]">İzle</span>'ye tıklayın.</p>
            <button onClick={() => setShowApkPrompt(false)}
              className="w-full mt-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Kapat</button>
          </div>
        </div>
      )}
    </>
  )
}