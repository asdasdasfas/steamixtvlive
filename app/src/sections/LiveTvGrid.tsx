import { useNavigate } from 'react-router-dom'
import { Play } from 'lucide-react'
import Poster from '@/components/Poster'

interface Channel {
  id: number
  name: string
  stream_icon?: string
  category_id?: string
}

interface Props {
  channels: Channel[]
  title?: string
}

export default function LiveTvGrid({ channels }: Props) {
  const navigate = useNavigate()

  if (channels.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500 text-sm">Kanal bulunamadı</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 px-4 md:px-8 pb-8">
      {channels.map(ch => (
        <button
          key={ch.id}
          onClick={() => navigate(`/watch?stream_id=${ch.id}&type=live`)}
          className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-800 transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_25px_rgba(0,153,255,0.25)] hover:ring-2 hover:ring-[#0099ff]/40"
        >
          <Poster src={ch.stream_icon} type="channel" className="group-hover:scale-110 transition-transform duration-300" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[#0099ff] flex items-center justify-center shadow-[0_0_15px_rgba(0,153,255,0.5)] opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
              <Play className="w-5 h-5 text-white ml-0.5 fill-white" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
            <p className="text-[11px] text-white font-medium truncate">{ch.name}</p>
          </div>
        </button>
      ))}
    </div>
  )
}

function Tv({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2" /><polyline points="16,21 12,17 8,21" /><line x1="12" y1="17" x2="12" y2="22" /></svg>
}
