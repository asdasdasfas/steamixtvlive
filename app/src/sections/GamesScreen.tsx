import { useState, useRef, useCallback, useEffect } from 'react'
import { Loader2, Maximize2, Minimize2, ChevronDown } from 'lucide-react'

interface Game { name: string; slug: string; cat: string }

const GAMES: Game[] = [
  { name: 'Subway Surfers', slug: 'pk-subway-surfers', cat: 'Koşu' },
  { name: 'Tunnel Rush', slug: 'pk-tunnel-rush', cat: 'Koşu' },
  { name: 'Tünel Koşucusu', slug: 'tunnel-runner', cat: 'Koşu' },
  { name: 'Drive Mad', slug: 'pk-drive-mad', cat: 'Koşu' },
  { name: 'Mobil Koşu', slug: 'mobile-run', cat: 'Koşu' },
  { name: 'Metrodan Kaçış', slug: 'metro-escape', cat: 'Koşu' },
  { name: 'Ninja Kaçışı', slug: 'ninja-escape', cat: 'Koşu' },
  { name: 'Serbest Kal', slug: 'break-free', cat: 'Koşu' },
  { name: 'Öfke Ayak', slug: 'anger-foot-3d', cat: 'Koşu' },
  { name: 'Twerk Race 3D', slug: 'twerk-race-3d----fun-run-game', cat: 'Koşu' },
  { name: 'Dinosaur Game', slug: 'pk-dinosaur-game', cat: 'Koşu' },
  { name: 'Murder', slug: 'pk-murder', cat: 'Macera' },
  { name: 'Kötü Büyükanneden Kaçış', slug: 'escape-evil-granny-viz', cat: 'Macera' },
  { name: 'Kapılar Kalesi', slug: 'doors-castle', cat: 'Macera' },
  { name: 'Kaçış Odası: Garip Vaka 2', slug: 'escape-room-strange-case-2', cat: 'Macera' },
  { name: 'Iron Snout', slug: 'pk-iron-snout', cat: 'Macera' },
  { name: 'Vur ve Sür', slug: 'shoot-and-drive', cat: 'Macera' },
  { name: 'Fleeing The Complex', slug: 'fleeing-the-complex', cat: 'Macera' },
  { name: 'We Become What We Behold', slug: 'we-become-what-we-behold', cat: 'Macera' },
  { name: 'Moto X3M', slug: 'moto-x3m', cat: 'Macera' },
  { name: 'Stickman Hook', slug: 'pk-stickman-hook', cat: 'Macera' },
  { name: 'Çakram Ustası', slug: 'chakram-master', cat: 'Macera' },
  { name: 'Okçular Arenası', slug: 'archers-arena', cat: 'Macera' },
  { name: 'Hedef Ustası', slug: 'target-master', cat: 'Macera' },
  { name: 'Karışık Halatlar', slug: 'tangled-ropes', cat: 'Macera' },
  { name: 'Asansör Odasından Kaçış', slug: 'escape-elevator-room', cat: 'Macera' },
  { name: 'Video Stüdyosundan Kaçış', slug: 'iz-video-studio-escape', cat: 'Macera' },
  { name: 'Perili Okul', slug: 'haunted-school', cat: 'Macera' },
  { name: 'Kuzbass Korku', slug: 'kuzbass-horror', cat: 'Macera' },
  { name: 'Uzay Dalgaları', slug: 'space-waves', cat: 'Macera' },
  { name: 'Söz Dizimi', slug: 'syntax', cat: 'Macera' },
  { name: 'Çekmece Süper Yarışçı', slug: 'drawer-super-racer', cat: 'Araba' },
  { name: 'Moskova Metro Sürücüsü 3D', slug: 'moscow-metro-driver-3d', cat: 'Araba' },
  { name: 'Araba Yarışı 3D', slug: 'araba-yarisi-3d', cat: 'Araba' },
  { name: 'Çarpışma Yarışı Çiz', slug: 'carpisma-yarisi-ciz', cat: 'Araba' },
  { name: 'Köprüler Çiz', slug: 'kopruler-ciz', cat: 'Araba' },
  { name: 'Yanan Lastik Çarpışması', slug: 'yanan-lastik-carpismasi-ve-yanma', cat: 'Araba' },
  { name: 'Uçan Yarasa Robot Araba', slug: 'ucan-yarasa-robot-araba-donusumu-oyunu', cat: 'Araba' },
  { name: 'Zombi Dünyasından Kaçış', slug: 'zombi-dunyasindan-kacis', cat: 'Korku' },
  { name: 'SURVIVORZ', slug: 'survivorz-bullets-and-brains', cat: 'Korku' },
  { name: 'ZARCANE', slug: 'zarcane-bir-zombi-kiyameti', cat: 'Korku' },
  { name: 'Slenderman\'ın Şafağı', slug: 'slendermanin-safagi', cat: 'Korku' },
  { name: 'Canavar Okulu', slug: 'canavar-okulu-herobrine-siren-kafasi', cat: 'Korku' },
  { name: 'Psikopatlar Şehri', slug: 'psikopatlar-sehri', cat: 'Korku' },
  { name: 'Cadılar Bayramı Katliamı', slug: 'cadilar-bayrami-elektrikli-testere-katliami', cat: 'Korku' },
  { name: 'Parkur Ustası', slug: 'parkour-master', cat: 'Parkur' },
  { name: 'Parkur Ustası 2', slug: 'parkour-master-2', cat: 'Parkur' },
  { name: 'Parkour Race', slug: 'pk-parkour-race', cat: 'Parkur' },
  { name: 'Bloklu Parkur', slug: 'bloklu-parkur-sadece-yukari-macera', cat: 'Parkur' },
  { name: 'Mega Parkour', slug: 'mega-parkour-obby-kacis-kosusu', cat: 'Parkur' },
  { name: 'Obby Parkur Yarışı', slug: 'obby-parkur-yarisi-cok-oyunculu', cat: 'Parkur' },
  { name: 'Obby World', slug: 'obby-world-kalamardan-kacis', cat: 'Parkur' },
  { name: 'Dijital Sirk: Obby', slug: 'dijital-sirk-obby', cat: 'Parkur' },
  { name: 'Hapishaneden Kaçış.io', slug: 'hapishaneden-kacis-io', cat: 'Parkur' },
  { name: 'Pure Farm: Taze Gıda', slug: 'pure-farm-fresh-food', cat: 'Çiftçilik' },
  { name: 'Çiftlik Ailesi', slug: 'ciftlik-ailesi', cat: 'Çiftçilik' },
  { name: 'Hayvanat Bahçesi Adası', slug: 'hayvanat-bahcesi-adasi', cat: 'Çiftçilik' },
  { name: 'Yaban Hayatı Cenneti', slug: 'yaban-hayati-cenneti-sandbox-safari', cat: 'Çiftçilik' },
  { name: 'İkinci El Araba Satıcısı', slug: 'ikinci-el-araba-saticisi-tycoon', cat: 'İşletme' },
  { name: 'Spor Kulübü 3D', slug: 'spor-kulubu-3d', cat: 'İşletme' },
  { name: 'Boşta Taşıma Kralı', slug: 'bosta-tasima-krali', cat: 'İşletme' },
  { name: 'Taverna Simülatörü', slug: 'taverna-simulatoru', cat: 'İşletme' },
  { name: 'Boşta Restoran Kralı', slug: 'bosta-restoran-krali', cat: 'İşletme' },
  { name: 'Marina Ateşi Kralı', slug: 'marina-atesi-krali', cat: 'İşletme' },
  { name: 'Taxi Tycoon', slug: 'taxi-tycoon-bosta-is', cat: 'İşletme' },
  { name: 'Günlük Bakım Kralı', slug: 'gunluk-bakim-krali', cat: 'İşletme' },
  { name: 'İnternet ve Oyun Kafe Sim.', slug: 'internet-ve-oyun-kafe-simulatoru', cat: 'İşletme' },
  { name: 'Iza\'nın Süpermarketi', slug: 'iza-supermarketi', cat: 'İşletme' },
  { name: 'Çamaşırhane Acelesi', slug: 'camasirhane-acelesi', cat: 'İşletme' },
  { name: 'Sokak Yemeği Simülatörü', slug: 'sokak-yemegi-simulatoru', cat: 'İşletme' },
  { name: 'Fırın Müdürü', slug: 'firin-muduru-magaza-simulatoru', cat: 'İşletme' },
  { name: 'Evcil Hayvan Kafesi', slug: 'evcil-hayvan-kafesi', cat: 'İşletme' },
  { name: 'Plaj Kulübü', slug: 'plaj-kulubu', cat: 'İşletme' },
  { name: 'Atari İmparatorluğu', slug: 'atari-imparatorlugu', cat: 'İşletme' },
  { name: 'Bar Ustası', slug: 'bar-ustasi', cat: 'İşletme' },
  { name: 'Yerçekimi Arenası', slug: 'yercekimi-arenasi-aticisi', cat: 'Nişancı' },
  { name: 'Arabalar vs Skibidi', slug: 'arabalar-vs-skibidi-tuvalet', cat: 'Nişancı' },
  { name: 'Ciddi Kafa', slug: 'ciddi-kafa', cat: 'Nişancı' },
  { name: 'Ciddi Kafa 2', slug: 'ciddi-kafa-2', cat: 'Nişancı' },
  { name: '1930\'ların Mafyası', slug: 'sehir-merkezinde-1930larin-mafyasi', cat: 'Nişancı' },
  { name: 'Küçük Robot', slug: 'kucuk-robot', cat: 'Nişancı' },
  { name: 'Yağma Kahramanı', slug: 'yagma-kahramani', cat: 'Nişancı' },
  { name: 'Fury Wars', slug: 'fury-wars-cevrimici-nisanci', cat: 'Nişancı' },
  { name: 'Kahraman 3: Uçan Robot', slug: 'kahraman-3-ucan-robot', cat: 'Nişancı' },
  { name: 'NIMRODS: GunCraft', slug: 'nimrods-guncraft-survivor-demosu', cat: 'Nişancı' },
  { name: 'Gangster Suçları 6', slug: 'gangster-suclari-cevrimici-6', cat: 'Nişancı' },
  { name: 'Usta Vuruş: Patron Avcısı', slug: 'master-hit-boss-hunter-btt', cat: 'Nişancı' },
  { name: 'Profesyonel İnşaat 3D', slug: 'pro-construction-simulator-3d-swm', cat: 'Simülasyon' },
  { name: 'Kağıt Bebek Günlüğü', slug: 'paper-doll-diary-diy-dress-up', cat: 'Yaratıcı' },
  { name: 'Birleştir ve Oluştur', slug: 'merge-construct', cat: 'Yaratıcı' },
  { name: 'Mystery Digger', slug: 'mystery-digger', cat: 'Yaratıcı' },
  { name: 'Coin Clicker', slug: 'coin-clicker', cat: 'Yaratıcı' },
]

const cats = [...new Set(GAMES.map(g => g.cat))]
const uniqueGames = GAMES.filter((g, i, a) => a.findIndex(x => x.slug === g.slug) === i)
const gamesByCat = Object.fromEntries(cats.map(c => [c, uniqueGames.filter(g => g.cat === c)]))

export default function GamesScreen() {
  const [playing, setPlaying] = useState<string>('pk-subway-surfers')
  const [gameLoaded, setGameLoaded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const playerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-black">
      <div ref={playerRef} className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2 px-3 py-2 bg-black/80 backdrop-blur-sm z-30 shrink-0 border-b border-white/5">
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen(p => !p)}
              className="flex items-center gap-1.5 bg-white/10 text-white text-xs rounded-lg px-2 py-1.5 border border-white/10 outline-none cursor-pointer max-w-[180px] sm:max-w-[250px]"
            >
              <span className="truncate flex-1">{game?.name}</span>
              <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>
            {menuOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 max-h-[60vh] overflow-y-auto bg-[#1a1a2e] border border-white/10 rounded-lg shadow-2xl z-50">
                {cats.map(cat => (
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
            )}
          </div>
          <button onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20 transition-colors shrink-0 ml-auto">
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="flex-1 relative min-h-0">
          {!gameLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20 bg-black">
              <Loader2 className="w-8 h-8 text-[#0099ff] animate-spin" />
              <span className="text-xs text-gray-400">Oyun yükleniyor...</span>
            </div>
          )}
          <iframe
            key={playing}
            src={`/tr/games/${playing}`}
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
