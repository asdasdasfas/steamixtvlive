import { useState, useRef, useCallback, useEffect } from 'react'
import { Loader2, Maximize2, Minimize2, ArrowLeft } from 'lucide-react'

interface Game { name: string; slug: string; cat: string }

const GAMES: Game[] = [
  // İşletme / Yönetim (Management / Tycoon)
  { name: 'Süpermarket', slug: 'supermarket', cat: 'İşletme' },
  { name: 'Döner Efsanesi', slug: 'doner-efsanesi', cat: 'İşletme' },
  { name: 'İyi Pizza Güzel Pizza', slug: 'iyi-pizza-guzel-pizza', cat: 'İşletme' },
  { name: 'Penguen Lokantası', slug: 'penguen-lokantasi', cat: 'İşletme' },
  { name: 'Hamburger Restoranı', slug: 'hamburger-restorani', cat: 'İşletme' },
  { name: 'Hamburger Dükkanı', slug: 'hamburger-dukkani', cat: 'İşletme' },
  { name: 'Suşi Dükkanı', slug: 'susi-dukkani', cat: 'İşletme' },
  { name: 'Pizza Dükkanı İşletme', slug: 'pizza-dukkani-isletme', cat: 'İşletme' },
  { name: 'Pasta Dükkanı', slug: 'pasta-dukkani', cat: 'İşletme' },
  { name: 'Sosisçi Bush', slug: 'sosisci-bush', cat: 'İşletme' },
  { name: 'Hızlı Büfeci 2', slug: 'hizli-bufeci-2', cat: 'İşletme' },
  { name: 'Hizli Büfeci', slug: 'hizli-bufeci', cat: 'İşletme' },
  { name: 'Hamburgerci Kız', slug: 'hamburgerci-kiz', cat: 'İşletme' },
  { name: 'Restoran İşletme', slug: 'restoran-isletme', cat: 'İşletme' },
  { name: 'Sokak Restoranı', slug: 'sokak-restorani', cat: 'İşletme' },
  { name: 'Burger Dükkanı', slug: 'burger-dukkani', cat: 'İşletme' },
  { name: 'Pizza İmparatorluğu', slug: 'pizza-imparatorlugu', cat: 'İşletme' },
  { name: 'Penguen Cafe', slug: 'penguen-cafe', cat: 'İşletme' },
  { name: 'Otel İşletme 2', slug: 'otel-isletme-2', cat: 'İşletme' },
  { name: 'Otel İşletme', slug: 'otel-isletme', cat: 'İşletme' },
  { name: 'Lunapark İşletme', slug: 'lunapark-isletme', cat: 'İşletme' },
  { name: 'Alışveriş Caddesi', slug: 'alisveris-caddesi', cat: 'İşletme' },
  { name: 'Alışveriş Merkezi', slug: 'alisveris-merkezi', cat: 'İşletme' },
  { name: 'Giyim Mağazası', slug: 'giyim-magazasi', cat: 'İşletme' },
  { name: 'Ofis Yönetme', slug: 'ofis-yonetme', cat: 'İşletme' },
  { name: 'Benzin İstasyonu', slug: 'benzin-istasyonu-isletme', cat: 'İşletme' },
  { name: 'Emlakçı', slug: 'emlakci', cat: 'İşletme' },
  { name: 'Reyon Düzenleme 2', slug: 'reyon-duzenleme-2', cat: 'İşletme' },
  { name: 'Garson Kız', slug: 'garson-kiz', cat: 'İşletme' },
  { name: 'Demirci Eşek', slug: 'demirci-esek', cat: 'İşletme' },
  { name: 'Araba Satıcısı', slug: 'araba-saticisi', cat: 'İşletme' },
  { name: 'Otopark Görevlisi 2', slug: 'otopark-gorevlisi-2', cat: 'İşletme' },
  { name: 'Şirinler Lokantası', slug: 'sirinler-lokantasi', cat: 'İşletme' },
  { name: 'Yemek Çılgınlığı', slug: 'yemek-cilginligi', cat: 'İşletme' },
  { name: 'Pizza', slug: 'pizza', cat: 'İşletme' },
  { name: 'Hamburger Yapma', slug: 'hamburger-yapma', cat: 'İşletme' },
  { name: 'Garson Penguen', slug: 'garson-penguen', cat: 'İşletme' },
  { name: 'Restoran', slug: 'restoran', cat: 'İşletme' },
  { name: 'Cadı Restoranı', slug: 'cadi-restorani', cat: 'İşletme' },
  { name: 'Penguen Lokantası 2', slug: 'penguen-lokantasi-2', cat: 'İşletme' },
  { name: 'Döner Efsanesi 2', slug: 'doner-efsanesi-2', cat: 'İşletme' },
  { name: 'Muz Çiftliği', slug: 'muz-ciftligi', cat: 'İşletme' },
  { name: 'Yumurta Fabrikası', slug: 'yumurta-fabrikasi', cat: 'İşletme' },

  // Macera / Aksiyon (Adventure / Action)
  { name: 'Super Bear Adventure', slug: 'super-bear-adventure', cat: 'Macera' },
  { name: 'Among Us', slug: 'among-us', cat: 'Macera' },
  { name: 'Hello Neighbor', slug: 'hello-neighbor', cat: 'Macera' },
  { name: 'Cat and Granny', slug: 'cat-and-granny', cat: 'Macera' },
  { name: 'Hapishaneden Kaçış', slug: 'hapishaneden-kacis-obby', cat: 'Macera' },
  { name: 'Uzay Hapishanesinden Kaçış', slug: 'uzay-hapishanesinden-kacis', cat: 'Macera' },
  { name: 'Saklambaç', slug: 'saklambac', cat: 'Macera' },
  { name: 'Portaldan Kaçış', slug: 'portaldan-kacis', cat: 'Macera' },
  { name: 'Tünel Kazma 2', slug: 'tunel-kazma-2', cat: 'Macera' },
  { name: 'Adadan Kaçış', slug: 'adadan-kacis', cat: 'Macera' },
  { name: 'Bu Benim Komşum Değil', slug: 'bu-benim-komsum-degil', cat: 'Macera' },
  { name: 'Hırsız Polis', slug: 'hirsiz-polis', cat: 'Macera' },
  { name: 'Polislerden Kaç', slug: 'polislerden-kac', cat: 'Macera' },
  { name: 'Robin Hood', slug: 'robin-hood', cat: 'Macera' },
  { name: 'I am Cat', slug: 'i-am-cat', cat: 'Macera' },
  { name: 'I Am Monkey', slug: 'i-am-monkey', cat: 'Macera' },
  { name: 'Meccha Chameleon', slug: 'meccha-chameleon', cat: 'Macera' },
  { name: 'Lise Öğretmeni Sim.', slug: 'lise-ogretmeni-simulatoru', cat: 'Macera' },
  { name: 'Kedi Simülatörü', slug: 'kedi-simulatoru', cat: 'Macera' },
  { name: 'Geyik Simülatörü', slug: 'geyik-simulatoru', cat: 'Macera' },
  { name: 'Yaşam Simülasyonu', slug: 'yasam-simulasyonu', cat: 'Macera' },
  { name: 'Havaalanı Güvenlik', slug: 'havaalani-guvenlik', cat: 'Macera' },
  { name: 'Havaalanı Görevlisi', slug: 'havaalani-gorevlisi', cat: 'Macera' },
  { name: 'Havaalanı Sim.', slug: 'havaalani-simulasyonu', cat: 'Macera' },
  { name: 'Hostes', slug: 'hostes', cat: 'Macera' },
  { name: 'Okulda Flört', slug: 'okulda-flort', cat: 'Macera' },
  { name: 'Hacker', slug: 'hacker', cat: 'Macera' },
  { name: 'Kar Küreme', slug: 'kar-kureme', cat: 'Macera' },
  { name: 'Mad Day Special', slug: 'mad-day-special', cat: 'Macera' },
  { name: 'Köpek Bakma', slug: 'kopek-bakma', cat: 'Macera' },
  { name: 'Roblox Temizlik', slug: 'roblox-temizlik', cat: 'Macera' },

  // Platform / Parkur (Platform / Runner)
  { name: 'Obby Mega Parkur', slug: 'obby-mega-parkur', cat: 'Platform' },
  { name: 'Obby Zıplama Parkuru', slug: 'obby-ziplama-parkuru', cat: 'Platform' },
  { name: 'Obby Spor Salonu', slug: 'obby-spor-salonu', cat: 'Platform' },
  { name: 'Zor Parkur', slug: 'zor-parkur', cat: 'Platform' },
  { name: 'Maden Avcısı', slug: 'maden-avcisi', cat: 'Platform' },
  { name: 'Depo Avcısı', slug: 'depo-avcisi', cat: 'Platform' },

  // Araba Yarışı (Racing)
  { name: 'Drift Parkuru', slug: 'drift-parkuru', cat: 'Araba' },
  { name: 'Araba Yarışı', slug: 'araba-yarisi', cat: 'Araba' },
  { name: 'Direksiyonlu Araba Sürme', slug: 'direksiyonlu-araba-surme', cat: 'Araba' },
  { name: 'Tofaş Şahin', slug: 'tofas-sahin', cat: 'Araba' },
  { name: '3D Car Simulator', slug: '3d-car-simulator', cat: 'Araba' },
  { name: 'Dr Driving', slug: 'dr-driving', cat: 'Araba' },
  { name: 'Extreme Car Driving', slug: 'extreme-car-driving-simulator', cat: 'Araba' },
  { name: 'Super Drift 3D', slug: 'super-drift-3d', cat: 'Araba' },

  // Spor (Sports)
  { name: 'Spor Salonu', slug: 'spor-salonu', cat: 'Spor' },
  { name: 'Basketbol', slug: 'basketbol', cat: 'Spor' },
  { name: 'Futbol', slug: 'futbol', cat: 'Spor' },

  // Zombi / Survival
  { name: 'Zombi Yolu 4', slug: 'zombi-yolu-4', cat: 'Zombi' },
  { name: 'Gumball Survivor', slug: 'gumball-survivor', cat: 'Zombi' },
  { name: 'Survivor', slug: 'survivor', cat: 'Zombi' },

  // Yemek (Cooking / Food)
  { name: 'Pasta Yapma', slug: 'pasta-yapma', cat: 'Yemek' },
  { name: 'Pizza Yapma', slug: 'pizza-yapma', cat: 'Yemek' },
  { name: 'Hamburger', slug: 'hamburger', cat: 'Yemek' },
  { name: 'Dondurma Yapma', slug: 'dondurma-yapma', cat: 'Yemek' },
  { name: 'Pankek Yapma', slug: 'pankek-yapma', cat: 'Yemek' },
  { name: 'Master Şef', slug: 'master-sef', cat: 'Yemek' },
  { name: 'Tost Yapma', slug: 'tost-yapma', cat: 'Yemek' },
  { name: 'Döner Kebap', slug: 'doner-kebap', cat: 'Yemek' },
  { name: 'Yemek Yapma', slug: 'yemek-yapma', cat: 'Yemek' },
  { name: 'Taco Yapma', slug: 'taco-yapma', cat: 'Yemek' },
  { name: 'Sandviç', slug: 'sandvic', cat: 'Yemek' },
  { name: 'Elmalı Turta', slug: 'elmali-turta', cat: 'Yemek' },
  { name: 'Süper Pizza', slug: 'super-pizza', cat: 'Yemek' },

  // Klasikler
  { name: 'Ateş ve Su', slug: 'ates-ve-su', cat: 'Macera' },
  { name: 'Süper Mario', slug: 'super-mario', cat: 'Platform' },
  { name: 'Mahjong', slug: 'mahjong', cat: 'Zeka' },
  { name: 'Bubble Shooter', slug: 'bubble-shooter', cat: 'Zeka' },
  { name: 'Okey', slug: 'okey', cat: 'Zeka' },
  { name: 'Tavla', slug: 'tavla', cat: 'Zeka' },
]

const uniqueGames = GAMES.filter((g, i, a) => a.findIndex(x => x.slug === g.slug) === i)

export default function GamesScreen() {
  const [playing, setPlaying] = useState<string | null>(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const playerRef = useRef<HTMLDivElement>(null)

  const game = playing ? uniqueGames.find(g => g.slug === playing) : null

  const toggleFullscreen = useCallback(async () => {
    if (!playerRef.current) return
    try {
      if (!document.fullscreenElement) {
        await playerRef.current.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch { /* not supported */ }
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const handleImgError = (slug: string) => {
    setImgErrors(prev => new Set(prev).add(slug))
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-[#0f172a]">
      {playing ? (
        <div ref={playerRef} className="flex-1 flex flex-col bg-black relative">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1f35] border-b border-white/5 z-10">
            <button onClick={() => { setPlaying(null); setIframeLoaded(false) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Geri
            </button>
            <span className="text-sm font-semibold text-white flex-1 truncate">{game?.name}</span>
            <button onClick={toggleFullscreen}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20 transition-colors">
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              {isFullscreen ? 'Küçült' : 'Tam Ekran'}
            </button>
          </div>
          <div className="flex-1 relative">
            {!iframeLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-[#0099ff] animate-spin" />
                <span className="text-xs text-gray-500">Oyun yükleniyor...</span>
              </div>
            )}
            <iframe
              src={`https://www.rekoroyun.com/${playing}.html`}
              className={`w-full h-full ${iframeLoaded ? '' : 'invisible'}`}
              allowFullScreen
              allow="autoplay; fullscreen; gamepad"
              style={{ border: 'none' }}
              onLoad={() => setIframeLoaded(true)}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="px-4 md:px-6 pt-4 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                🎮 Oyunlar
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">{uniqueGames.length} Android tarzı oyun</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6 scrollbar-thin">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {uniqueGames.map((game, i) => {
                const hue = (i * 47) % 360
                const grad = `linear-gradient(135deg, hsl(${hue},60%,30%), hsl(${(hue + 60) % 360},60%,20%))`
                const showImg = playing === null && !imgErrors.has(game.slug)
                return (
                  <button key={game.slug} onClick={() => { setPlaying(game.slug); setIframeLoaded(false) }}
                    className="group bg-[#1a1f35] rounded-xl overflow-hidden hover:bg-[#252b45] transition-all hover:shadow-lg hover:shadow-[#0099ff]/10 active:scale-[0.97] text-left">
                    <div className="aspect-[4/3] relative overflow-hidden" style={{ background: grad }}>
                      {showImg && (
                        <img
                          src={`https://www.rekoroyun.com/resim/${game.slug}.jpg`}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={() => handleImgError(game.slug)}
                        />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                    <div className="p-2.5">
                      <p className="text-sm font-medium text-white truncate">{game.name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{game.cat}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
