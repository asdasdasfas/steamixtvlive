import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { fetchCategories, fetchVods, fetchSeries } from '@/lib/supabase'
import { parseRotationData } from '@/lib/rotation'
import { getFavorites, removeFavorite } from '@/lib/favorites'
import type { FavoriteItem } from '@/lib/favorites'
import Navbar from '@/sections/Navbar'
import LiveTvScreen from '@/sections/LiveTvScreen'
import Poster from '@/components/Poster'
import { Loader2, Play, Info, Heart } from 'lucide-react'

function ArrowLeftIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
}
function ArrowRightIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
}

export default function Dashboard() {
  const { server, user } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'home'
  const initRef = useRef(false)

  const { categories: rotCategories } = parseRotationData()

  const [vodCats, setVodCats] = useState<any[]>([])
  const [seriesCats, setSeriesCats] = useState<any[]>([])
  const [vodItems, setVodItems] = useState<Record<string, any[]>>({})
  const [seriesItems, setSeriesItems] = useState<Record<string, any[]>>({})
  const scrollContainers = useRef<Record<string, HTMLDivElement | null>>({})

  const selectedCat = params.get('cat') || ''
  const selectedSeriesCat = params.get('scat') || ''
  const selectedLiveCat = params.get('lcat') || ''

  // Hero slider
  const [heroItems, setHeroItems] = useState<any[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const slideTimer = useRef<ReturnType<typeof setInterval>>(undefined)

  const liveDisabled = user?.["canlı tv"] === '0' || user?.["canlı tv"] === 'false' || user?.["canlı tv"] === 'kapalı'

  useEffect(() => {
    if (tab === 'live' && liveDisabled) {
      const sp = new URLSearchParams(params)
      sp.delete('tab')
      setParams(sp, { replace: true })
    }
  }, [tab, liveDisabled])

  // Series keyword filter (for homepage 2+2)
  const seriesKeywords = ['pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi', 'pazar', 'haftanın', 'günün dizisi', 'yerli dizi', 'yabancı dizi']
  const isSeriesCategory = (name: string) => seriesKeywords.some(k => name.toLowerCase().includes(k))

  const filteredVodCats = vodCats.filter(vc => {
    const vcn = vc.category_name.toLowerCase()
    if (seriesCats.some(sc => vcn.includes(sc.category_name.toLowerCase()) || sc.category_name.toLowerCase().includes(vcn))) return false
    if (isSeriesCategory(vcn)) return false
    return true
  })

  const showMovieCategory = tab === 'movies' && (selectedCat || filteredVodCats.length > 0)
  const showSeriesCategory = tab === 'series' && (selectedSeriesCat || seriesCats.length > 0)
  const activeMovieCat = selectedCat || filteredVodCats[0]?.category_id || ''
  const activeSeriesCat = selectedSeriesCat || seriesCats[0]?.category_id || ''

  // Basit yükleme: kategoriler + hero + ana sayfa 2+2 önizleme
  useEffect(() => {
    if (!server || initRef.current) return
    initRef.current = true

    ;(async () => {
      try {
        const [vc, sc] = await Promise.all([
          fetchCategories(server.base_url, server.xtream_user, server.xtream_pass, 'movie'),
          fetchCategories(server.base_url, server.xtream_user, server.xtream_pass, 'series'),
        ])
        const brandNames = ['netflix', 'disney', 'turkcell', 'apple tv', 'amazon prime', 'hbo', 'hulu', 'paramount', 'blu tv', 'blue tv', 'bein', 'vodafone', 'ttnet', 'milyonlar', 'digiturk', 'd-smart', 'tivibu', 'samsung tv', 'lg tv', 'philips', 'exxen', 'puhu tv', 'gain', 'youtube', 'mubi', 'taboo', 'netd', 'suncity']
        const banned = ['XXX', '18+', 'Adult', 'Yetişkin', 'Porno', 'Sex', ...brandNames]
        const filter = (items: any[]) => items.filter((i: any) => !banned.some(b => (i.category_name || '').toLowerCase().includes(b.toLowerCase())))
        const fvc = filter(vc || [])
        const fsc = filter(sc || [])
        setVodCats(fvc)
        setSeriesCats(fsc)

        // Hero
        const heroCat = fvc.find(c => !isSeriesCategory(c.category_name)) || fvc[0]
        if (heroCat) {
          const heroData = await fetchVods(server.base_url, server.xtream_user, server.xtream_pass, heroCat.category_id).then(r => r || []).catch(() => [])
          setHeroItems(heroData)
        }

        // Ana sayfa 2+2 (tüm öğeler)
        const homeMovieCats = fvc.filter(c => !isSeriesCategory(c.category_name)).slice(0, 2)
        const homeSeriesCats = fsc.slice(0, 2)
        const [m1, m2, s1, s2] = await Promise.all([
          homeMovieCats[0] ? fetchVods(server.base_url, server.xtream_user, server.xtream_pass, homeMovieCats[0].category_id).then(r => r || []).catch(() => []) : Promise.resolve([]),
          homeMovieCats[1] ? fetchVods(server.base_url, server.xtream_user, server.xtream_pass, homeMovieCats[1].category_id).then(r => r || []).catch(() => []) : Promise.resolve([]),
          homeSeriesCats[0] ? fetchSeries(server.base_url, server.xtream_user, server.xtream_pass, homeSeriesCats[0].category_id).then(r => r || []).catch(() => []) : Promise.resolve([]),
          homeSeriesCats[1] ? fetchSeries(server.base_url, server.xtream_user, server.xtream_pass, homeSeriesCats[1].category_id).then(r => r || []).catch(() => []) : Promise.resolve([]),
        ])
        const mv: Record<string, any[]> = {}
        if (homeMovieCats[0]) mv[homeMovieCats[0].category_id] = m1
        if (homeMovieCats[1]) mv[homeMovieCats[1].category_id] = m2
        setVodItems(prev => ({ ...prev, ...mv }))
        const sv: Record<string, any[]> = {}
        if (homeSeriesCats[0]) sv[homeSeriesCats[0].category_id] = s1
        if (homeSeriesCats[1]) sv[homeSeriesCats[1].category_id] = s2
        setSeriesItems(prev => ({ ...prev, ...sv }))
      } catch {}
    })()
  }, [server])

  // Auto-slide every 4s
  useEffect(() => {
    if (heroItems.length < 2) return
    slideTimer.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroItems.length)
    }, 4000)
    return () => clearInterval(slideTimer.current)
  }, [heroItems])

  const loadFullCategory = useCallback(async (catId: string, type: 'movie' | 'series') => {
    if (!server) return
    try {
      const fetcher = type === 'movie' ? fetchVods : fetchSeries
      const items = await fetcher(server.base_url, server.xtream_user, server.xtream_pass, catId)
      const setter = type === 'movie' ? setVodItems : setSeriesItems
      setter(prev => ({ ...prev, [catId]: items || [] }))
    } catch {}
  }, [server])

  // Kategorilere tıklandığında grid açılsın
  const setTab = (t: string) => {
    const sp = new URLSearchParams(params)
    if (t === 'home') sp.delete('tab')
    else sp.set('tab', t)
    if (t === 'movies') {
      const firstCat = filteredVodCats[0]?.category_id
      if (firstCat) { sp.set('cat', firstCat); loadFullCategory(firstCat, 'movie') }
      sp.delete('scat')
    } else if (t === 'series') {
      const firstCat = seriesCats[0]?.category_id
      if (firstCat) { sp.set('scat', firstCat); loadFullCategory(firstCat, 'series') }
      sp.delete('cat')
    } else {
      sp.delete('cat')
      sp.delete('scat')
    }
    setParams(sp, { replace: true })
  }

  // APK'daki birebir kategori adı dönüşümleri
  const categoryNameOverride: Record<string, string> = {
    'TR ✦ Pazartesi Dizi': 'PAZARTESİ DİZİLERİ',
    'TR ✦ Salı Dizi': 'SALI DİZİLERİ',
    'TR ✦ Çarşamba Dizi': 'ÇARŞAMBA DİZİLERİ',
    'TR ✦ Perşembe Dizi': 'PERŞEMBE DİZİLERİ',
    'TR ✦ Cuma Dizi': 'CUMA DİZİLERİ',
    'TR ✦ Cumartesi Dizi': 'CUMARTESİ DİZİLERİ',
    'TR ✦ Pazar Dizi': 'PAZAR DİZİLERİ',
    'TR ✦ SİNEVİZYON 2025/2026': 'SİNEMA ARŞİVİ 2025-2026',
    'TR ✦ SİNEVİZYON 2024/2025': 'SİNEMA ARŞİVİ 2024-2025',
    'TR ✦ SİNEVİZYON 2023/2024': 'SİNEMA ARŞİVİ 2023-2024',
    'TR ✦ SİNEVİZYON 2021/2022': 'SİNEMA ARŞİVİ 2021-2022',
    'TR ✦ SİNETÜRK': 'SİNEMA VE FİLM KÜLLİYATI',
    'TR ✦ 4K SİNEMA': '4K SİNEMA',
    'TR ✦ AKSİYON & MACERA': 'AKSİYON VE MACERA',
    'TR ✦ FANTASTİK & BİLİMKURGU': 'FANTASTİK VE BİLİMKURGU',
    'TR ✦ KORKU & GERİLİM': 'KORKU VE GERİLİM',
    'TR ✦ AŞK & ROMANTİK': 'AŞK VE ROMANTİK',
    'TR ✦ KOMEDİ': 'KOMEDİ',
    'TR ✦ DRAM & TARİH': 'DRAM VE TARİH',
    'TR ✦ KOVBOY & WESTERN FİLMLER': 'KOVBOY VE WESTERN',
    'TR ✦ ÇOCUK & ANİMASYON': 'ÇOCUK VE ANİMASYON',
    'TR ✦ KLASİK & NOSTALJİ FİLM': 'KLASİK VE NOSTALJİ',
    'TR ✦ BoX SeT SINEMA': 'BOX SET FİLMLER',
    'TR ✦ H265 FİLMLER': 'YÜKSEK KALİTE FİLMLER',
    'TR ✦ YEŞİLÇAM': 'YEŞİLÇAM',
    'TR ✦ KEMAL SUNAL': 'KEMAL SUNAL FİLMLERİ',
    'TR ✦ ŞENER ŞEN': 'ŞENER ŞEN FİLMLERİ',
    'TR ✦ ZEKİ & METİN': 'ZEKİ VE METİN FİLMLERİ',
    'TR ✦ KADİR İNANIR': 'KADİR İNANIR FİLMLERİ',
    'TR ✦ CÜNEYT ARKIN': 'CÜNEYT ARKIN FİLMLERİ',
    'TR ✦ SADRİ ALIŞIK': 'SADRİ ALIŞIK FİLMLERİ',
    'TR ✦ TÜRKAN ŞORAY': 'TÜRKAN ŞORAY FİLMLERİ',
    'TR ✦ FERDİ TAYFUR': 'FERDİ TAYFUR FİLMLERİ',
    'TR ✦ YILMAZ GÜNEY': 'YILMAZ GÜNEY FİLMLERİ',
    'TR ✦ TARIK AKAN': 'TARIK AKAN FİLMLERİ',
    'TR ✦ BOLLYWOOD': 'DÜNYA SİNEMASI',
    'TR ✦ JAMES BOND FİLMLER': 'JAMES BOND SERİSİ',
    'TR ✦ BELGESEL FİLM': 'BELGESEL FİLMLER',
    'TR ✦ DİNİ': 'DİNİ İÇERİKLER',
    'EU ✦ MULTI NETFLIX 2025/2026': 'ULUSLARARASI FİLMLER 2022-2026',
    'EU ✦ MULTI NETFLIX 2022/2024': 'ULUSLARARASI FİLMLER 2022-2026',
    'EU ✦ MULTI NETFLIX CRIMINAL & CRIME': 'ULUSLARARASI SUÇ VE POLİSİYE',
    'EU ✦ MULTI NETFLIX ACTION & ADVENTURE': 'ULUSLARARASI AKSİYON VE MACERA',
    'EU ✦ MULTI NETFLIX HORROR & THRILLER': 'ULUSLARARASI KORKU VE GERİLİM',
    'EU ✦ MULTI NETFLIX SC.FI & FANTASY': 'ULUSLARARASI BİLİMKURGU VE FANTASTİK',
    'EU ✦ MULTI NETFLIX COMEDY': 'ULUSLARARASI KOMEDİ',
    'EU ✦ MULTI NETFLIX ROMANTIC': 'ULUSLARARASI ROMANTİK',
    'EU ✦ MULTI NETFLIX DRAMA & HISTORY': 'ULUSLARARASI DRAM VE TARİH',
    'EU ✦ MULTI NETFLIX KIDS MOVIES': 'ULUSLARARASI ÇOCUK VE ANİMASYON',
    'EU ✦ MULTI NETFLIX CHRISTMAS Movies': 'ULUSLARARASI YILBAŞI FİLMLERİ',
    'EU ✦ MULTI NETFLIX DOCUMENTARY': 'ULUSLARARASI BELGESELLER',
    'DE ✦ KINOVISION 2025/2026': 'ALMANCA SİNEMA ARŞİVİ',
    'DE ✦ ACTION & ABENTEUER': 'ALMANCA AKSİYON VE MACERA',
    'DE ✦ KRIMI & THRILLER & MYSTERY': 'ALMANCA POLİSİYE VE GİZEM',
    'DE ✦ HORROR': 'ALMANCA KORKU',
    'DE ✦ SCI-FI & FANTASY': 'ALMANCA BİLİMKURGU VE FANTASTİK',
    'DE ✦ KOMÖDIE': 'ALMANCA KOMEDİ',
    'DE ✦ LIEBESFILME': 'ALMANCA ROMANTİK',
    'DE ✦ DRAMA': 'ALMANCA DRAMA',
    'DE ✦ FAMILIE FILME': 'ALMANCA AİLE FİLMLERİ',
    'DE ✦ KRIEGSFILME': 'ALMANCA SAVAŞ FİLMLERİ',
    'DE ✦ KUNGFU & KARATE': 'ALMANCA KUNG FU VE KARATE',
    'DE ✦ WESTERN': 'ALMANCA WESTERN',
    'DE ✦ BOLLYWOOD FILME': 'ALMANCA DÜNYA SİNEMASI',
    'DE ✦ Legendäre KINOBOX': 'ALMANCA EFSANE KİNOBOX',
    'DE ✦ WEIHNACHTEN FILME': 'ALMANCA YILBAŞI FİLMLERİ',
    'DE ✦ KINDER ANIMATION': 'ALMANCA ÇOCUK VE ANİMASYON',
    'DE ✦ THE COLLECTION': 'ALMANCA SEÇKİ FİLMLER',
    'DE ✦ KLASSIKER': 'ALMANCA NOSTALJİK FİLMLER',
    'DE ✦ DOKU FILME': 'ALMANCA BELGESELLER',
    'NL ✦ ACTIE & MISDAAD': 'HOLLANDACA AKSİYON VE SUÇ',
    'NL ✦ THRILLER & MYSTERY': 'HOLLANDACA GERİLİM VE GİZEM',
    'NL ✦ HORROR': 'HOLLANDACA KORKU',
    'NL ✦ SCI-FI & FANTASIE': 'HOLLANDACA BİLİMKURGU VE FANTASTİK',
    'NL ✦ KOMEDIE': 'HOLLANDACA KOMEDİ',
    'NL ✦ ROMANTIEK': 'HOLLANDACA ROMANTİK',
    'NL ✦ DRAMA & FAMILIE': 'HOLLANDACA DRAM VE AİLE',
    'NL ✦ DOCUMENTAIRE': 'HOLLANDACA BELGESELLER',
    'ALB ✦ KİNEMAJA 2023/2024': 'ARNAVUTÇA SİNEMA ARŞİVİ',
    'ALB ✦ SHQIPTAR': 'ARNAVUTÇA FİLMLER',
    'ALB ✦ FILMAT TURQISHT': 'ARNAVUTÇA TÜRKÇE FİLMLER',
    'ALB ✦ AKSION & AVENTURE': 'ARNAVUTÇA AKSİYON VE MACERA',
    'ALB ✦ FANTAZI & FANTASHKENCE': 'ARNAVUTÇA FANTASTİK VE BİLİMKURGU',
    'ALB ✦ HORROR & THRILLER': 'ARNAVUTÇA KORKU VE GERİLİM',
    'ALB ✦ ANIMASION': 'ARNAVUTÇA ANİMASYON',
    'NO✦ NORDIC SCANDINAVIAN MOVIES': 'İSKANDİNAV VE KUZEY AVRUPA FİLMLERİ',
    'TR ✦ YERLİ GÜNCEL DİZİLER': 'YERLİ GÜNCEL DİZİLER',
    'TR ✦ YERLİ FİNAL DİZİLER': 'YERLİ FİNAL YAPMIŞ DİZİLER',
    'TR ✦ EFSANE HİT DİZİLER': 'EFSANE HİT DİZİLER',
    'TR ✦ YABANCI DUBLAJ DİZİLER': 'YABANCI DUBLAJLI DİZİLER',
    'TR ✦ EXXEN TV DİZİ': 'DİJİTAL PLATFORM DİZİLERİ (GENEL)',
    'TR ✦ HBO MAX & BLUETV DİZİLER': 'DİJİTAL PLATFORM DİZİLERİ (ÖZEL)',
    'TR ✦ APPLE TV': 'DİJİTAL PLATFORM DİZİLERİ (ÖZEL)',
    'TR ✦ TURKCELL TV+': 'DİJİTAL PLATFORM DİZİLERİ (GENEL)',
    'TR ✦ BEIN TOD SERIES': 'DİJİTAL PLATFORM DİZİLERİ (GENEL)',
    'TR ✦ TABİİ TV DİZİLER': 'DİJİTAL PLATFORM DİZİLERİ (GENEL)',
    'TR ✦ GAIN TV DİZİLER': 'DİJİTAL PLATFORM DİZİLERİ (GENEL)',
    'TR ✦ ÇOCUK ANİMASYON DİZİLER': 'ÇOCUK VE ANİMASYON DİZİLERİ',
    'TR ✦ BELGESEL DİZİLER': 'BELGESEL DİZİLER',
    'TR ✦ KOMEDİ & STAND UP & TALK SHOW': 'KOMEDİ, STAND UP VE TALK SHOW',
    'TR ✦ EĞİTİM KURS': 'EĞİTİM VE KURS İÇERİKLERİ',
    'DE ✦ NETFLIX SERIEN': 'ALMANCA DİZİLER (GENEL)',
    'DE ✦ AMAZON PRIME SERIEN': 'ALMANCA DİZİLER (GENEL)',
    'DE ✦ DISNEY+ SERIEN': 'ALMANCA DİZİLER (GENEL)',
    'DE ✦ DISNEY+ KIDS': 'ALMANCA ÇİZGİ FİLM VE ANİMASYON DİZİLERİ',
    'DE ✦ DISNEY+ MARVEL SERIEN': 'ALMANCA DİZİLER (GENEL)',
    'DE ✦ DISNEY+ STAR WARS SERIEN': 'ALMANCA DİZİLER (GENEL)',
    'DE ✦ SKY ORIGINALS SERIEN': 'ALMANCA DİZİLER (GENEL)',
    'DE ✦ APPLE TV SERIEN': 'ALMANCA DİZİLER (GENEL)',
    'DE ✦ PARAMOUNT SERIEN': 'ALMANCA DİZİLER (GENEL)',
    'DE ✦ HBO SERIEN': 'ALMANCA DİZİLER (GENEL)',
    'DE ✦ STARZ SERIEN': 'ALMANCA DİZİLER (GENEL)',
    'DE ✦ JOYN+ SERIEN': 'ALMANCA DİZİLER (GENEL)',
    'DE ✦ HULU SERIEN': 'ALMANCA DİZİLER (GENEL)',
    'DE ✦ RTL+ SERIEN': 'ALMANCA DİZİLER (GENEL)',
    'DE ✦ ACTION & ABENTEUER SERIEN': 'ALMANCA AKSİYON VE MACERA DİZİLERİ',
    'DE ✦ KRIMI & THRILLER SERIEN': 'ALMANCA POLİSİYE VE GERİLİM DİZİLERİ',
    'DE ✦ SyFy & FANTASY SERIEN': 'ALMANCA BİLİMKURGU VE FANTASTİK DİZİLERİ',
    'DE ✦ DRAMA SERIEN': 'ALMANCA DRAMA DİZİLERİ',
    'DE ✦ KOMÖDIE SERIEN': 'ALMANCA KOMEDİ DİZİLERİ',
    'DE ✦ DOKU SERIEN': 'ALMANCA BELGESEL DİZİLERİ',
    'DE ✦ ANIME SERIEN': 'ALMANCA ANİME DİZİLERİ',
    'DE ✦ CARTOONS & ANIMATION SERIEN': 'ALMANCA ÇİZGİ FİLM VE ANİMASYON DİZİLERİ',
    'DE ✦ TV NOW & SHOWS SERIEN': 'ALMANCA TELEVİZYON ŞOVLARI',
    'ALB ✦ SERIALET TURKE': 'ARNAVUTÇA TÜRK DİZİLERİ',
    'ALB ✦ SERIALE TË HUAJA': 'ARNAVUTÇA YABANCI DİZİLER',
    'EX-YU ✦ TURSKE SERIJE': 'BALKAN TÜRK DİZİLERİ',
    'EU ✦ MULTI NETFLIX SERIES': 'ULUSLARARASI DİZİLER',
    'EU ✦ MULTI NETFLIX KIDS SERIES': 'ULUSLARARASI ÇOCUK DİZİLERİ',
    'EU ✦ MULTI AMAZON PRIME SERIES': 'ULUSLARARASI DİZİLER',
    'EU ✦ MULTI DISNEY+ SERIES': 'ULUSLARARASI DİZİLER',
    'EU ✦ MULTI DISNEY+ KIDS SERIES': 'ULUSLARARASI ÇOCUK DİZİLERİ',
  }

  // Yıldız ve özel karakter temizleme
  const cleanCatName = (name: string) => {
    return name.replace(/[★☆✦✧✩✪✫✬✭✮✯✰⭐🌟🌠◆◇◈◉◊○●•¤☆★]/g, ' ').replace(/\s+/g, ' ').trim()
  }

  // APK'daki steamixCategoryName mantığı: önce override map, sonra prefix temizleme
  const trName = (name: string) => {
    const trimmed = name.trim()
    const overridden = categoryNameOverride[trimmed]
    if (overridden) return overridden

    const cleaned = cleanCatName(trimmed)
    if (!cleaned) return name

    // Ülke/yerel önekini kaldır: TR ✦, EU ✦, DE ✦, NL ✦, ALB ✦, NO✦, EX-YU ✦
    const withoutPrefix = cleaned.replace(/^(?:TR|EU|DE|NL|ALB|NO|AL|EX-YU)\s*✦?\s*/i, '').trim()
    if (!withoutPrefix) return cleaned

    return withoutPrefix
  }

  // Kategoriler yüklendiğinde veya tab değiştiğinde ilk kategori otomatik seçilsin
  useEffect(() => {
    if (tab === 'movies' && filteredVodCats.length > 0 && !selectedCat) {
      const firstCat = filteredVodCats[0].category_id
      const sp = new URLSearchParams(params)
      sp.set('cat', firstCat)
      setParams(sp, { replace: true })
      loadFullCategory(firstCat, 'movie')
    }
  }, [tab, filteredVodCats])

  useEffect(() => {
    if (tab === 'series' && seriesCats.length > 0 && !selectedSeriesCat) {
      const firstCat = seriesCats[0].category_id
      const sp = new URLSearchParams(params)
      sp.set('scat', firstCat)
      setParams(sp, { replace: true })
      loadFullCategory(firstCat, 'series')
    }
  }, [tab, seriesCats])

  // Seçili kategori yoksa URL'den güncelle
  useEffect(() => {
    if (tab === 'movies' && activeMovieCat && !vodItems[activeMovieCat]) {
      loadFullCategory(activeMovieCat, 'movie')
    }
  }, [tab, activeMovieCat])
  useEffect(() => {
    if (tab === 'series' && activeSeriesCat && !seriesItems[activeSeriesCat]) {
      loadFullCategory(activeSeriesCat, 'series')
    }
  }, [tab, activeSeriesCat])

  const gotoWatch = (item: any, type: string) => {
    const sp = new URLSearchParams()
    const id = type === 'series' ? item.series_id : item.stream_id
    sp.set('stream_id', id)
    sp.set('type', type)
    if (item.container_extension) sp.set('ext', item.container_extension)
    if (item.stream_icon) sp.set('icon', item.stream_icon)
    if (item.category_id) sp.set('cat', item.category_id)
    navigate(`/watch?${sp}`)
  }

  const gotoDetail = (item: any, type: string) => {
    const sp = new URLSearchParams()
    const id = type === 'series' ? item.series_id : item.stream_id
    sp.set('id', id)
    sp.set('type', type)
    if (item.container_extension) sp.set('ext', item.container_extension)
    if (item.stream_icon) sp.set('icon', item.stream_icon)
    if (item.category_id) sp.set('cat', item.category_id)
    navigate(`/detail?${sp}`)
  }

  const scrollRow = (catId: string, dir: 'left' | 'right') => {
    const el = scrollContainers.current[catId]
    if (!el) return
    const scrollAmount = 160
    el.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' })
  }



  // --- Lightweight card ---
  const renderCard = (item: any, type: string, onClick: (item: any) => void, sizeClass = 'w-36') => {
    const posterSrc = type === 'series' ? (item.cover || item.thumbnail) : item.stream_icon
    const cleanName = (item.name || '').replace(/[✓✔☑✗✘]/g, '')
    return (
      <button key={type === 'series' ? item.series_id : item.stream_id} onClick={() => onClick(item)}
        className={`flex-shrink-0 ${sizeClass} group`}>
        <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 mb-2 relative transition-all duration-300 group-hover:scale-[1.07] group-hover:shadow-[0_0_30px_rgba(0,153,255,0.35)] group-hover:ring-2 group-hover:ring-[#0099ff]/40">
          <Poster src={posterSrc} type={type as any} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-125">
            <div className="w-14 h-14 rounded-full bg-[#0099ff] flex items-center justify-center shadow-[0_0_20px_rgba(0,153,255,0.6)] backdrop-blur-sm">
              <Play className="w-6 h-6 text-white ml-1 fill-white" />
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 truncate group-hover:text-white transition-colors duration-200">{cleanName}</p>
      </button>
    )
  }

  // Determine which categories to show on homepage (2+2)
  const homeMovieCats = vodCats.filter(c => !isSeriesCategory(c.category_name)).slice(0, 2)
  const homeSeriesCats = seriesCats.slice(0, 2)

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <Navbar />
      <div className="pt-16 md:pt-20">
        {/* ANA SAYFA */}
        {tab === 'home' && (
          <div className="pb-20">
            {/* HERO SLAYT - ÖNE ÇIKANLAR */}
            {heroItems.length > 0 && (
              <div className="max-w-5xl mx-auto px-4 md:px-8 mb-6 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-5 bg-[#0099ff] rounded-full" />
                  <h2 className="text-sm font-bold text-white tracking-widest" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    ÖNE <span className="text-[#0099ff]">ÇIKANLAR</span>
                  </h2>
                </div>
                <div className="relative overflow-hidden rounded-2xl shadow-2xl shadow-[#0099ff]/10" style={{ aspectRatio: '21/9' }}>
                  {/* Left arrow */}
                  <button onClick={() => setCurrentSlide(prev => (prev - 1 + heroItems.length) % heroItems.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all backdrop-blur-sm">
                    <ArrowLeftIcon className="w-5 h-5" />
                  </button>
                  {/* Right arrow */}
                  <button onClick={() => setCurrentSlide(prev => (prev + 1) % heroItems.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all backdrop-blur-sm">
                    <ArrowRightIcon className="w-5 h-5" />
                  </button>
                  {heroItems.map((item, i) => (
                    <div key={`${item.stream_id}-${i}`}
                      className="absolute inset-0 transition-all duration-1000 ease-in-out"
                      style={{
                        opacity: i === currentSlide % heroItems.length ? 1 : 0,
                        zIndex: i === currentSlide % heroItems.length ? 1 : 0,
                        transform: `scale(${i === currentSlide % heroItems.length ? 1 : 1.05})`,
                      }}>
                      <Poster src={item.stream_icon} type="movie" className="object-top" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/60 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                        <p className="text-white font-bold text-xl md:text-3xl mb-2 drop-shadow-xl">{item.name}</p>
                        <p className="text-gray-300 text-sm mb-4 line-clamp-2 max-w-xl drop-shadow-lg">
                          {item.name} - Şimdi izleyin. {item.name} ve binlerce yapım Steamix TV'de izleyin
                        </p>
                        <div className="flex items-center gap-3">
                          <button onClick={() => gotoWatch(item, 'movie')}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#0099ff] text-white text-sm font-semibold hover:bg-[#0088ee] transition-all shadow-lg hover:shadow-[#0099ff]/30">
                            <Play className="w-4 h-4 fill-white" />Oynat
                          </button>
                          <button onClick={() => gotoDetail(item, 'movie')}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-all backdrop-blur-sm">
                            <Info className="w-4 h-4" />Detaylar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2 FİLM KATEGORİSİ */}
            {homeMovieCats.map((cat, idx) => {
              const items = vodItems[cat.category_id]
              return (
                <div key={cat.category_id} className={`px-4 md:px-8 ${idx > 0 ? 'mb-6' : 'mb-6'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-white">{trName(cat.category_name)}</h2>
                    <div className="flex items-center gap-1">
                      <button onClick={() => scrollRow(cat.category_id, 'left')}
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-[#0099ff] hover:shadow-[0_0_15px_rgba(0,153,255,0.5)] flex items-center justify-center transition-all duration-300">
                        <ArrowLeftIcon className="w-4 h-4 text-white" />
                      </button>
                      <button onClick={() => scrollRow(cat.category_id, 'right')}
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-[#0099ff] hover:shadow-[0_0_15px_rgba(0,153,255,0.5)] flex items-center justify-center transition-all duration-300">
                        <ArrowRightIcon className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                  {items && items.length > 0 ? (
                    <div ref={el => { scrollContainers.current[cat.category_id] = el; }} className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                      {items.map((item: any) => renderCard(item, 'movie', (it) => gotoDetail(it, 'movie')))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-4"><Loader2 className="w-4 h-4 text-[#0099ff] animate-spin" /></div>
                  )}
                </div>
              )
            })}

            {/* 2 DİZİ KATEGORİSİ */}
            {homeSeriesCats.map((cat, idx) => {
              const items = seriesItems[cat.category_id]
              return (
                <div key={cat.category_id} className={`px-4 md:px-8 ${idx < homeSeriesCats.length - 1 ? 'mb-6' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-white">{trName(cat.category_name)}</h2>
                    <div className="flex items-center gap-1">
                      <button onClick={() => scrollRow(cat.category_id, 'left')}
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-[#0099ff] hover:shadow-[0_0_15px_rgba(0,153,255,0.5)] flex items-center justify-center transition-all duration-300">
                        <ArrowLeftIcon className="w-4 h-4 text-white" />
                      </button>
                      <button onClick={() => scrollRow(cat.category_id, 'right')}
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-[#0099ff] hover:shadow-[0_0_15px_rgba(0,153,255,0.5)] flex items-center justify-center transition-all duration-300">
                        <ArrowRightIcon className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                  {items && items.length > 0 ? (
                    <div ref={el => { scrollContainers.current[cat.category_id] = el; }} className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                      {items.map((item: any) => renderCard(item, 'series', (it) => gotoDetail(it, 'series')))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-4"><Loader2 className="w-4 h-4 text-[#0099ff] animate-spin" /></div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* LIVE TV TAB */}
        {tab === 'live' && <LiveTvScreen categories={rotCategories} selectedCat={selectedLiveCat} onSelectCategory={(id) => { const sp = new URLSearchParams(params); sp.set('lcat', id); setParams(sp, { replace: true }) }} />}

        {/* MOVIES TAB */}
        {tab === 'movies' && (
          <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]">
            {/* Sol panel - kategoriler */}
            <div className="w-48 md:w-60 shrink-0 border-r border-white/10 overflow-y-auto pt-3 pb-4 scrollbar-hide">
              <div className="px-3 md:px-4 pb-2 mb-2 border-b border-white/10">
                <h3 className="text-xs font-semibold text-[#0099ff] tracking-widest uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>Film Kategorileri</h3>
              </div>
              {filteredVodCats.map(cat => (
                <button key={cat.category_id}
                  onClick={() => { const sp = new URLSearchParams(params); sp.set('cat', cat.category_id); sp.delete('scat'); setParams(sp, { replace: true }); loadFullCategory(cat.category_id, 'movie') }}
                  className={`w-full text-left px-3 md:px-4 py-2.5 text-base md:text-lg transition-colors uppercase tracking-wide ${
                    selectedCat === cat.category_id
                      ? 'bg-[#0099ff]/10 text-white border-r-2 border-[#0099ff] font-bold'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}>
                  {trName(cat.category_name)}
                </button>
              ))}
            </div>
            {/* Sağ panel - içerik */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {showMovieCategory && activeMovieCat ? (
                <MovieCategoryGrid selectedCat={activeMovieCat} categoryName={trName(filteredVodCats.find((c: any) => c.category_id === activeMovieCat)?.category_name || 'Filmler')} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm px-4">Yükleniyor...</div>
              )}
            </div>
          </div>
        )}

        {/* SERIES TAB */}
        {tab === 'series' && (
          <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]">
            {/* Sol panel - kategoriler */}
            <div className="w-48 md:w-60 shrink-0 border-r border-white/10 overflow-y-auto pt-3 pb-4 scrollbar-hide">
              <div className="px-3 md:px-4 pb-2 mb-2 border-b border-white/10">
                <h3 className="text-xs font-semibold text-[#0099ff] tracking-widest uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>Dizi Kategorileri</h3>
              </div>
              {seriesCats.map(cat => (
                <button key={cat.category_id}
                  onClick={() => { const sp = new URLSearchParams(params); sp.set('scat', cat.category_id); sp.delete('cat'); setParams(sp, { replace: true }); loadFullCategory(cat.category_id, 'series') }}
                  className={`w-full text-left px-3 md:px-4 py-2.5 text-base md:text-lg transition-colors uppercase tracking-wide ${
                    selectedSeriesCat === cat.category_id
                      ? 'bg-[#0099ff]/10 text-white border-r-2 border-[#0099ff] font-bold'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}>
                  {trName(cat.category_name)}
                </button>
              ))}
            </div>
            {/* Sağ panel - içerik */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {showSeriesCategory && activeSeriesCat ? (
                <SeriesCategoryGrid selectedCat={activeSeriesCat} categoryName={trName(seriesCats.find((c: any) => c.category_id === activeSeriesCat)?.category_name || 'Diziler')} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm px-4">Yükleniyor...</div>
              )}
            </div>
          </div>
        )}

        {/* FAVORİLER TAB */}
        {tab === 'favorites' && (
          <FavoritesSection />
        )}

        {/* SEARCH TAB */}
        {tab === 'search' && (
          <div className="px-4 md:px-8 pb-8 pt-4">
            <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>Arama</h2>
            <div className="flex gap-2 mb-6">
              <input type="text" placeholder="Kanal, film veya dizi ara..." className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-[#0099ff]/50" />
            </div>
            <button onClick={() => { setTab('live') }} className="text-[#0099ff] text-sm hover:underline">Canlı TV kanallarına göz at</button>
          </div>
        )}
      </div>
    </div>
  )
}

function MovieCategoryGrid({ selectedCat, categoryName }: any) {
  const { server } = useAuth()
  const navigate = useNavigate()
  const [allItems, setAllItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(50)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const visible = allItems.slice(0, offset)
  const hasMore = visible.length < allItems.length

  useEffect(() => {
    if (!server) return
    setLoading(true)
    setOffset(50)
    fetchVods(server.base_url, server.xtream_user, server.xtream_pass, selectedCat)
      .then(data => setAllItems(data || []))
      .catch(() => setAllItems([]))
      .finally(() => setLoading(false))
  }, [server, selectedCat])

  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setOffset(prev => prev + 50)
    }, { rootMargin: '200px' })
    obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [hasMore])

  const handleDetail = (item: any) => {
    const sp = new URLSearchParams({ id: String(item.stream_id), type: 'movie', cat: selectedCat })
    if (item.stream_icon) sp.set('icon', item.stream_icon)
    if (item.container_extension) sp.set('ext', item.container_extension)
    navigate(`/detail?${sp}`)
  }

  return (
    <div className="px-4 md:px-6 pt-3">
      <h2 className="text-base font-bold text-white mb-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>
        {categoryName}
      </h2>
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-[#0099ff] animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {visible.map((s: any) => (
              <button key={s.stream_id} onClick={() => handleDetail(s)} className="group">
                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 mb-2 relative transition-all duration-300 group-hover:scale-[1.07] group-hover:shadow-[0_0_30px_rgba(0,153,255,0.35)] group-hover:ring-2 group-hover:ring-[#0099ff]/40">
                  <Poster src={s.stream_icon} type="movie" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-125">
                    <div className="w-14 h-14 rounded-full bg-[#0099ff] flex items-center justify-center shadow-[0_0_20px_rgba(0,153,255,0.6)] backdrop-blur-sm">
                      <Play className="w-6 h-6 text-white ml-1 fill-white" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 truncate group-hover:text-white transition-colors duration-150 text-left">{s.name}</p>
              </button>
            ))}
          </div>
          <div ref={sentinelRef} className="h-10" />
          {hasMore && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-[#0099ff] animate-spin" /></div>}
        </>
      )}
    </div>
  )
}

function SeriesCategoryGrid({ selectedCat, categoryName }: any) {
  const { server } = useAuth()
  const [allItems, setAllItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(50)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const visible = allItems.slice(0, offset)
  const hasMore = visible.length < allItems.length

  useEffect(() => {
    if (!server) return
    setLoading(true)
    fetchSeries(server.base_url, server.xtream_user, server.xtream_pass, selectedCat)
      .then(data => setAllItems(data || []))
      .catch(() => setAllItems([]))
      .finally(() => setLoading(false))
  }, [server, selectedCat])

  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setOffset(prev => prev + 50)
    }, { rootMargin: '200px' })
    obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [hasMore])

  const navigate = useNavigate()
  const handleDetail = (item: any) => {
    const sp = new URLSearchParams({ id: String(item.series_id), type: 'series', cat: selectedCat })
    if (item.cover || item.thumbnail) sp.set('icon', item.cover || item.thumbnail)
    navigate(`/detail?${sp}`)
  }

  return (
    <div className="px-4 md:px-6 pt-3">
      <h2 className="text-base font-bold text-white mb-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>
        {categoryName}
      </h2>
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-[#0099ff] animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {visible.map((s: any) => (
              <button key={s.series_id} onClick={() => handleDetail(s)} className="group">
                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 mb-2 relative transition-all duration-300 group-hover:scale-[1.07] group-hover:shadow-[0_0_30px_rgba(20,184,166,0.35)] group-hover:ring-2 group-hover:ring-[#14b8a6]/40">
                  <Poster src={s.cover || s.thumbnail} type="series" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-125">
                    <div className="w-14 h-14 rounded-full bg-[#14b8a6] flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.6)] backdrop-blur-sm">
                      <Play className="w-6 h-6 text-white ml-1 fill-white" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 truncate group-hover:text-white transition-colors duration-150 text-left">{s.name}</p>
              </button>
            ))}
          </div>
          <div ref={sentinelRef} className="h-10" />
          {hasMore && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-[#0099ff] animate-spin" /></div>}
        </>
      )}
    </div>
  )
}

function FavoritesSection() {
  const navigate = useNavigate()
  const [favs, setFavs] = useState<FavoriteItem[]>([])
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    setFavs(getFavorites())
  }, [])

  const handleRemove = (id: number, type: string) => {
    removeFavorite(id, type)
    setFavs(getFavorites())
  }

  const toggleSelect = (key: string) => {
    setSelected(prev => {
      const copy = new Set(prev)
      if (copy.has(key)) copy.delete(key); else copy.add(key)
      return copy
    })
  }

  const handleBulkDelete = () => {
    selected.forEach(key => {
      const [type, idStr] = key.split('-')
      const id = parseInt(idStr)
      if (!isNaN(id)) removeFavorite(id, type)
    })
    setSelected(new Set())
    setSelectMode(false)
    setFavs(getFavorites())
  }

  if (favs.length === 0) {
    return (
      <div className="px-4 md:px-8 pb-8 pt-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1 h-5 bg-[#0099ff] rounded-full" />
          <h2 className="text-sm font-bold text-white tracking-widest" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            FAVORİ<span className="text-[#0099ff]">LER</span>
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <Heart className="w-12 h-12 mb-3 text-gray-600" />
          <p className="text-sm">Henüz favori eklenmemiş</p>
          <p className="text-xs text-gray-600 mt-1">Film veya dizi detay sayfasından kalbe basarak ekleyebilirsiniz</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 md:px-8 pb-8 pt-4">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-1 h-5 bg-[#0099ff] rounded-full" />
        <h2 className="text-sm font-bold text-white tracking-widest" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          FAVORİ<span className="text-[#0099ff]">LER</span>
        </h2>
        <span className="text-xs text-gray-500 ml-1">({favs.length})</span>
        <div className="ml-auto flex gap-2">
          {selectMode ? (
            <>
              <button onClick={handleBulkDelete}
                className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/30 transition-all">
                {selected.size > 0 ? `${selected.size} Sil` : 'Seçili yok'}
              </button>
              <button onClick={() => { setSelectMode(false); setSelected(new Set()) }}
                className="px-3 py-1.5 rounded-xl bg-white/10 text-gray-400 text-xs font-semibold hover:text-white transition-all">
                İptal
              </button>
            </>
          ) : (
            <button onClick={() => setSelectMode(true)}
              className="px-3 py-1.5 rounded-xl bg-white/10 text-gray-400 text-xs font-semibold hover:text-white transition-all">
              Seç
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
        {favs.map((item) => {
          const key = `${item.type}-${item.id}`
          const isSelected = selected.has(key)
          return (
            <button key={key} onClick={() => {
              if (selectMode) { toggleSelect(key); return }
              const sp = new URLSearchParams({ id: String(item.id), type: item.type })
              if (item.image) sp.set('icon', item.image)
              navigate(`/detail?${sp}`)
            }} className="group">
              <div className={`aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 mb-2 relative transition-all duration-300 ${selectMode ? '' : 'group-hover:scale-[1.07] group-hover:shadow-[0_0_30px_rgba(0,153,255,0.35)] group-hover:ring-2 group-hover:ring-[#0099ff]/40'} ${isSelected ? 'ring-2 ring-red-500' : ''}`}>
                <img src={item.image} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).style.background = '#1e293b' }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {selectMode ? (
                  <div className="absolute top-2 right-2 z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${isSelected ? 'bg-red-500 text-white' : 'bg-black/60 text-white'}`}>
                      {isSelected ? '✓' : '○'}
                    </div>
                  </div>
                ) : (
                  <div className="absolute top-2 right-2 z-10">
                    <div onClick={(e) => { e.stopPropagation(); handleRemove(item.id, item.type) }}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer bg-red-500/20 hover:bg-red-500/40">
                      <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 truncate group-hover:text-white transition-colors text-left">{item.name}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
