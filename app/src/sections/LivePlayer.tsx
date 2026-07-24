import { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight, Tv, List, X } from 'lucide-react'
import { getChannelsByCategory, getChannelById } from '@/lib/rotation'
import VideoPlayer from '@/sections/VideoPlayer'

interface LivePlayerProps {
  channelId: string
  title: string
  src: string
  onEnded?: () => void
  onChannelChange: (newId: string, newUrl: string, newTitle: string) => void
}

export default function LivePlayer({ channelId, title, src, onEnded, onChannelChange }: LivePlayerProps) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const fullscreenRef = useRef<HTMLDivElement>(null)
  const ch = getChannelById(channelId)
  const categoryId = ch?.groupTitle?.toLowerCase().replace(/\s+/g, '-') || ''
  const siblings = getChannelsByCategory(categoryId)
  const currentIndex = siblings.findIndex(s => s.id === channelId)

  const prevCh = currentIndex > 0 ? siblings[currentIndex - 1] : null
  const nextCh = currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null

  const toggleFullscreen = async () => {
    if (!fullscreenRef.current) return
    if (!document.fullscreenElement) {
      await fullscreenRef.current.requestFullscreen()
      setFullscreen(true)
    } else {
      await document.exitFullscreen()
      setFullscreen(false)
    }
  }

  return (
    <div ref={fullscreenRef} className="relative bg-black">
      <VideoPlayer key={src} src={src} title={title} onEnded={onEnded} onToggleFullscreen={toggleFullscreen} />
      {fullscreen && (
        <>
          <button onClick={() => setPanelOpen(prev => !prev)}
            className="absolute top-4 left-4 z-40 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-[#0099ff] hover:shadow-[0_0_20px_rgba(0,153,255,0.5)] transition-all duration-300">
            {panelOpen ? <X className="w-5 h-5" /> : <List className="w-5 h-5" />}
          </button>
          {panelOpen && (
            <div className="fixed left-0 top-0 bottom-0 z-50 w-full sm:w-72 bg-black/95 backdrop-blur-md border-r border-white/10 flex flex-col">
              <div className="flex items-center justify-between p-4 sm:p-3 border-b border-white/10">
                <h3 className="text-sm font-semibold text-white">Kanallar ({siblings.length})</h3>
                <button onClick={() => setPanelOpen(false)} className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {siblings.map((s, i) => (
                  <button key={s.id} onClick={() => { onChannelChange(s.id, s.urls[0], s.name) }}
                    className={`w-full flex items-center gap-3 px-4 py-3 sm:py-2.5 transition-colors hover:bg-white/5 ${
                      s.id === channelId ? 'bg-[#0099ff]/10 border-l-2 border-[#0099ff]' : 'border-l-2 border-transparent'
                    }`}>
                    <div className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg overflow-hidden bg-gray-800 shrink-0 flex items-center justify-center">
                      {s.tvgLogo ? (
                        <img src={s.tvgLogo} alt="" className="w-full h-full object-contain p-1" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      ) : (
                        <Tv className="w-5 h-5 sm:w-4 sm:h-4 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className={`text-sm truncate ${s.id === channelId ? 'text-white font-medium' : 'text-gray-400'}`}>{s.name}</p>
                      <p className="text-[10px] text-gray-600">{i + 1}/{siblings.length}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Kanal Geçiş Çubuğu */}
      <div className="flex items-center justify-center gap-3 py-3 px-2 sm:px-4 bg-black/80">
        <button
          onClick={() => prevCh && onChannelChange(prevCh.id, prevCh.urls[0], prevCh.name)}
          disabled={!prevCh}
          className="flex items-center gap-1 px-2 sm:px-3 py-3 sm:py-2 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft className="w-5 h-5 sm:w-4 sm:h-4" />
          <div className="text-left hidden sm:block">
            <p className="text-[10px] text-gray-400">Önceki</p>
            <p className="text-xs truncate max-w-[80px]">{prevCh?.name || '—'}</p>
          </div>
        </button>

        <div className="flex items-center gap-2 px-3 py-2 sm:py-1.5 rounded-lg bg-[#0099ff]/20">
          <Tv className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-[#0099ff]" />
          <span className="text-xs text-white font-medium">{currentIndex + 1}/{siblings.length}</span>
        </div>

        <button
          onClick={() => nextCh && onChannelChange(nextCh.id, nextCh.urls[0], nextCh.name)}
          disabled={!nextCh}
          className="flex items-center gap-1 px-2 sm:px-3 py-3 sm:py-2 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-gray-400">Sonraki</p>
            <p className="text-xs truncate max-w-[80px]">{nextCh?.name || '—'}</p>
          </div>
          <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* Sol Kanal Paneli (outside fullscreen) */}
      {panelOpen && !fullscreen && (
        <div className="fixed left-0 top-0 bottom-0 z-50 w-full sm:w-72 bg-black/95 backdrop-blur-md border-r border-white/10 flex flex-col">
          <div className="flex items-center justify-between p-4 sm:p-3 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white">Kanallar ({siblings.length})</h3>
            <button onClick={() => setPanelOpen(false)} className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {siblings.map((s, i) => (
              <button key={s.id} onClick={() => { onChannelChange(s.id, s.urls[0], s.name) }}
                className={`w-full flex items-center gap-3 px-4 py-3 sm:py-2.5 transition-colors hover:bg-white/5 ${
                  s.id === channelId ? 'bg-[#0099ff]/10 border-l-2 border-[#0099ff]' : 'border-l-2 border-transparent'
                }`}>
                <div className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg overflow-hidden bg-gray-800 shrink-0 flex items-center justify-center">
                  {s.tvgLogo ? (
                    <img src={s.tvgLogo} alt="" className="w-full h-full object-contain p-1" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <Tv className="w-5 h-5 sm:w-4 sm:h-4 text-gray-500" />
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className={`text-sm truncate ${s.id === channelId ? 'text-white font-medium' : 'text-gray-400'}`}>{s.name}</p>
                  <p className="text-[10px] text-gray-600">{i + 1}/{siblings.length}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Overlay for closing panel */}
      {panelOpen && !fullscreen && <div className="fixed inset-0 z-40" onClick={() => setPanelOpen(false)} />}
    </div>
  )
}