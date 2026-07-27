import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { fetchVodInfo, fetchSeriesInfo, fetchVods, fetchSeries, proxyUrl } from '@/lib/supabase'
import DetailView from '@/sections/DetailView'
import { Loader2 } from 'lucide-react'
import { isFavorite, toggleFavorite } from '@/lib/favorites'
import { buildSteamixIntentUrl } from '@/lib/player-intents'
import { searchTrailer } from '@/lib/youtube'

function decodeField(v: string): string {
  if (!v) return ''
  const t = v.trim()
  if (t.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(t)) return v
  try {
    const d = atob(t)
    if (d.length > 0 && /^[\x20-\x7EğüşıöçĞÜŞİÖÇ\s\.,!?;:'"()-]+$/.test(d)) return d
  } catch {}
  return v
}

function proxyImg(base: string | undefined, url: string): string {
  if (!url) return ''
  if (url.startsWith('http://') && base) return proxyUrl(base, url.replace(/^https?:\/\/[^\/]+/, ''))
  if (url.startsWith('http://')) return url.replace('http://', 'https://')
  return url
}

export default function Detail() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { server } = useAuth()
  const id = params.get('id')
  const type = params.get('type') || 'live'
  const urlIcon = params.get('icon') || ''
  const urlName = params.get('name') || ''
  const ext = params.get('ext') || ''
  const catId = params.get('cat') || ''
  const [data, setData] = useState<any>(null)
  const [similar, setSimilar] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isFav, setIsFav] = useState(isFavorite(parseInt(id || '0'), type as 'movie' | 'series'))

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
            const iv = info?.info
            const md2 = iv?.movie_data?.info || info?.movie_data?.info
            const mapi = info?.movie_data
            setData({
              id: parseInt(id), name: urlName || iv?.name || mapi?.name || 'İsimsiz',
              stream_icon: proxyImg(base_url, urlIcon || iv?.movie_image || iv?.cover_big || md2?.cover_big || iv?.cover || iv?.stream_icon || mapi?.stream_icon || ''),
              stream_type: 'movie',
              plot: decodeField(md2?.plot || iv?.plot || ''),
              genre: decodeField(md2?.genre || iv?.genre || ''),
              rating: iv?.rating || md2?.rating || '',
              releasedate: iv?.releaseDate || iv?.releasedate || md2?.releasedate || '',
              duration: iv?.duration || md2?.duration || '',
              backdrop_path: [proxyImg(base_url, urlIcon || iv?.movie_image || iv?.cover_big || md2?.cover_big || iv?.cover || '')],
              category_id: catId || iv?.category_id || mapi?.category_id || '',
              cast: decodeField(md2?.cast || iv?.cast || ''),
              director: decodeField(md2?.director || iv?.director || ''),
              youtube_trailer: '',
            })
            const movieName = urlName || iv?.name || mapi?.name || ''
            searchTrailer(movieName).then(vid => {
              if (!cancelled && vid) setData(prev => prev ? { ...prev, youtube_trailer: vid } : prev)
            })
            // Load similar from same category (silent, parallel)
            if (catId || info?.info?.category_id) {
              const cid = catId || info?.info?.category_id
              fetchVods(base_url, xtream_user, xtream_pass, cid).then(allVods => {
                if (!cancelled && allVods) {
                  const sim = allVods.filter((m: any) => String(m.stream_id) !== id).slice(0, 10)
                  setSimilar(sim.map((s: any) => ({ id: s.stream_id, name: s.name, stream_icon: s.cover_big || s.stream_icon, cover_big: s.cover_big, stream_type: 'movie' })))
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
                  id: e.id, episode_num: e.episode_num, title: e.title, plot: decodeField(e.plot || e.info?.plot || ''), stream_id: e.stream_id, season: e.season, container_extension: e.container_extension || '',
                }))
              }
            }
            setData({
              id: parseInt(id), name: urlName || si?.name || 'İsimsiz',
              stream_icon: proxyImg(base_url, urlIcon || si?.cover_big || si?.movie_image || si?.cover || si?.thumbnail || ''),
              stream_type: 'series',
              plot: decodeField(si?.plot || si?.description || ''),
              genre: decodeField(si?.genre || ''),
              rating: si?.rating || '',
              releasedate: si?.releaseDate || si?.releasedate || '',
              backdrop_path: [proxyImg(base_url, urlIcon || si?.cover_big || si?.movie_image || si?.cover || '')],
              category_id: catId || si?.category_id || '',
              cast: decodeField(si?.cast || ''),
              director: decodeField(si?.director || ''),
              episodes,
              youtube_trailer: '',
            })
            const seriesName = urlName || si?.name || ''
            searchTrailer(seriesName).then(vid => {
              if (!cancelled && vid) setData(prev => prev ? { ...prev, youtube_trailer: vid } : prev)
            })
            // Load similar from same category (silent, parallel)
            if (catId || si?.category_id) {
              const cid = catId || si?.category_id
              fetchSeries(base_url, xtream_user, xtream_pass, cid).then(allSeries => {
                if (!cancelled && allSeries) {
                  const sim = allSeries.filter((s: any) => String(s.series_id) !== id).slice(0, 10)
                  setSimilar(sim.map((s: any) => ({ id: s.series_id, name: s.name, stream_icon: s.cover_big || s.movie_image || s.cover || s.thumbnail, cover_big: s.cover_big, stream_type: 'series' })))
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
    if (item.stream_icon || item.cover_big) sp.set('icon', item.stream_icon || item.cover_big)
    if (item.name) sp.set('name', item.name)
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
    <DetailView
      data={data}
      similarItems={similar}
      onSimilarClick={handleSimilarClick}
      isFav={isFav}
      onToggleFav={handleToggleFav}
      server={server}
      ext={ext}
      onPlay={() => {
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
        if (isMobile && (type === 'movie' || type === 'series') && server) {
          const { base_url, xtream_user, xtream_pass } = server
          window.location.href = buildSteamixIntentUrl(base_url, xtream_user, xtream_pass, parseInt(id || '0'), ext)
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
      }}
    />
  )
}