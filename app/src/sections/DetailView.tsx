import { useState, useRef } from 'react'
import { Play, Star, Calendar, Clock, ArrowLeft, ChevronLeft, ChevronRight, Eye, Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Poster from '@/components/Poster'

interface DetailData {
  id: number; name: string; stream_icon?: string; stream_type?: string
  plot?: string; genre?: string; rating?: string; releasedate?: string; duration?: string
  backdrop_path?: string[]; category_id?: string; cast?: string; director?: string
  episodes?: Record<string, { id: string; episode_num: string; title: string; plot: string; stream_id: number; season: string; container_extension?: string }[]>
}

interface Props {
  data: DetailData
  onPlay?: () => void
  similarItems?: { id: number; name: string; stream_icon?: string; stream_type?: string }[]
  onSimilarClick?: (item: any) => void
  isFav?: boolean
  onToggleFav?: () => void
}

export default function DetailView({ data, onPlay, similarItems, onSimilarClick, isFav, onToggleFav }: Props) {
  const navigate = useNavigate()
  const [selectedSeason, setSelectedSeason] = useState('1')
  const similarRef = useRef<HTMLDivElement>(null)

  const isSeries = data.stream_type === 'series'
  const episodes = data.episodes?.[selectedSeason] || []
  const seasons = data.episodes ? Object.keys(data.episodes) : []

  const scrollSimilar = (dir: 'left' | 'right') => {
    if (similarRef.current) {
      similarRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' })
    }
  }

  const year = data.releasedate?.substring(0, 4) || ''
  const genres = (data.genre || '').split(',').map(g => g.trim()).filter(Boolean)

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Backdrop */}
      <div className="relative h-[45vh] md:h-[60vh] overflow-hidden">
        {data.backdrop_path?.[0] || data.stream_icon ? (
          <img src={data.backdrop_path?.[0] || data.stream_icon} alt=""
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/70 to-transparent" />
        <button onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors backdrop-blur-sm">
          <ArrowLeft className="w-5 h-5" />
        </button>
        {year && (
          <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-xs text-white/80">
            {year}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative -mt-40 md:-mt-48 z-10 px-4 md:px-8 max-w-5xl mx-auto pb-16">
        <div className="flex flex-col md:flex-row gap-6 md:gap-10">
          {/* Poster */}
          <div className="w-28 md:w-56 shrink-0 mx-auto md:mx-0 -mt-8 md:mt-0">
            <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-gray-800 shadow-2xl shadow-black/50 ring-1 ring-white/10 relative">
              <Poster src={data.stream_icon} type={isSeries ? 'series' : 'movie'} />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pt-2 md:pt-16 max-w-2xl">
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">{data.name}</h1>

            {/* Meta badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {data.rating && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-500/15 text-yellow-400 text-xs font-semibold">
                  <Star className="w-3.5 h-3.5 fill-yellow-400" />{data.rating}
                </span>
              )}
              {year && (
                <span className="px-2.5 py-1 rounded-lg bg-white/10 text-gray-300 text-xs">{year}</span>
              )}
              {data.duration && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 text-gray-300 text-xs">
                  <Clock className="w-3 h-3" />{data.duration}
                </span>
              )}
              {data.releasedate && !year && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 text-gray-300 text-xs">
                  <Calendar className="w-3 h-3" />{data.releasedate}
                </span>
              )}
            </div>

            {/* Genre tags */}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {genres.map(g => (
                  <span key={g} className="px-2.5 py-0.5 rounded-full bg-[#0099ff]/15 text-[#0099ff] text-[11px] font-medium">
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Play + Favori */}
            <div className="flex items-center gap-3 mb-6">
              <button onClick={onPlay}
                className="flex items-center gap-2.5 px-7 py-3 rounded-xl bg-[#0099ff] text-white font-semibold text-sm hover:bg-[#0088ee] transition-all shadow-lg shadow-[#0099ff]/20 hover:shadow-[#0099ff]/30">
                <Play className="w-4 h-4 fill-white" />{isSeries ? 'Bölümleri Göster' : 'İzle'}
              </button>
              <button onClick={onToggleFav}
                className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all">
                <Heart className={`w-5 h-5 transition-all ${isFav ? 'fill-red-500 text-red-500' : 'text-white'}`} />
              </button>
            </div>

            {/* Plot */}
            {data.plot && (
              <div className="mb-6">
                <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">{data.plot}</p>
              </div>
            )}

            {/* Cast & Director */}
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500 mb-6">
              {data.director && <span>Yönetmen: <span className="text-gray-300">{data.director}</span></span>}
              {data.cast && <span>Oyuncular: <span className="text-gray-300">{data.cast.substring(0, 120)}{data.cast.length > 120 ? '...' : ''}</span></span>}
            </div>

            {/* Series Seasons & Episodes */}
            {isSeries && seasons.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-200 mb-3">Sezonlar & Bölümler</h3>
                <div className="flex gap-2 overflow-x-auto mb-4 scrollbar-hide pb-1">
                  {seasons.map(s => (
                    <button key={s} onClick={() => setSelectedSeason(s)}
                      className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        selectedSeason === s ? 'bg-[#0099ff] text-white shadow-lg shadow-[#0099ff]/20' : 'bg-white/10 text-gray-400 hover:text-white hover:bg-white/15'
                      }`}>
                      Sezon {s}
                    </button>
                  ))}
                </div>
                <div className="space-y-2 pr-1">
                  {episodes.length === 0 ? (
                    <p className="text-xs text-gray-500">Bu sezonda bölüm bulunamadı</p>
                  ) : (
                    episodes.map((ep: any) => (
                      <button key={ep.id} onClick={() => {
                        const sp = new URLSearchParams({ stream_id: String(ep.stream_id || ep.id), type: 'series', season: selectedSeason, episode: ep.episode_num })
                        if (ep.container_extension) sp.set('ext', ep.container_extension)
                        if (data.stream_icon) sp.set('icon', data.stream_icon)
                        sp.set('series_id', String(data.id))
                        navigate(`/watch?${sp}`)
                      }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/10 transition-colors text-left border border-white/[0.03] hover:border-white/10">
                        <div className="w-9 h-9 rounded-lg bg-[#0099ff]/15 flex items-center justify-center shrink-0">
                          <Play className="w-4 h-4 text-[#0099ff] fill-[#0099ff]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{ep.episode_num}. {ep.title || 'Bölüm'}</p>
                          {ep.plot && <p className="text-xs text-gray-500 truncate mt-0.5">{ep.plot}</p>}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Similar Content */}
        {similarItems && similarItems.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#0099ff]" />Benzer İçerikler
              </h3>
              <div className="flex gap-1.5">
                <button onClick={() => scrollSimilar('left')} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => scrollSimilar('right')} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div ref={similarRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {similarItems.map(item => (
                <button key={item.id} onClick={() => {
                  const sp = new URLSearchParams({ id: String(item.id), type: item.stream_type || 'movie' })
                  if (item.stream_icon) sp.set('icon', item.stream_icon)
                  onSimilarClick ? onSimilarClick(item) : navigate(`/detail?${sp}`)
                }}
                  className="flex-shrink-0 w-28 md:w-36 group">
                  <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 mb-2 relative shadow-lg shadow-black/30 ring-1 ring-white/[0.03] group-hover:ring-[#0099ff]/30 transition-all">
                    <Poster src={item.stream_icon} type={item.stream_type === 'series' ? 'series' : 'movie'} />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 truncate group-hover:text-white transition-colors">{item.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}