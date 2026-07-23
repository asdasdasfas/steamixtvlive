import { useRef } from 'react'

interface Category {
  category_id: string
  category_name: string
  parent_id?: string
}

interface Props {
  categories: Category[]
  selected: string
  onSelect: (id: string) => void
  type?: 'live' | 'movie' | 'series'
}

export default function CategoryBar({ categories, selected, onSelect }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const all = { category_id: '', category_name: 'Tümü' }

  return (
    <div className="relative mb-4 md:mb-6">
      <div ref={scrollRef} className="flex gap-2 overflow-x-auto scrollbar-hide px-4 md:px-8 py-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {[all, ...categories].map(cat => (
          <button
            key={cat.category_id || 'all'}
            onClick={() => onSelect(cat.category_id)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              selected === cat.category_id ? 'bg-[#0099ff] text-white shadow-lg shadow-[#0099ff]/25' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {cat.category_name}
          </button>
        ))}
      </div>
    </div>
  )
}
