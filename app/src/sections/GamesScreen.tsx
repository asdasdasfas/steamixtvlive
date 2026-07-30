import { useState, useRef, useCallback, useEffect } from 'react'
import { Loader2, Maximize2, Minimize2, ArrowLeft } from 'lucide-react'

interface Game { name: string; slug: string; cat: string }

const GAMES: Game[] = [
  // Koşu / Aksiyon (Running / Action)
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

  // Macera (Adventure)
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

  // Sürüş / Araba (Driving / Car)
  { name: 'Çekmece Süper Yarışçı', slug: 'drawer-super-racer', cat: 'Araba' },
  { name: 'Moskova Metro Sürücüsü 3D', slug: 'moscow-metro-driver-3d', cat: 'Araba' },
  { name: 'Araba Yarışı 3D', slug: 'araba-yarisi-3d', cat: 'Araba' },
  { name: 'Çarpışma Yarışı Çiz', slug: 'carpisma-yarisi-ciz', cat: 'Araba' },
  { name: 'Köprüler Çiz', slug: 'kopruler-ciz', cat: 'Araba' },
  { name: 'Yanan Lastik Çarpışması', slug: 'yanan-lastik-carpismasi-ve-yanma', cat: 'Araba' },
  { name: 'Araba Kullanmak', slug: 'shoot-and-drive', cat: 'Araba' },
  { name: 'Uçan Yarasa Robot Araba', slug: 'ucan-yarasa-robot-araba-donusumu-oyunu', cat: 'Araba' },

  // Hayatta Kalma / Korku (Survival / Horror)
  { name: 'Zombi Dünyasından Kaçış', slug: 'zombi-dunyasindan-kacis', cat: 'Korku' },
  { name: 'SURVIVORZ: Mermiler ve Beyinler', slug: 'survivorz-bullets-and-brains', cat: 'Korku' },
  { name: 'ZARCANE: Zombi Kıyameti', slug: 'zarcane-bir-zombi-kiyameti', cat: 'Korku' },
  { name: 'Slenderman\'ın Şafağı', slug: 'slendermanin-safagi', cat: 'Korku' },
  { name: 'Canavar Okulu', slug: 'canavar-okulu-herobrine-siren-kafasi', cat: 'Korku' },
  { name: 'Psikopatlar Şehri', slug: 'psikopatlar-sehri', cat: 'Korku' },
  { name: 'Cadılar Bayramı Katliamı', slug: 'cadilar-bayrami-elektrikli-testere-katliami', cat: 'Korku' },
  { name: 'Katil', slug: 'katil', cat: 'Korku' },
  { name: 'Keskin Nişancı Saldırısı', slug: 'keskin-nisanci-saldirisi', cat: 'Korku' },

  // Parkur / Platform (Parkour / Platform)
  { name: 'Parkur Ustası', slug: 'parkour-master', cat: 'Parkur' },
  { name: 'Parkur Ustası 2', slug: 'parkour-master-2', cat: 'Parkur' },
  { name: 'Parkour Race', slug: 'pk-parkour-race', cat: 'Parkur' },
  { name: 'Bloklu Parkur', slug: 'bloklu-parkur-sadece-yukari-macera', cat: 'Parkur' },
  { name: 'Mega Parkour', slug: 'mega-parkour-obby-kacis-kosusu', cat: 'Parkur' },
  { name: 'Obby Parkur Yarışı', slug: 'obby-parkur-yarisi-cok-oyunculu', cat: 'Parkur' },
  { name: 'Obby World', slug: 'obby-world-kalamardan-kacis', cat: 'Parkur' },
  { name: 'Dijital Sirk: Obby', slug: 'dijital-sirk-obby', cat: 'Parkur' },
  { name: 'Hapishaneden Kaçış.io', slug: 'hapishaneden-kacis-io', cat: 'Parkur' },
  { name: 'Tung Tung Sahur', slug: 'tung-tung-sahur-obby-mucadelesi', cat: 'Parkur' },
  { name: 'Hava Bloğu', slug: 'hava-bloku', cat: 'Parkur' },
  { name: 'Karalama Yolu', slug: 'karalamayolu', cat: 'Parkur' },
  { name: 'Çılgın Adamlar', slug: 'cilgin-adamlar', cat: 'Parkur' },
  { name: 'Tembel Atlayıcı', slug: 'tembel-atlayici', cat: 'Parkur' },
  { name: 'Zıpla Çocuklar', slug: 'ziplay-cocuklar', cat: 'Parkur' },
  { name: 'Ne Bacak', slug: 'ne-bacak', cat: 'Parkur' },
  { name: 'Paperly: Kağıt Uçak', slug: 'paperly-kagit-ucak-macerasi', cat: 'Parkur' },
  { name: 'Yuvarlanan Toplar Deniz', slug: 'yuvarlanan-toplar-deniz-yarisi', cat: 'Parkur' },
  { name: 'Yuvarlanan Toplar Uzay', slug: 'yuvarlanan-toplar-uzay-yarisi', cat: 'Parkur' },
  { name: 'Çatal N Sosis', slug: 'catal-n-sosis', cat: 'Parkur' },
  { name: 'Rodha', slug: 'rodha', cat: 'Parkur' },
  { name: 'JamJam', slug: 'jamjam', cat: 'Parkur' },
  { name: 'Beraberlik ve Kırma', slug: 'beraberlik-ve-kirma', cat: 'Parkur' },
  { name: 'Toilet Rush', slug: 'toilet-rush-bulmaca-ciz', cat: 'Parkur' },

  // Çiftçilik / İşletme (Farming / Management)
  { name: 'Pure Farm: Taze Gıda', slug: 'pure-farm-fresh-food', cat: 'Çiftçilik' },
  { name: 'Çiftlik Ailesi', slug: 'ciftlik-ailesi', cat: 'Çiftçilik' },
  { name: 'Benim Martım', slug: 'benim-martim', cat: 'Çiftçilik' },
  { name: 'Hayvanat Bahçesi Adası', slug: 'hayvanat-bahcesi-adasi', cat: 'Çiftçilik' },
  { name: 'Yaban Hayatı Cenneti', slug: 'yaban-hayati-cenneti-sandbox-safari', cat: 'Çiftçilik' },
  { name: 'Hexo Ülkesi', slug: 'hexo-ulkesi', cat: 'Çiftçilik' },
  { name: 'Boşta Hayvanat Bahçesi', slug: 'bosta-hayvanat-bahcesi', cat: 'Çiftçilik' },
  { name: 'Mısır Kralı', slug: 'misir-krali', cat: 'Çiftçilik' },

  // İşletme / Tycoon
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

  // Nişancı / FPS (Shooter)
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
  { name: 'Max Gangsterlere Karşı', slug: 'max-gangsterlere-karsi', cat: 'Nişancı' },
  { name: 'Korumalı Alan Şehri', slug: 'korumali-alan-sehri', cat: 'Nişancı' },
  { name: 'Usta Vuruş: Patron Avcısı', slug: 'master-hit-boss-hunter-btt', cat: 'Nişancı' },
  { name: 'Dedektif IQ', slug: 'detective-iq-brain-games', cat: 'Nişancı' },

  // Profesyonel İnşaat
  { name: 'Profesyonel İnşaat 3D', slug: 'pro-construction-simulator-3d-swm', cat: 'Simülasyon' },

  // Diğer (Other)
  { name: 'Kağıt Bebek Günlüğü', slug: 'paper-doll-diary-diy-dress-up', cat: 'Yaratıcı' },
  { name: 'Birleştir ve Oluştur', slug: 'merge-construct', cat: 'Yaratıcı' },
  { name: 'Mystery Digger', slug: 'mystery-digger', cat: 'Yaratıcı' },
  { name: 'Coin Clicker', slug: 'coin-clicker', cat: 'Yaratıcı' },
]

const uniqueGames = GAMES.filter((g, i, a) => a.findIndex(x => x.slug === g.slug) === i)

export default function GamesScreen() {
  const [playing, setPlaying] = useState<string | null>(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)
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
              src={`/game-proxy/${playing}`}
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
                return (
                  <button key={game.slug} onClick={() => { setPlaying(game.slug); setIframeLoaded(false) }}
                    className="group bg-[#1a1f35] rounded-xl overflow-hidden hover:bg-[#252b45] transition-all hover:shadow-lg hover:shadow-[#0099ff]/10 active:scale-[0.97] text-left">
                    <div className="aspect-[4/3] relative overflow-hidden" style={{ background: grad }} />
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
