import { useEffect, useRef, useState } from 'react'
import { ShoppingCart, Check, Mail, CreditCard, PlayCircle, Trophy, Clapperboard, Tv, MonitorPlay, Smartphone, Download, Gamepad2, Wifi, X, Menu, AlertTriangle, Gauge } from 'lucide-react'
import AnimatedBackground from '@/sections/AnimatedBackground'

const APK_URL = 'https://www.dropbox.com/scl/fi/5bw5nsyelezwrxmyb5hwt/SteamixTV_v1.0.45_release.apk?rlkey=ghc5phabjucqlrq540zjdqgaz&st=36xy08me&dl=1'

const PLANS = [
  { name: '1 AYLIK', price: '300 TL', link: 'https://www.shopier.com/platool/49623989', features: ['4K Ultra HD', 'Sınırsız İzleme', 'Tüm Kategoriler', 'VOD + Arşiv', '7/24 Destek'] },
  { name: '3 AYLIK', price: '600 TL', link: 'https://www.shopier.com/platool/49624003', popular: true, features: ['4K Ultra HD', 'Sınırsız İzleme', 'Tüm Kategoriler', 'VOD + Arşiv', '7/24 Destek', 'En Popüler Seçim'] },
  { name: '12 AYLIK', price: '1.200 TL', link: 'https://www.shopier.com/platool/49624023', features: ['4K Ultra HD', 'Sınırsız İzleme', 'Tüm Kategoriler', 'VOD + Arşiv', '7/24 Destek'] },
]

const POSTERS = ['poster01.jpg', 'poster02.jpg', 'poster03.jpg', 'poster04.jpg', 'poster05.jpg', 'poster06.jpg', 'poster07.jpg', 'poster08.jpg', 'poster10.jpg', 'poster11.jpg', 'poster12.jpg', 'poster13.jpg']

const STATS = [
  { icon: Tv, value: 7500, suffix: '+', label: 'Canlı TV Kanalı' },
  { icon: Clapperboard, value: 35000, suffix: '+', label: 'Film & Dizi Arşivi' },
  { icon: MonitorPlay, value: 100, suffix: '%', label: '4K Maç Keyfi' },
  { icon: Wifi, value: 24, suffix: '/7', label: 'Kesintisiz Yayın' },
]

const KANALLAR = ['beIN Sports 1', 'TRT 1', 'TV8 HD', 'ATV', 'S Sport 1', 'Tabii Spor 1', 'TLC', 'NTV']
const FILMLER = ['Aksiyon', 'Komedi', 'Dram', 'Korku', 'Bilim Kurgu', 'Animasyon', 'Yerli', 'Romantik']

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [n, setN] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !started.current) {
        started.current = true
        const t0 = performance.now()
        const dur = 1800
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / dur)
          setN(Math.floor(value * (1 - Math.pow(1 - p, 3))))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
        obs.disconnect()
      }
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [value])
  return <span ref={ref}>{n.toLocaleString('tr-TR')}{suffix}</span>
}

function MiniEkran({ kucuk = false }: { kucuk?: boolean }) {
  const items = kucuk ? KANALLAR.slice(0, 4) : KANALLAR
  return (
    <div className="absolute inset-0">
      {/* Ekran 1: kanallar */}
      <div className="absolute inset-0 p-2" style={{ animation: 'ekranDon 12s ease-in-out infinite' }}>
        <div className="flex items-center gap-1 mb-1.5">
          <span className="text-[7px] font-bold text-white bg-[#0099ff] rounded px-1 py-0.5">CANLI TV</span>
          <span className="text-[7px] font-bold text-gray-500 bg-white/10 rounded px-1 py-0.5">FİLMLER</span>
          <span className="text-[7px] font-bold text-gray-500 bg-white/10 rounded px-1 py-0.5">DİZİLER</span>
        </div>
        <div className="space-y-1">
          {items.map((k, i) => (
            <div key={k} className={`flex items-center gap-1.5 rounded px-1.5 ${kucuk ? 'py-1' : 'py-1.5'} ${i === 1 ? 'bg-[#0099ff]/30 border border-[#0099ff]/50' : 'bg-white/5'}`}>
              <div className={`rounded ${kucuk ? 'w-5 h-3.5' : 'w-8 h-5'} bg-gradient-to-br ${i % 3 === 0 ? 'from-[#0099ff] to-blue-700' : i % 3 === 1 ? 'from-purple-500 to-purple-800' : 'from-emerald-500 to-emerald-800'}`} />
              <span className={`${kucuk ? 'text-[7px]' : 'text-[10px]'} text-gray-200 font-medium truncate`}>{k}</span>
              {i === 1 && <PlayCircle className={`${kucuk ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} text-[#0099ff] ml-auto shrink-0`} />}
            </div>
          ))}
        </div>
      </div>
      {/* Ekran 2: filmler */}
      <div className="absolute inset-0 p-2" style={{ animation: 'ekranDon 12s ease-in-out infinite', animationDelay: '4s', opacity: 0 }}>
        <div className="flex items-center gap-1 mb-1.5">
          <span className="text-[7px] font-bold text-gray-500 bg-white/10 rounded px-1 py-0.5">CANLI TV</span>
          <span className="text-[7px] font-bold text-white bg-[#0099ff] rounded px-1 py-0.5">FİLMLER</span>
          <span className="text-[7px] font-bold text-gray-500 bg-white/10 rounded px-1 py-0.5">DİZİLER</span>
        </div>
        <div className={`grid ${kucuk ? 'grid-cols-3' : 'grid-cols-4'} gap-1`}>
          {FILMLER.slice(0, kucuk ? 6 : 8).map((f, i) => (
            <div key={f} className={`rounded bg-gradient-to-br ${i % 4 === 0 ? 'from-rose-600 to-rose-900' : i % 4 === 1 ? 'from-amber-500 to-orange-800' : i % 4 === 2 ? 'from-cyan-500 to-blue-800' : 'from-violet-500 to-purple-800'} ${kucuk ? 'h-9' : 'h-14'} flex items-end p-1`}>
              <span className={`${kucuk ? 'text-[6px]' : 'text-[8px]'} text-white font-semibold`}>{f}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Ekran 3: maç */}
      <div className="absolute inset-0" style={{ animation: 'ekranDon 12s ease-in-out infinite', animationDelay: '8s', opacity: 0 }}>
        <img src="/images/login.jpg" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" style={{ animation: 'livePulse 1.5s ease-in-out infinite' }} />
          <span className={`${kucuk ? 'text-[7px]' : 'text-[9px]'} text-white font-bold tracking-widest`}>CANLI MAÇ</span>
        </div>
        <div className="absolute bottom-1.5 inset-x-1.5">
          <div className="flex justify-between text-[8px] text-white font-bold mb-0.5"><span>GS 2 - 1 FB</span><span>78'</span></div>
          <div className="h-1 rounded bg-white/20 overflow-hidden"><div className="h-full w-3/4 bg-gradient-to-r from-[#0099ff] to-purple-500" /></div>
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [seciliPlan, setSeciliPlan] = useState<typeof PLANS[0] | null>(null)

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col relative overflow-hidden">
      <AnimatedBackground />
      {/* Işıklı status barı */}
      <div className="fixed top-0 inset-x-0 z-50 h-[3px] bg-white/5 overflow-hidden">
        <style>{`@keyframes statusSweep { 0% { transform: translateX(-100%) } 100% { transform: translateX(400%) } }`}</style>
        <div className="h-full w-1/4 bg-gradient-to-r from-transparent via-[#0099ff] to-purple-500 shadow-[0_0_15px_rgba(0,153,255,0.9)]" style={{ animation: 'statusSweep 3s linear infinite' }} />
      </div>
      <div className="absolute inset-0 overflow-hidden">
        <style>{`@keyframes slowPanRight { 0% { transform: translateX(-150px) } 50% { transform: translateX(150px) } 100% { transform: translateX(-150px) } }
        @keyframes marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
        @keyframes floatGlow { 0%,100% { opacity: 0.5 } 50% { opacity: 1 } }
        @keyframes livePulse { 0%,100% { opacity: 1 } 50% { opacity: 0.35 } }
        @keyframes scanMove { 0% { top: -10% } 100% { top: 110% } }
        @keyframes ekranDon { 0%,28% { opacity: 1 } 33%,94% { opacity: 0 } 100% { opacity: 1 } }
        @keyframes dokunma { 0%,100% { transform: translate(0,0) scale(1); opacity: 0.8 } 25% { transform: translate(14px,10px) scale(0.9); opacity: 1 } 50% { transform: translate(-10px,16px) scale(0.9); opacity: 1 } 75% { transform: translate(6px,-8px) scale(1); opacity: 0.8 } }
        @keyframes kumandaBas { 0%,100% { transform: translateY(0) } 10%,30% { transform: translateY(-6px) rotate(-4deg) } 40%,60% { transform: translateY(0) } 70%,90% { transform: translateY(-6px) rotate(4deg) } }`}</style>
        <div className="absolute" style={{
          top: '-165px', bottom: '-165px', left: '-165px', right: '-165px',
          backgroundImage: 'url(/images/login.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.5) blur(1px)',
          animation: 'slowPanRight 60s ease-in-out infinite',
        }} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/70" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-[#0099ff]/10 rounded-full blur-[150px]" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Navigasyon */}
      <nav className="sticky top-[3px] z-40 backdrop-blur-md bg-black/50 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <a href="#top" className="flex items-center gap-2">
            <img src="/images/steamix-logo.jpg" alt="" className="w-8 h-8 rounded-lg" />
            <span className="text-base md:text-lg font-bold text-white tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>Steamix <span className="text-[#0099ff]">TV</span></span>
          </a>
          <div className="hidden md:flex items-center gap-1 text-sm">
            <a href="#cihazlar" className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all">Cihazlar</a>
            <a href="#icerik" className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all">İçerik</a>
            <a href="#uygulama" className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all">Uygulama</a>
            <a href="#planlar" className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all">Planlar</a>
            <a href="#test" className="ml-2 px-4 py-1.5 rounded-lg text-sm text-white bg-gradient-to-r from-[#0099ff] to-blue-600 hover:shadow-[0_0_20px_rgba(0,153,255,0.5)] transition-all">Test Al</a>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-gray-300">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 bg-black/70 px-4 py-3 space-y-1 text-sm">
            {[['Cihazlar', '#cihazlar'], ['İçerik', '#icerik'], ['Uygulama', '#uygulama'], ['Planlar', '#planlar'], ['Test Al', '#test']].map(([t, h]) => (
              <a key={h} href={h} onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/5">{t}</a>
            ))}
          </div>
        )}
      </nav>

      {/* Hero */}
      <div id="top" className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 py-14 md:py-20">
        <div className="flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full bg-[#0099ff]/10 border border-[#0099ff]/30">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-gray-300 tracking-widest uppercase">Canlı • 7.500+ Kanal • 35.000+ Film & Dizi</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          Steamix <span className="text-[#0099ff]">TV</span>
        </h1>
        <p className="text-lg md:text-2xl text-gray-300 leading-relaxed font-light">
          Sınırsız eğlence, kesintisiz keyif.
        </p>
        <p className="text-sm md:text-base text-gray-400 mt-3 leading-relaxed max-w-xl">
          Süper Lig dahil dünyadan tüm kanalları izleyeceksiniz. 4K Ultra HD kalitesinde
          binlerce film, dizi ve VOD içeriği. Dilediğin zaman, dilediğin yerde izle.
        </p>
        <div className="flex items-center gap-4 mt-8">
          <a href="#planlar" className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#0099ff] to-blue-600 text-white font-semibold text-sm hover:shadow-[0_0_30px_rgba(0,153,255,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all">
            Planları Gör
          </a>
          <a href="#test" className="px-6 py-3 rounded-xl bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-all flex items-center gap-2">
            <PlayCircle className="w-4 h-4" />Test Yayını Al
          </a>
        </div>
        <div className="flex items-center gap-4 mt-10">
          <div className="relative w-16 h-[2px] bg-white/5 overflow-hidden rounded-full">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0099ff] to-transparent opacity-80 rounded-full"
              style={{ animation: 'lightSweep 2s ease-in-out infinite' }} />
          </div>
          <span className="text-xs text-gray-600 tracking-widest uppercase">Steamix TV Company</span>
          <style>{`@keyframes lightSweep { 0%,100% { transform: translateX(-100%) } 50% { transform: translateX(100%) } }`}</style>
        </div>
      </div>

      {/* Slogan bandı */}
      <div className="relative z-10 border-y border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden py-3">
        <div className="flex whitespace-nowrap gap-8 w-max" style={{ animation: 'marquee 30s linear infinite' }}>
          {[0, 1].map(k => (
            <div key={k} className="flex gap-8 text-sm text-gray-300 tracking-widest uppercase">
              <span>⚽ Süper Lig</span><span className="text-[#0099ff]">•</span>
              <span>🏆 Şampiyonlar Ligi</span><span className="text-[#0099ff]">•</span>
              <span>🎬 Sinema Salonu</span><span className="text-[#0099ff]">•</span>
              <span>📺 7.500+ Canlı Kanal</span><span className="text-[#0099ff]">•</span>
              <span>🍿 35.000+ Film & Dizi</span><span className="text-[#0099ff]">•</span>
              <span>📡 4K Ultra HD</span><span className="text-[#0099ff]">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cihaz sahnesi */}
      <div id="cihazlar" className="relative z-10 max-w-6xl mx-auto px-4 py-12 md:py-16 w-full">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Kumandayla Koltuktan, <span className="text-[#0099ff]">Dokunarak Cebinden</span>
          </h2>
          <p className="text-sm text-gray-500 max-w-xl mx-auto">TV'de maç, telefonda dizi — Steamix TV arayüzü her ekranda aynı akıcılıkta.</p>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-14">
          {/* TV + kumanda */}
          <div className="flex items-end gap-4">
            <div className="flex flex-col items-center">
              <div className="relative rounded-xl overflow-hidden bg-black border-[6px] border-gray-900 shadow-[0_0_50px_rgba(0,153,255,0.35),0_0_120px_rgba(168,85,247,0.2)] w-72 md:w-[26rem]">
                <div className="relative aspect-video bg-[#0a0f1e]">
                  <MiniEkran />
                  <div className="absolute inset-x-0 h-8 bg-gradient-to-b from-[#0099ff]/20 to-transparent pointer-events-none" style={{ animation: 'scanMove 4s linear infinite' }} />
                </div>
              </div>
              <div className="w-14 h-4 bg-gray-900 rounded-b-lg" />
              <div className="w-44 h-1.5 bg-gray-900 rounded-full mt-1 shadow-[0_5px_20px_rgba(0,0,0,0.8)]" />
              <p className="text-xs text-gray-400 mt-3 text-center">Kanallar değişiyor, maç başlıyor…<br />TV'de yayın hiç durmaz</p>
            </div>
            {/* Kumanda */}
            <div className="hidden sm:flex flex-col items-center gap-2 pb-8" style={{ animation: 'kumandaBas 5s ease-in-out infinite' }}>
              <div className="w-12 rounded-2xl bg-gradient-to-b from-gray-800 to-gray-950 border border-white/15 p-2 space-y-1.5 shadow-[0_0_25px_rgba(0,153,255,0.25)]">
                <div className="w-6 h-6 mx-auto rounded-full bg-red-500/80" />
                <div className="grid grid-cols-3 gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                    <div key={n} className={`w-2.5 h-2.5 rounded-full mx-auto ${n === 5 ? 'bg-[#0099ff] shadow-[0_0_8px_rgba(0,153,255,0.9)]' : 'bg-white/20'}`} />
                  ))}
                </div>
                <div className="flex justify-center gap-1">
                  <div className="w-2.5 h-4 rounded bg-white/20" />
                  <div className="w-2.5 h-4 rounded bg-white/20" />
                </div>
              </div>
              <p className="text-[10px] text-gray-500 text-center">Kumandayla<br />kanal değiştir</p>
            </div>
          </div>
          {/* Telefon + dokunma */}
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className="relative rounded-[2rem] overflow-hidden bg-black border-[5px] border-gray-900 shadow-[0_0_45px_rgba(168,85,247,0.35)] w-40 md:w-48">
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-full z-10 border border-white/10" />
                <div className="relative aspect-[9/18] bg-[#0a0f1e]">
                  <MiniEkran kucuk />
                </div>
                <div className="absolute w-8 h-8 rounded-full border-2 border-[#0099ff] bg-[#0099ff]/20 shadow-[0_0_15px_rgba(0,153,255,0.8)] pointer-events-none" style={{ animation: 'dokunma 5s ease-in-out infinite', top: '55%', left: '60%' }} />
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">Parmağınla dokun,<br />filmler kayarak gelsin</p>
            </div>
          </div>
        </div>
      </div>

      {/* İstatistik barı */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-10 md:py-14 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(s => (
            <div key={s.label} className="rounded-2xl p-5 border border-white/10 bg-white/5 text-center hover:border-[#0099ff]/40 hover:shadow-[0_0_25px_rgba(0,153,255,0.15)] transition-all" style={{ animation: 'floatGlow 3s ease-in-out infinite' }}>
              <s.icon className="w-6 h-6 text-[#0099ff] mx-auto mb-2" />
              <div className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                <Counter value={s.value} suffix={s.suffix} />
              </div>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sinema vitrini */}
      <div id="icerik" className="relative z-10 max-w-6xl mx-auto px-4 pb-12 md:pb-16 w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Sinema Salonu <span className="text-[#0099ff]">Evinizde</span>
          </h2>
          <p className="text-sm text-gray-500 max-w-xl mx-auto">Vizyondan arşive binlerce film, kaldığınız yerden devam eden diziler — hepsi tek abonelikte.</p>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {POSTERS.map(p => (
            <div key={p} className="group relative rounded-xl overflow-hidden border border-white/10 hover:border-[#0099ff]/50 hover:scale-[1.04] hover:shadow-[0_0_25px_rgba(0,153,255,0.25)] transition-all duration-300">
              <img src={`/images/${p}`} alt="" loading="lazy" className="w-full aspect-[2/3] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </div>

      {/* Uygulama */}
      <div id="uygulama" className="relative z-10 max-w-xl mx-auto px-4 py-12 md:py-16 w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Steamix TV <span className="text-[#0099ff]">Uygulaması</span>
          </h2>
          <p className="text-sm text-gray-500">Telefon ve TV kutusu için resmi oynatıcımız</p>
        </div>
        <div className="p-5 rounded-xl bg-gradient-to-br from-[#0099ff]/10 to-purple-500/5 border border-[#0099ff]/20 space-y-3">
          <div className="flex items-start gap-3">
            <img src="/images/steamix-logo.jpg" alt="" className="w-12 h-12 rounded-xl shrink-0" />
            <div>
              <p className="text-sm text-gray-300 font-semibold mb-1">Steamix TV (Android)</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Abonelik bağlantınızla giriş yapın: 7.500+ canlı kanal, 35.000+ film ve dizi,
                4K kalite, kumanda ve dokunmatik uyumu. Tek dokunuşla kurun, izlemeye başlayın.
              </p>
            </div>
          </div>
          <a href={APK_URL} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-[#0099ff] to-blue-600 text-white font-semibold text-sm hover:opacity-90 hover:shadow-[0_0_20px_rgba(0,153,255,0.3)] transition-all">
            <Download className="w-4 h-4" /> Steamix TV'yi İndir
          </a>
          <p className="text-[11px] text-gray-500 text-center leading-relaxed">
            Android telefon, tablet ve TV kutularıyla uyumludur.
          </p>
        </div>
      </div>

      {/* Planlar */}
      <div id="planlar" className="relative z-10 max-w-5xl mx-auto px-4 py-12 md:py-16 w-full">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Fiyat <span className="text-[#0099ff]">Planları</span>
          </h2>
          <p className="text-sm text-gray-500">Size en uygun planı seçin, tüm içeriklere sınırsız erişim</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {PLANS.map(p => (
            <div key={p.name} className={`relative rounded-2xl p-6 border transition-all duration-300 hover:scale-[1.03] flex flex-col ${p.popular ? 'border-[#0099ff] bg-[#0099ff]/5 shadow-lg shadow-[#0099ff]/10' : 'border-white/10 bg-white/5'}`}>
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#0099ff] to-purple-500 text-white text-xs font-semibold whitespace-nowrap shadow-lg">
                  En Popüler
                </div>
              )}
              <div className="text-center mb-4 mt-2">
                <p className="text-xs text-gray-500 tracking-widest mb-2">{p.name}</p>
                <div className="text-3xl md:text-4xl font-bold text-[#0099ff] mb-1">{p.price}</div>
              </div>
              <div className="flex-1 space-y-2 mb-6">
                {p.features?.map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-gray-300">
                    <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setSeciliPlan(p)}
                className="block w-full py-3 rounded-xl bg-gradient-to-r from-[#0099ff] to-blue-600 text-white font-semibold text-sm text-center hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0099ff]/20">
                <ShoppingCart className="w-4 h-4" />Satın Al
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Test yayını */}
      <div id="test" className="relative z-10 max-w-xl mx-auto px-4 py-12 md:py-16 w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Test <span className="text-[#0099ff]">Yayını</span>
          </h2>
          <p className="text-sm text-gray-500">3 saatlik ücretsiz test ile tüm içerikleri deneyin</p>
        </div>
        <div className="p-5 rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border border-yellow-500/20 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Mail className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-300 font-semibold mb-2">3 Saatlik Ücretsiz Test Yayını</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Steamix TV'yi denemek için 3 saatlik ücretsiz test yayını talep edebilirsiniz.
                Test yayını tüm içerikleri kapsamaktadır. Talebinizi aşağıdaki
                e-posta adresine ilettikten sonra yöneticimiz tarafından en kısa sürede
                giriş bilgileriniz size teslim edilecektir.
              </p>
            </div>
          </div>
          <a href="mailto:steamixgame@yandex.com"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold text-sm hover:opacity-90 hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all">
            <Mail className="w-4 h-4" /> steamixgame@yandex.com
          </a>
          <p className="text-[11px] text-gray-500 text-center leading-relaxed">
            E-posta konusuna <span className="text-white font-medium">"Test Talebi"</span> yazmanız
            yeterlidir. En geç 24 saat içinde dönüş sağlanacaktır.
          </p>
        </div>
      </div>

      {/* Alt bilgi */}
      <div className="relative z-10 text-center pb-10 pt-4">
        <span className="text-xs text-gray-600 tracking-widest uppercase">Steamix TV Company</span>
      </div>

      {/* Satın alma bilgi modalı */}
      {seciliPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSeciliPlan(null)} />
          <div className="relative z-10 bg-gradient-to-b from-gray-900 to-gray-950 rounded-3xl p-6 md:p-8 max-w-lg w-full border border-white/10 shadow-2xl shadow-[#0099ff]/10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-full bg-[#0099ff]/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-[#0099ff]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>LÜTFEN OKUYUN</h2>
                <p className="text-xs text-gray-500">{seciliPlan.name} • {seciliPlan.price}</p>
              </div>
            </div>
            <div className="space-y-3 mb-6">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-yellow-500/[0.07] to-transparent border border-yellow-500/15 border-l-4 border-l-yellow-500/50">
                <p className="text-xs text-gray-400 leading-relaxed">
                  <span className="text-yellow-400 font-bold">📌 Önemli:</span> Satın aldıktan sonra{' '}
                  <span className="text-[#0099ff] font-semibold">steamixgame@yandex.com</span> mail adresine
                  satın aldığınıza dair ekran görüntüsü atın. Yönetici tarafından onaylanıp en kısa sürede
                  abonelik giriş bilgileriniz size teslim edilecektir.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0099ff]/[0.08] to-transparent border border-[#0099ff]/20 border-l-4 border-l-[#0099ff]/60">
                <p className="text-xs text-gray-300 leading-relaxed">
                  <span className="text-[#0099ff] font-bold">📩 Teslimat:</span> Aboneliğiniz satın alındıktan sonra
                  size özel oynatıcı bağlantınız mail üzerinden gönderilir. Bağlantı gönderildikten sonra
                  yukarıdaki uygulamayı indirip kullanabilirsiniz.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/[0.08] to-transparent border border-orange-500/15 border-l-4 border-l-orange-500/50">
                <p className="text-xs text-orange-300 leading-relaxed">
                  ⚠️ Shopier resmi kuralları gereği abonelikler sınırlıdır; satın aldığınız abonelik tamamlandıktan
                  sonra ek olarak yalnızca bir defaya mahsus tekrar alınabilir.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/[0.08] to-transparent border border-purple-500/20 border-l-4 border-l-purple-500/60">
                <p className="text-xs text-gray-300 leading-relaxed flex gap-2">
                  <Gauge className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span><span className="text-purple-300 font-bold">Donanım şartı:</span> Steamix TV'yi cihazlarınızda
                    oynatabilmek için en az 100 Mbps internet hızı ve güncel donanım özelliklerine sahip bir
                    akıllı televizyon ya da TV Box kullanmanız şarttır. Aksi halde donma ve takılmalar yaşanabilir.</span>
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href={seciliPlan.link} target="_blank" rel="noopener noreferrer"
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#0099ff] to-blue-600 text-white font-semibold text-sm text-center hover:shadow-[0_0_25px_rgba(0,153,255,0.5)] transition-all flex items-center justify-center gap-2">
                <ShoppingCart className="w-4 h-4" />Onaylıyorum, Satın Al
              </a>
              <button onClick={() => setSeciliPlan(null)}
                className="flex-1 py-3 rounded-xl bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-all">
                Hayır, Vazgeçtim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
