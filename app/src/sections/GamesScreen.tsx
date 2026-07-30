import { useState, useRef, useCallback, useEffect } from 'react'
import { Loader2, Maximize2, Minimize2, ChevronDown } from 'lucide-react'

interface Game { name: string; slug: string; cat: string; url: string }

const PC_GAMES: Game[] = [
  { name: 'GTA: Vice City (Unofficial)', slug: 'vc-web-unofficial', cat: 'Macera', url: 'https://vcweb.studynotes.top' },
  { name: 'The Simpsons: Hit & Run', slug: 'simpsons-hit-run', cat: 'Macera', url: 'https://shar-wasm.cjoseph.workers.dev/?skipmovie' },
  { name: 'Web Dashers (Geometry Dash)', slug: 'web-dashers', cat: 'Spor', url: 'https://web-dashers.github.io/' },
]

const PC_CATS = [...new Set(PC_GAMES.map(g => g.cat))]
const PC_BY_CAT = Object.fromEntries(PC_CATS.map(c => [c, PC_GAMES.filter(g => g.cat === c)]))
const SOURCE_BTN = 'px-2 py-1 text-[10px] rounded-md transition-colors whitespace-nowrap'

export default function GamesScreen() {
  const [source, setSource] = useState<'easyhub' | 'pc'>('easyhub')
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
  const ATARI_URL = 'https://gam.onl/'
  const openAtari = () => window.open(ATARI_URL, '_blank', 'noopener,noreferrer')

  useEffect(() => {
    if (source === 'pc') {
      setGames(PC_GAMES)
      setCats(PC_CATS)
      setGamesByCat(PC_BY_CAT)
      const def = PC_GAMES[0]
      setPlaying(def.slug)
      setLoading(false)
      return
    }
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
  }, [source])

  const game = games.find(g => g.slug === playing)

  const toggleFullscreen = useCallback(async () => {
    if (!playerRef.current) return
    try {
      if (!document.fullscreenElement) {
        await playerRef.current.requestFullscreen()
        if (source === 'pc') {
          try { await (screen.orientation as any).lock('landscape') } catch {}
        }
      } else {
        if ((screen.orientation as any)?.unlock) (screen.orientation as any).unlock()
        await document.exitFullscreen()
      }
    } catch { }
  }, [source])

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

  const switchSource = (s: 'easyhub' | 'pc') => {
    setSource(s)
    setGameLoaded(false)
    setPlaying(null)
    setLoading(true)
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-black">
      <div ref={playerRef} className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-1 px-2 py-1 bg-black/80 backdrop-blur-sm z-30 shrink-0 border-b border-white/5">
          <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 shrink-0">
            <button onClick={() => switchSource('easyhub')}
              className={`${SOURCE_BTN} ${source === 'easyhub' ? 'bg-[#0099ff] text-white' : 'text-gray-400 hover:text-white'}`}
            >Android</button>
            <button onClick={() => switchSource('pc')}
              className={`${SOURCE_BTN} ${source === 'pc' ? 'bg-[#0099ff] text-white' : 'text-gray-400 hover:text-white'}`}
            >PC</button>
            <button onClick={openAtari}
              className={`${SOURCE_BTN} text-gray-400 hover:text-white`}
            >Atari</button>
          </div>
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen(p => !p)}
              className="flex items-center gap-1 bg-white/10 text-white text-[11px] rounded-lg px-2 py-1 border border-white/10 outline-none cursor-pointer max-w-[110px] sm:max-w-[150px]"
            >
              <span className="truncate flex-1">{game ? game.name : 'Seç'}</span>
              <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>
            {menuOpen && (
              <div className="fixed top-auto left-2 right-2 sm:absolute sm:top-full sm:left-0 sm:right-auto mt-1 sm:w-64 max-h-[55vh] flex flex-col bg-[#1a1a2e] border border-white/10 rounded-lg shadow-2xl z-50">
                <div className="p-2 border-b border-white/10 shrink-0">
                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Ara..."
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
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 text-white text-[11px] hover:bg-white/20 transition-colors shrink-0 ml-auto">
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="flex-1 relative min-h-0" style={{ overflow: 'hidden' }}>
          {!gameLoaded && playing && (
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-black">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 text-[#0099ff] animate-spin" />
                <span className="text-xs text-gray-400">Yükleniyor...</span>
              </div>
            </div>
          )}
          {playing ? (
            <iframe
              key={source + (playing || '')}
              src={source === 'easyhub' ? `/tr/games/${playing}` : (game?.url || '')}
              className={`w-full h-full ${gameLoaded ? '' : 'invisible'}`}
              allowFullScreen
              allow="autoplay; fullscreen; gamepad"
              style={{ border: 'none', touchAction: 'manipulation' }}
              onLoad={() => setGameLoaded(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-black">
              <span className="text-xs text-gray-400">Oyun seç...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
