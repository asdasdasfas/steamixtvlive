import { useState, useRef, useCallback, useEffect } from 'react'
import { Loader2, Maximize2, Minimize2, ChevronDown } from 'lucide-react'

interface Game { name: string; slug: string; cat: string }

export default function GamesScreen() {
  const [games, setGames] = useState<Game[]>([])
  const [cats, setCats] = useState<string[]>([])
  const [gamesByCat, setGamesByCat] = useState<Record<string, Game[]>>({})
  const [playing, setPlaying] = useState<string | null>(null)
  const [gameLoaded, setGameLoaded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const playerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/game-list')
      .then(r => r.json())
      .then((data: Game[]) => {
        const c = [...new Set(data.map(g => g.cat))]
        const byCat = Object.fromEntries(c.map(cat => [cat, data.filter(g => g.cat === cat)]))
        setGames(data)
        setCats(c)
        setGamesByCat(byCat)
        setPlaying(data.find(g => g.slug === 'pk-subway-surfers')?.slug || data[0]?.slug || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const game = games.find(g => g.slug === playing)

  const toggleFullscreen = useCallback(async () => {
    if (!playerRef.current) return
    try {
      if (!document.fullscreenElement) {
        await playerRef.current.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch { }
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (menuOpen && searchRef.current) {
      searchRef.current.focus()
      setSearch('')
    }
  }, [menuOpen])

  const filtered = search.trim()
    ? games.filter(g => g.name.toLowerCase().includes(search.toLowerCase()))
    : []

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-black">
      <div ref={playerRef} className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2 px-3 py-2 bg-black/80 backdrop-blur-sm z-30 shrink-0 border-b border-white/5">
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen(p => !p)}
              className="flex items-center gap-1.5 bg-white/10 text-white text-xs rounded-lg px-2 py-1.5 border border-white/10 outline-none cursor-pointer max-w-[180px] sm:max-w-[250px]"
            >
              <span className="truncate flex-1">{game ? game.name : 'Oyun Seç'}</span>
              <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>
            {menuOpen && (
              <div className="absolute top-full left-0 mt-1 w-72 max-h-[60vh] flex flex-col bg-[#1a1a2e] border border-white/10 rounded-lg shadow-2xl z-50">
                <div className="p-2 border-b border-white/10">
                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Oyun ara..."
                    className="w-full bg-white/10 text-white text-xs rounded-md px-2.5 py-1.5 border border-white/10 outline-none placeholder-gray-500"
                  />
                </div>
                <div className="overflow-y-auto flex-1">
                  {loading ? (
                    <div className="px-3 py-4 text-center text-xs text-gray-400">Yükleniyor...</div>
                  ) : search.trim() ? (
                    filtered.length === 0 ? (
                      <div className="px-3 py-4 text-center text-xs text-gray-400">Oyun bulunamadı</div>
                    ) : filtered.map(g => (
                      <button
                        key={g.slug}
                        onClick={() => { setPlaying(g.slug); setGameLoaded(false); setMenuOpen(false) }}
                        className={`w-full text-left px-3 py-1.5 text-xs transition-colors border-b border-white/5 last:border-0 ${
                          playing === g.slug
                            ? 'bg-[#0099ff]/20 text-white font-semibold'
                            : 'text-gray-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >{g.name}</button>
                    ))
                  ) : cats.map(cat => (
                    <div key={cat}>
                      <div className="sticky top-0 bg-[#1a1a2e] px-3 py-1.5 text-[#0099ff] text-[10px] font-bold uppercase tracking-wider border-b border-white/5">{cat}</div>
                      {gamesByCat[cat].map(g => (
                        <button
                          key={g.slug}
                          onClick={() => { setPlaying(g.slug); setGameLoaded(false); setMenuOpen(false) }}
                          className={`w-full text-left px-3 py-1.5 text-xs transition-colors border-b border-white/5 last:border-0 ${
                            playing === g.slug
                              ? 'bg-[#0099ff]/20 text-white font-semibold'
                              : 'text-gray-300 hover:bg-white/5 hover:text-white'
                          }`}
                        >{g.name}</button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20 transition-colors shrink-0 ml-auto">
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="flex-1 relative min-h-0">
          {!gameLoaded && playing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20 bg-black">
              <Loader2 className="w-8 h-8 text-[#0099ff] animate-spin" />
              <span className="text-xs text-gray-400">Oyun yükleniyor...</span>
            </div>
          )}
          {playing ? (
            <iframe
              key={playing}
              src={`/tr/games/${playing}`}
              className={`w-full h-full ${gameLoaded ? '' : 'invisible'}`}
              allowFullScreen
              allow="autoplay; fullscreen; gamepad"
              style={{ border: 'none' }}
              onLoad={() => setGameLoaded(true)}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20 bg-black">
              <span className="text-xs text-gray-400">Oyun seç...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
