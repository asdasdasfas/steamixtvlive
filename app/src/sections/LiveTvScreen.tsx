import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Tv } from 'lucide-react'
import type { RotationCategory, RotationChannel } from '@/lib/rotation'

interface Props {
  categories: RotationCategory[]
}

export default function LiveTvScreen({ categories }: Props) {
  const navigate = useNavigate()
  const [selectedCat, setSelectedCat] = useState<string>(categories[0]?.id || '')
  const [preview, setPreview] = useState<RotationChannel | null>(null)

  const currentCat = categories.find(c => c.id === selectedCat) || categories[0]
  const channels = currentCat?.channels || []

  const handleChannelClick = (ch: RotationChannel) => {
    setPreview(ch)
  }

  const handleWatch = (ch: RotationChannel) => {
    navigate(`/watch?rotation_id=${ch.id}`)
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-80px)]">
      {/* Category Sidebar */}
      <div className="flex md:flex-col overflow-x-auto md:overflow-y-hidden gap-1 p-2 md:p-3 bg-black/20 md:w-44 shrink-0 md:justify-center md:h-full">
        {categories.map(cat => (
          <button key={cat.id} onClick={() => { setSelectedCat(cat.id); setPreview(null) }}
            className={`flex-shrink-0 px-3 py-1.5 md:py-1.5 rounded-lg text-[10px] md:text-[10px] font-medium transition-colors text-left whitespace-nowrap md:whitespace-normal leading-tight ${
              selectedCat === cat.id
                ? 'bg-[#0099ff]/20 text-[#0099ff] border border-[#0099ff]/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}>
            {cat.name}
            <span className="block text-[8px] text-gray-600 mt-0.5">{cat.channels.length} kanal</span>
          </button>
        ))}
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">{currentCat?.name || 'Kanallar'}</h3>
          <span className="text-[10px] text-gray-500">{channels.length} kanal</span>
        </div>
        {channels.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-500 text-sm">Kanal bulunamadı</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {channels.map(ch => (
              <button key={ch.id} onClick={() => handleChannelClick(ch)}
                className={`group relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-800 transition-all duration-300 ${
                  preview?.id === ch.id ? 'ring-2 ring-[#0099ff] shadow-[0_0_20px_rgba(0,153,255,0.3)]' : 'hover:scale-[1.03] hover:shadow-[0_0_25px_rgba(0,153,255,0.25)] hover:ring-2 hover:ring-[#0099ff]/40'
                }`}>
                {ch.tvgLogo ? (
                  <img src={ch.tvgLogo} alt="" className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-300" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                    <Tv className="w-8 h-8 text-gray-500" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-[#0099ff] flex items-center justify-center shadow-[0_0_15px_rgba(0,153,255,0.5)] opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
                    <Play className="w-5 h-5 text-white ml-0.5 fill-white" onClick={e => { e.stopPropagation(); handleWatch(ch) }} />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                  <p className="text-[11px] text-white font-medium truncate">{ch.name}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Preview Panel */}
      {preview && (
        <div className="md:w-80 shrink-0 bg-black/40 border-l border-white/5 p-4 flex flex-col gap-3">
          <div className="aspect-[16/9] rounded-xl overflow-hidden bg-gray-800 relative">
            {preview.tvgLogo ? (
              <img src={preview.tvgLogo} alt="" className="w-full h-full object-contain p-4" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                <Tv className="w-12 h-12 text-gray-500" />
              </div>
            )}
            <button onClick={() => handleWatch(preview)}
              className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/20 transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#0099ff] flex items-center justify-center">
                <Play className="w-6 h-6 text-white ml-0.5" />
              </div>
            </button>
          </div>
          <h4 className="text-sm font-semibold text-white">{preview.name}</h4>
          <p className="text-xs text-gray-500">{preview.groupTitle || 'Kategori'}</p>
          {preview.tvgId && <p className="text-xs text-gray-600">{preview.tvgId}</p>}
          <button onClick={() => handleWatch(preview)}
            className="w-full py-2.5 rounded-xl bg-[#0099ff] text-white text-sm font-medium hover:bg-[#0099ff]/90 transition-colors">
            İzle
          </button>
        </div>
      )}
    </div>
  )
}
