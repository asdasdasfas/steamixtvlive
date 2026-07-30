import { useState, useRef, useCallback, useEffect } from 'react'
import { Loader2, Maximize2, Minimize2, ChevronDown } from 'lucide-react'

interface Game { name: string; slug: string; cat: string }

const GAMES: Game[] = [
  { name: 'Subway Surfers', slug: 'pk-subway-surfers', cat: 'Koşu' },
  { name: 'Tunnel Rush', slug: 'pk-tunnel-rush', cat: 'Koşu' },
  { name: 'Drive Mad', slug: 'pk-drive-mad', cat: 'Koşu' },
  { name: 'Murder', slug: 'pk-murder', cat: 'Macera' },
  { name: 'Kötü Büyükanneden Kaçış', slug: 'escape-evil-granny-viz', cat: 'Macera' },
  { name: 'Kapılar Kalesi', slug: 'doors-castle', cat: 'Macera' },
  { name: 'Iron Snout', slug: 'pk-iron-snout', cat: 'Macera' },
  { name: 'Kaçış Odası: Garip Vaka 2', slug: 'escape-room-strange-case-2', cat: 'Macera' },
  { name: 'Moskova Metro Sürücüsü 3D', slug: 'moscow-metro-driver-3d', cat: 'Araba' },
  { name: 'Araba Yarışı 3D', slug: 'araba-yarisi-3d', cat: 'Araba' },
  { name: 'Pure Farm: Taze Gıda', slug: 'pure-farm-fresh-food', cat: 'Çiftçilik' },
  { name: 'Zombi Dünyasından Kaçış', slug: 'zombi-dunyasindan-kacis', cat: 'Korku' },
  { name: 'Parkur Ustası', slug: 'parkour-master', cat: 'Parkur' },
  { name: 'Dinosaur Game', slug: 'pk-dinosaur-game', cat: 'Koşu' },
  { name: 'Ninja Kaçışı', slug: 'ninja-escape', cat: 'Koşu' },
  { name: 'Stickman Hook', slug: 'pk-stickman-hook', cat: 'Macera' },
  { name: 'Moto X3M', slug: 'moto-x3m', cat: 'Macera' },
  { name: 'Profesyonel İnşaat 3D', slug: 'pro-construction-simulator-3d-swm', cat: 'Simülasyon' },
  { name: 'Usta Vuruş: Patron Avcısı', slug: 'master-hit-boss-hunter-btt', cat: 'Nişancı' },
  { name: 'Spor Kulübü 3D', slug: 'spor-kulubu-3d', cat: 'İşletme' },
  { name: 'Taverna Simülatörü', slug: 'taverna-simulatoru', cat: 'İşletme' },
  { name: 'Atari İmparatorluğu', slug: 'atari-imparatorlugu', cat: 'İşletme' },
  { name: 'Boşta Restoran Kralı', slug: 'bosta-restoran-krali', cat: 'İşletme' },
]

const uniqueGames = GAMES.filter((g, i, a) => a.findIndex(x => x.slug === g.slug) === i)

export default function GamesScreen() {
  const [playing, setPlaying] = useState<string>('pk-subway-surfers')
  const [gameLoaded, setGameLoaded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const playerRef = useRef<HTMLDivElement>(null)

  const game = uniqueGames.find(g => g.slug === playing)

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

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-black">
      <div ref={playerRef} className="flex-1 flex flex-col relative">
        {/* Oyun değiştirme çubuğu */}
        <div className="flex items-center gap-2 px-3 py-2 bg-black/80 backdrop-blur-sm z-30 shrink-0">
          <select
            value={playing}
            onChange={e => { setPlaying(e.target.value); setGameLoaded(false) }}
            className="bg-white/10 text-white text-xs rounded-lg px-3 py-1.5 border border-white/10 outline-none appearance-none cursor-pointer max-w-[200px]"
          >
            {uniqueGames.map(g => (
              <option key={g.slug} value={g.slug} className="bg-gray-900">{g.name} - {g.cat}</option>
            ))}
          </select>
          <span className="text-sm font-semibold text-white flex-1 truncate">{game?.name}</span>
          <button onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20 transition-colors">
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
        {/* Oyun iframe */}
        <div className="flex-1 relative">
          {!gameLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20">
              <Loader2 className="w-8 h-8 text-[#0099ff] animate-spin" />
              <span className="text-xs text-gray-400">Oyun yükleniyor...</span>
            </div>
          )}
          <iframe
            key={playing}
            src={`https://easyhub.games/tr/games/${playing}`}
            className={`w-full h-full ${gameLoaded ? '' : 'invisible'}`}
            allowFullScreen
            allow="autoplay; fullscreen; gamepad"
            style={{ border: 'none' }}
            onLoad={() => setGameLoaded(true)}
          />
        </div>
      </div>
    </div>
  )
}
