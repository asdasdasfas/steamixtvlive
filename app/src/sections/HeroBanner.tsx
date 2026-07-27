import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Info } from 'lucide-react'
import Poster from '@/components/Poster'

interface BannerItem {
  id: number
  name: string
  stream_icon?: string
  stream_type?: string
  category_id?: string
}

interface Props {
  items: BannerItem[]
  autoPlay?: boolean
}

export default function HeroBanner({ items, autoPlay = true }: Props) {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!autoPlay || items.length === 0) return
    const interval = setInterval(() => setCurrent(prev => (prev + 1) % items.length), 8000)
    return () => clearInterval(interval)
  }, [items.length, autoPlay])

  if (items.length === 0) return null

  const item = items[current]

  return (
    <div className="relative h-[50vh] md:h-[65vh] min-h-[400px] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/80 via-transparent to-transparent z-10" />
      <Poster src={item.stream_icon} type={item.stream_type === 'live' ? 'channel' : 'movie'} className="w-full h-full object-cover" />
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 md:p-12 max-w-3xl">
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-3 drop-shadow-lg">{item.name}</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/watch?stream_id=${item.id}`)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0099ff] text-white font-semibold text-sm hover:bg-[#0088ee] transition-colors">
            <Play className="w-4 h-4 fill-white" />İzle
          </button>
          <button onClick={() => navigate(`/detail?id=${item.id}&type=${item.stream_type || 'live'}`)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-colors backdrop-blur-sm">
            <Info className="w-4 h-4" />Detay
          </button>
        </div>
      </div>
      <div className="absolute bottom-4 right-6 z-20 flex gap-2">
        {items.slice(0, 5).map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} className={`w-2 h-2 rounded-full transition-all ${i === current ? 'w-6 bg-[#0099ff]' : 'bg-white/30 hover:bg-white/50'}`} />
        ))}
      </div>
    </div>
  )
}
