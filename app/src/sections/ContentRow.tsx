import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Poster from '@/components/Poster'

interface Item {
  id: number
  name: string
  stream_icon?: string
  stream_type?: string
  category_id?: string
  rating?: string
}

interface Props {
  title: string
  items: Item[]
  onItemClick?: (item: Item) => void
}

export default function ContentRow({ title, items }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(true)
  const navigate = useNavigate()

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = scrollRef.current.clientWidth * 0.75
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setShowLeft(scrollLeft > 10)
    setShowRight(scrollLeft + clientWidth < scrollWidth - 10)
  }

  if (items.length === 0) return null

  return (
    <section className="relative mb-6 md:mb-8 group">
      <h2 className="text-lg md:text-xl font-bold text-white mb-3 md:mb-4 px-4 md:px-8">{title}</h2>
      <div className="relative">
        {showLeft && (
          <button onClick={() => scroll('left')} className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-r from-[#0f172a]/90 to-transparent flex items-center justify-start pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}
        <div ref={scrollRef} onScroll={handleScroll} className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide px-4 md:px-8" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {items.map(item => (
            <button key={item.id} onClick={() => navigate(`/detail?id=${item.id}&type=${item.stream_type || 'live'}`)} className="flex-shrink-0 w-32 md:w-40 group/card">
              <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-2 relative">
                <Poster src={item.stream_icon} type={item.stream_type === 'live' ? 'channel' : 'movie'} className="group-hover/card:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/30 transition-colors flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-[#0099ff]/90 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all translate-y-2 group-hover/card:translate-y-0">
                    <span className="text-white text-lg ml-0.5">▶</span>
                  </div>
                </div>
                {item.rating && (
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-yellow-400 font-semibold">
                    {item.rating}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 truncate group-hover/card:text-white transition-colors text-left">{item.name}</p>
            </button>
          ))}
        </div>
        {showRight && (
          <button onClick={() => scroll('right')} className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-[#0f172a]/90 to-transparent flex items-center justify-end pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        )}
      </div>
    </section>
  )
}
