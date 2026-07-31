import { useEffect, useState, useCallback, useRef, useMemo, memo } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { fetchCategories, fetchVods, fetchSeries, fetchAllVods, fetchAllSeries, posterUrl, proxyUrl } from '@/lib/supabase'
import { parseRotationData } from '@/lib/rotation'
import { getFavorites, removeFavorite } from '@/lib/favorites'
import type { FavoriteItem } from '@/lib/favorites'
import Navbar from '@/sections/Navbar'
const MemoNavbar = memo(Navbar)
import LiveTvScreen from '@/sections/LiveTvScreen'
import GamesScreen from '@/sections/GamesScreen'
import Poster from '@/components/Poster'
import { Loader2, Play, Info, Heart, Lock } from 'lucide-react'

function parseTitle(raw: string) {
  const m = raw.match(/^(.+?)\s*[\(\[{]?\s*(\d{4})\s*[\)\]}]?\s*(.*)$/)
  if (m) return { title: m[1].trim(), year: m[2], extra: m[3].replace(/^[\s\-—–,;:]+/, '') }
  return { title: raw, year: '', extra: '' }
}

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
  const location = useLocation()
  const loadingRef = useRef<Record<string, boolean>>({})

  const rotData = useMemo(() => parseRotationData(), [])
  const rotCategories = rotData.categories

  const [vodCats, setVodCats] = useState<any[]>([])
  const [seriesCats, setSeriesCats] = useState<any[]>([])
  const [vodItems, setVodItems] = useState<Record<string, any[]>>({})
  const [seriesItems, setSeriesItems] = useState<Record<string, any[]>>({})
  const [allVods, setAllVods] = useState<any[] | null>(null)
  const [allSeries, setAllSeries] = useState<any[] | null>(null)
  const scrollContainers = useRef<Record<string, HTMLDivElement | null>>({})

  const [adultPassword, setAdultPassword] = useState('')
  const [adultPrompt, setAdultPrompt] = useState<{ catId: string; type: 'movie' | 'series' } | null>(null)
  const isAdultCat = (name: string) => {
    const n = name.toLowerCase()
    return n.includes('adult') || n.includes('yetişkin') || n.includes('18+') || n.includes('xxx') || n.includes('porno') || n.includes('erotik')
  }
  const adultCatIds = useMemo(() => {
    const ids = new Set<string>()
    vodCats.forEach(c => { if (isAdultCat(c.category_name)) ids.add(c.category_id) })
    seriesCats.forEach(c => { if (isAdultCat(c.category_name)) ids.add(c.category_id) })
    return ids
  }, [vodCats, seriesCats])
  const adultCover = '/adult-placeholder.jpg'

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ movies: any[]; series: any[] }>({ movies: [], series: [] })
  const [searching, setSearching] = useState(false)

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || !server) { setSearchResults({ movies: [], series: [] }); return }
    setSearching(true)
    const ql = q.toLowerCase()
    const startMs = Date.now()
    const [mv, sr] = await Promise.all([
      allVods ? Promise.resolve(allVods) : fetchAllVods(server.base_url, server.xtream_user, server.xtream_pass).then(r => { setAllVods(r || []); return r || [] }),
      allSeries ? Promise.resolve(allSeries) : fetchAllSeries(server.base_url, server.xtream_user, server.xtream_pass).then(r => { setAllSeries(r || []); return r || [] }),
    ])
    setSearchResults({
      movies: (mv || []).filter((i: any) => i.name?.toLowerCase().includes(ql)),
      series: (sr || []).filter((i: any) => i.name?.toLowerCase().includes(ql) && hasPoster(i, 'series')),
    })
    const elapsed = Date.now() - startMs
    const minShow = 3000
    if (elapsed < minShow) await new Promise(r => setTimeout(r, minShow - elapsed))
    setSearching(false)
  }, [server, allVods, allSeries])

  useEffect(() => {
    if (!searchQuery.trim()) return
    const t = setTimeout(() => doSearch(searchQuery), 400)
    return () => clearTimeout(t)
  }, [searchQuery])

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
      navigate('/dashboard', { replace: true })
    }
  }, [tab, liveDisabled])

  const seriesKeywords = ['pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi', 'pazar', 'haftanın', 'günün dizisi', 'yerli dizi', 'yabancı dizi']
  const isSeriesCategory = (name: string) => seriesKeywords.some(k => name.toLowerCase().includes(k))

  const filteredVodCats = useMemo(() => vodCats.filter(vc => {
    const vcn = vc.category_name.toLowerCase()
    if (isSeriesCategory(vcn)) return false
    return true
  }), [vodCats])

  const twdCat = { category_id: '__twd__', category_name: 'THE WALKING DEAD' }
  const allSeriesCats = useMemo(() => [twdCat, ...seriesCats], [seriesCats])
  const displaySeriesCats = useMemo(() => allSeriesCats.slice(0, -3), [allSeriesCats])

  const showMovieCategory = tab === 'movies' && (selectedCat || filteredVodCats.length > 0)
  const showSeriesCategory = tab === 'series' && (selectedSeriesCat || allSeriesCats.length > 1)
  const activeMovieCat = selectedCat || filteredVodCats[0]?.category_id || ''
  const activeSeriesCat = selectedSeriesCat || allSeriesCats[0]?.category_id || ''

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
        const banned = [...brandNames]
        const filter = (items: any[]) => items.filter((i: any) => !banned.some(b => (i.category_name || '').toLowerCase().includes(b.toLowerCase())))
        const fvc = filter(vc || [])
        const fsc = filter(sc || [])
        setVodCats(fvc)
        setSeriesCats(fsc)

        // Hero
        const heroCat = fvc.find(c => !isSeriesCategory(c.category_name)) || fvc[0]
        if (heroCat) {
          const heroData = await fetchVods(server.base_url, server.xtream_user, server.xtream_pass, heroCat.category_id).then(r => (r || []).filter((i: any) => hasPoster(i, 'movie'))).catch(() => [])
          setHeroItems(heroData)
        }

        // Ana sayfa satırları: 1) GÜNCELLENEN FİLMLER 2) YERLİ GÜNCEL DİZİLER 3) ikinci film 4) ikinci dizi
        const homeMovieCats = fvc.filter(c => !isSeriesCategory(c.category_name)).slice(0, 2)
        const homeSeriesCats = fsc.slice(0, 2)
        const ygdCat = fsc.find((c: any) => trName(c.category_name) === 'YERLİ GÜNCEL DİZİLER')
        const filterM = (r: any[]) => (r || []).filter((i: any) => hasPoster(i, 'movie'))
        const filterS = (r: any[]) => (r || []).filter((i: any) => hasPoster(i, 'series'))
        const [m1, m2, s1, s2, ygd] = await Promise.all([
          homeMovieCats[0] ? fetchVods(server.base_url, server.xtream_user, server.xtream_pass, homeMovieCats[0].category_id).then(filterM).catch(() => []) : Promise.resolve([]),
          homeMovieCats[1] ? fetchVods(server.base_url, server.xtream_user, server.xtream_pass, homeMovieCats[1].category_id).then(filterM).catch(() => []) : Promise.resolve([]),
          homeSeriesCats[0] ? fetchSeries(server.base_url, server.xtream_user, server.xtream_pass, homeSeriesCats[0].category_id).then(filterS).catch(() => []) : Promise.resolve([]),
          homeSeriesCats[1] ? fetchSeries(server.base_url, server.xtream_user, server.xtream_pass, homeSeriesCats[1].category_id).then(filterS).catch(() => []) : Promise.resolve([]),
          ygdCat ? fetchSeries(server.base_url, server.xtream_user, server.xtream_pass, ygdCat.category_id).then(filterS).catch(() => []) : Promise.resolve([]),
        ])
        const mv: Record<string, any[]> = {}
        if (homeMovieCats[0]) mv[homeMovieCats[0].category_id] = m1
        if (homeMovieCats[1]) mv[homeMovieCats[1].category_id] = m2
        setVodItems(prev => ({ ...prev, ...mv }))
        const sv: Record<string, any[]> = {}
        if (homeSeriesCats[0]) sv[homeSeriesCats[0].category_id] = s1
        if (homeSeriesCats[1]) sv[homeSeriesCats[1].category_id] = s2
        if (ygdCat) sv[ygdCat.category_id] = ygd
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

  const hasPoster = (item: any, type: 'movie' | 'series') => {
    const valid = (v: any) => {
      if (!v || typeof v !== 'string') return false
      const t = v.trim()
      if (t.length === 0) return false
      if (t === 'null' || t === 'undefined' || t === '/' || t === '-') return false
      return true
    }
    if (type === 'series') return valid(item.cover_big) || valid(item.movie_image) || valid(item.cover) || valid(item.thumbnail)
    return valid(item.cover_big) || valid(item.stream_icon)
  }

  const loadFullCategory = useCallback(async (catId: string, type: 'movie' | 'series') => {
    if (!server) return
    const loadingKey = type + '-' + catId
    if (loadingRef.current[loadingKey]) return
    loadingRef.current[loadingKey] = true
    try {
      const matchCat = (item: any, id: string) => {
        const cid = item.category_id
        if (cid != null && String(cid).trim() !== '' && String(cid) !== '0' && String(cid) === id) return true
        return item.category_ids?.includes(Number(id))
      }
      const fetchAllCatsSequential = async (type2: string): Promise<any[]> => {
        const cats = type2 === 'movie' ? vodCats : seriesCats
        const fetcher = type2 === 'movie' ? fetchVods : fetchSeries
        const idField = type2 === 'movie' ? 'stream_id' : 'series_id'
        const all: any[] = []
        const seen = new Set<number>()
        for (let i = 0; i < cats.length; i++) {
          if (!cats[i]?.category_id) continue
          try {
            const chunk = await fetcher(server.base_url, server.xtream_user, server.xtream_pass, cats[i].category_id)
            if (Array.isArray(chunk)) {
              for (const item of chunk) {
                const k = Number((item as any)[idField])
                if (!seen.has(k)) { seen.add(k); all.push(item) }
              }
            }
          } catch {}
        }
        return all
      }
      const skipPoster = adultCatIds.has(catId)
      if (type === 'movie') {
        if (allVods) {
          setVodItems(prev => ({ ...prev, [catId]: allVods.filter((i: any) => matchCat(i, catId) && (skipPoster || hasPoster(i, 'movie'))) }))
          return
        }
        let items = await fetchAllVods(server.base_url, server.xtream_user, server.xtream_pass)
        if (!items || items.length === 0) {
          items = await fetchAllCatsSequential('movie')
        }
        const matched = (items || []).filter((i: any) => matchCat(i, catId) && (skipPoster || hasPoster(i, 'movie')))
        setAllVods(items || [])
        setVodItems(prev => ({ ...prev, [catId]: matched }))
      } else {
        if (catId === '__twd__') return
        if (allSeries) {
          setSeriesItems(prev => ({ ...prev, [catId]: allSeries.filter((i: any) => matchCat(i, catId) && (skipPoster || hasPoster(i, 'series'))) }))
          return
        }
        let items = await fetchAllSeries(server.base_url, server.xtream_user, server.xtream_pass)
        if (!items || items.length === 0) {
          items = await fetchAllCatsSequential('series')
        }
        const matched = (items || []).filter((i: any) => matchCat(i, catId) && (skipPoster || hasPoster(i, 'series')))
        setAllSeries(items || [])
        setSeriesItems(prev => ({ ...prev, [catId]: matched }))
      }
    } catch {} finally {
      loadingRef.current[loadingKey] = false
    }
  }, [server, allVods, allSeries, vodCats, seriesCats, adultCatIds])

  // Kategorilere tıklandığında grid açılsın
  const setTab = (t: string) => {
    const sp = new URLSearchParams(location.search)
    if (t === 'home') sp.delete('tab')
    else sp.set('tab', t)
    if (t === 'movies') {
      const firstCat = filteredVodCats[0]?.category_id
      if (firstCat) { sp.set('cat', firstCat); loadFullCategory(firstCat, 'movie') }
      sp.delete('scat')
    } else if (t === 'series') {
      const firstCat = allSeriesCats[0]?.category_id
      if (firstCat) { sp.set('scat', firstCat); loadFullCategory(firstCat, 'series') }
      sp.delete('cat')
    } else {
      sp.delete('cat')
      sp.delete('scat')
    }
    navigate('/dashboard?' + sp.toString(), { replace: true })
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
    'TR ✦ SİNEVİZYON 2025/2026': 'GÜNCELLENEN FİLMLER',
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
    'TR ✦ TURKCELL TV+': 'TR HOLLYWOOD DİZİLERİ',
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
    'EU ✦ MULTI DISNEY+ SERIES': 'TR HOLLYWOOD DİZİLERİ II',
    'EU ✦ MULTI DISNEY+ KIDS SERIES': 'ULUSLARARASI ÇOCUK DİZİLERİ',
    'ADULT +18 ✦ 4K UHD': 'YETİŞKİN +18 4K ULTRA HD',
    'ADULT+ 18 ✦ AMATEUR': 'YETİŞKİN +18 AMATÖR',
    'ADULT +18 ✦ ANAL': 'YETİŞKİN +18 ANAL',
    'ADULT +18 ✦ ASIAN': 'YETİŞKİN +18 ASYA',
    'ADULT +18 ✦ BLACK': 'YETİŞKİN +18 SİYAH',
    'ADULT +18 ✦ BIG ASS': 'YETİŞKİN +18 İRİ POPO',
    'ADULT +18 ✦ BIG TITS': 'YETİŞKİN +18 BÜYÜK GÖĞÜS',
    'ADULT +18 ✦ EROTICA FILM': 'YETİŞKİN +18 EROTİK FİLMLER',
    'ADULT +18 ✦ FAKE HUB': 'YETİŞKİN +18 AMATÖR EV',
    'ADULT +18 ✦ GROUPS': 'YETİŞKİN +18 GRUP',
    'ADULT +18 ✦ HARDCORE': 'YETİŞKİN +18 SERT',
    'ADULT +18 ✦ LESBIAN': 'YETİŞKİN +18 LEZBİYEN',
    'ADULT +18 ✦ MASSAGE': 'YETİŞKİN +18 MASAJ',
    'ADULT +18 ✦ MILF': 'YETİŞKİN +18 OLGUN',
    'ADULT +18 ✦ PUBLIC': 'YETİŞKİN +18 HALK',
    'ADULT +18 ✦ TEEN': 'YETİŞKİN +18 GENÇ',
    'ADULT +18 ✦ TURKISH SUB.': 'YETİŞKİN +18 TÜRKÇE ALTYAZILI',
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

  const proxyImg = (url: string) => {
    if (!url) return url
    if (url.startsWith('/t/p/')) return `https://image.tmdb.org${url}`
    const path = url.replace(/^https?:\/\/[^\/]+/, '')
    if (path.startsWith('/t/p/')) return `https://image.tmdb.org${path}`
    if (url.startsWith('http://') && server?.base_url) return proxyUrl(server.base_url, path)
    if (url.startsWith('http://')) return url.replace('http://', 'https://')
    return url
  }

  // Kategoriler yüklendiğinde veya tab değiştiğinde ilk kategori otomatik seçilsin
  useEffect(() => {
    if (tab === 'movies' && filteredVodCats.length > 0 && !selectedCat) {
      const firstCat = filteredVodCats[0].category_id
      navigate('/dashboard?tab=movies&cat=' + firstCat, { replace: true })
      loadFullCategory(firstCat, 'movie')
    }
  }, [tab, filteredVodCats])

  useEffect(() => {
    if (tab === 'series' && allSeriesCats.length > 1 && !selectedSeriesCat) {
      const firstCat = allSeriesCats[0].category_id
      navigate('/dashboard?tab=series&scat=' + firstCat, { replace: true })
      if (firstCat !== '__twd__') loadFullCategory(firstCat, 'series')
    }
  }, [tab, allSeriesCats])

  // Seçili kategori yoksa URL'den güncelle
  useEffect(() => {
    if (tab === 'movies' && activeMovieCat && !vodItems[activeMovieCat]) {
      loadFullCategory(activeMovieCat, 'movie')
    }
  }, [tab, activeMovieCat])
  useEffect(() => {
    if (tab === 'series' && activeSeriesCat && !seriesItems[activeSeriesCat]) {
      if (activeSeriesCat === '__twd__' && server) {
        fetchAllSeries(server.base_url, server.xtream_user, server.xtream_pass).then(all => {
          const twd = (all || []).filter((s: any) => s.name?.toLowerCase().includes('the walking dead'))
          setSeriesItems(prev => ({ ...prev, '__twd__': twd }))
        })
      } else {
        loadFullCategory(activeSeriesCat, 'series')
      }
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
    if (item.name) sp.set('name', item.name.replace(/[✓✔☑✗✘]/g, ''))
    navigate(`/detail?${sp}`)
  }

  const scrollRow = (catId: string, dir: 'left' | 'right') => {
    const el = scrollContainers.current[catId]
    if (!el) return
    const scrollAmount = 160
    el.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' })
  }



  // --- Lightweight card ---
  const renderCard = (item: any, type: string, onClick: (item: any) => void, sizeClass = 'w-36', isNew = false) => {
    const posterSrc = proxyImg(type === 'series' ? (item.cover_big || item.movie_image || item.cover || item.thumbnail) : (item.cover_big || item.stream_icon))
    const cleanName = (item.name || '').replace(/[✓✔☑✗✘]/g, '')
    return (
      <button key={type === 'series' ? item.series_id : item.stream_id} onClick={() => onClick(item)}
        className={`flex-shrink-0 ${sizeClass} group`}>
        <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 mb-2 relative transition-all duration-300 group-hover:scale-[1.07] group-hover:shadow-[0_0_30px_rgba(0,153,255,0.35)] group-hover:ring-2 group-hover:ring-[#0099ff]/40">
          <Poster src={posterSrc} type={type as any} />
          {isNew && (
            <div className="absolute top-1.5 left-1.5 z-10 px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#ff2d55] to-[#ff8c42] shadow-[0_0_16px_rgba(255,45,85,0.9)] border border-white/30">
              <span className="text-[10px] font-black text-white tracking-widest drop-shadow" style={{ fontFamily: 'Orbitron, sans-serif' }}>YENİ</span>
            </div>
          )}
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
  const homeMovieCats = useMemo(() => filteredVodCats.filter(c => !isSeriesCategory(c.category_name)).slice(0, 2), [filteredVodCats])
  const homeSeriesCats = useMemo(() => seriesCats.slice(0, 2), [seriesCats])
  const ygdHomeCat = useMemo(() => seriesCats.find((c: any) => trName(c.category_name) === 'YERLİ GÜNCEL DİZİLER'), [seriesCats])
  const homeRows = useMemo(() => {
    const rows: { cat: any; type: 'movie' | 'series' }[] = []
    if (homeMovieCats[0]) rows.push({ cat: homeMovieCats[0], type: 'movie' })
    if (ygdHomeCat) rows.push({ cat: ygdHomeCat, type: 'series' })
    if (homeMovieCats[1]) rows.push({ cat: homeMovieCats[1], type: 'movie' })
    homeSeriesCats.filter(c => c.category_id !== ygdHomeCat?.category_id).forEach(cat => rows.push({ cat, type: 'series' }))
    return rows
  }, [homeMovieCats, homeSeriesCats, ygdHomeCat])

  const navCategoryName = useMemo(() => {
    if (tab === 'movies' && selectedCat) {
      const cat = filteredVodCats.find(c => c.category_id === selectedCat)
      return cat ? trName(cat.category_name) : ''
    }
    if (tab === 'series' && selectedSeriesCat) {
      const cat = allSeriesCats.find(c => c.category_id === selectedSeriesCat)
      return cat ? trName(cat.category_name) : ''
    }
    return ''
  }, [tab, selectedCat, selectedSeriesCat, filteredVodCats, allSeriesCats])

  return (
    <>
    <div className="min-h-screen bg-[#0f172a]">
      <MemoNavbar categoryName={navCategoryName} />
      <div className="pt-16 md:pt-20">
        {/* ANA SAYFA */}
        {tab === 'home' && (
          <div className="pb-20">
            {/* HERO SLAYT - ÖNE ÇIKANLAR */}
            {heroItems.length > 0 && (
              <div className="max-w-5xl mx-auto px-4 md:px-8 mb-6 pt-4 md:max-w-none md:mx-0 md:px-0">
                <div className="flex items-center gap-2 mb-3 md:hidden">
                  <div className="w-1 h-5 bg-[#0099ff] rounded-full" />
                  <h2 className="text-sm font-bold text-white tracking-widest" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    ÖNE <span className="text-[#0099ff]">ÇIKANLAR</span>
                  </h2>
                </div>
                <div className="relative overflow-hidden rounded-2xl shadow-2xl shadow-[#0099ff]/10 aspect-[1/1] md:aspect-[26/9]">
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
                  <div className="hidden md:flex absolute top-4 left-4 z-20 items-center gap-2">
                    <div className="w-1 h-5 bg-[#0099ff] rounded-full" />
                    <h2 className="text-sm font-bold text-white tracking-widest drop-shadow-lg" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      ÖNE <span className="text-[#0099ff]">ÇIKANLAR</span>
                    </h2>
                  </div>
                  {heroItems.map((item, i) => {
                    const p = parseTitle(item.name)
                    return (
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
                        <div className="md:hidden">
                          <p className="text-white font-bold text-xl mb-2 drop-shadow-xl">{item.name}</p>
                          <p className="text-gray-300 text-sm mb-4 line-clamp-2 max-w-xl drop-shadow-lg">
                            {item.name} - Şimdi izleyin. Steamix TV'de izleyin
                          </p>
                        </div>
                        <div className="hidden md:block max-w-2xl">
                          <p className="text-4xl lg:text-5xl font-bold text-white drop-shadow-xl leading-tight">{p.title}</p>
                          {p.year && <p className="text-lg font-semibold text-[#0099ff] mt-1">({p.year})</p>}
                          <p className="text-base text-gray-300 mt-3 font-normal leading-relaxed max-w-xl">{p.title}{p.year ? ` (${p.year})` : ''} ve binlerce yapım Steamix TV'de izleyin</p>
                        </div>
                        <div className="flex items-center gap-3 mt-3 md:mt-4">
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
                    )})}
                </div>
              </div>
            )}

            {/* ANA SAYFA SATIRLARI: 1) GÜNCELLENEN FİLMLER 2) YERLİ GÜNCEL DİZİLER 3) ikinci film 4) ikinci dizi */}
            {homeRows.map(({ cat, type }, idx) => {
              const items = type === 'movie' ? vodItems[cat.category_id] : seriesItems[cat.category_id]
              const isLast = idx === homeRows.length - 1
              return (
                <div key={cat.category_id} className={`px-4 md:px-8 ${isLast ? '' : 'mb-6'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-white">{trName(cat.category_name)}
                      {(trName(cat.category_name) === 'GÜNCELLENEN FİLMLER' || trName(cat.category_name) === 'YERLİ GÜNCEL DİZİLER') && (
                        <span className="inline-flex items-center gap-1 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_2px_rgba(74,222,128,0.8)]" />
                          <span className="text-[8px] font-bold text-green-400 tracking-widest">GÜNCEL VERİLER</span>
                        </span>
                      )}
                    </h2>
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
                      {items.map((item: any) => renderCard(item, type, (it) => gotoDetail(it, type), 'w-36', type === 'movie' && trName(cat.category_name) === 'GÜNCELLENEN FİLMLER' && newestByAdded(items)?.stream_id === item.stream_id))}
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
        {tab === 'live' && <LiveTvScreen categories={rotCategories} selectedCat={selectedLiveCat} onSelectCategory={(id) => { navigate('/dashboard?tab=live&lcat=' + encodeURIComponent(id), { replace: true }) }} />}

        {/* MOVIES TAB */}
        {tab === 'movies' && (
          <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]">
            <SlideCategoryPanel title="Film Kategorileri" items={filteredVodCats} selected={selectedCat} onSelect={(id) => {
              const cat = filteredVodCats.find(c => c.category_id === id)
              if (cat && isAdultCat(cat.category_name)) { setAdultPrompt({ catId: id, type: 'movie' }); return }
              setSearchQuery(''); setSearchResults({ movies: [], series: [] })
              navigate('/dashboard?tab=movies&cat=' + id, { replace: true }); loadFullCategory(id, 'movie')
            }} />
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="sticky top-0 z-10 bg-[#0f172a]/80 backdrop-blur-xl px-4 md:px-8 py-4 border-b border-white/5">
                <div className="flex items-center gap-3 max-w-2xl mx-auto">
                  <div className="relative flex-1 group">
                    <input type="text" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); if (!e.target.value.trim()) { setSearchResults({ movies: [], series: [] }); setSearching(false) } }} onKeyDown={e => e.key === 'Enter' && doSearch(searchQuery)} placeholder="Dizi veya Film Ara" className="w-full pl-12 pr-10 py-3 rounded-2xl bg-[#1a1f35] border border-[#0099ff]/20 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#0099ff]/50 focus:bg-[#1e2440] focus:shadow-[0_0_25px_rgba(0,153,255,0.1)] transition-all duration-300 group-hover:border-[#0099ff]/30 tracking-wide" />
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#0099ff] transition-colors duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                    {searchQuery && <button onClick={() => { setSearchQuery(''); setSearchResults({ movies: [], series: [] }) }} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0099ff]/20 hover:bg-[#0099ff]/40 flex items-center justify-center transition-all duration-200"><svg className="w-3.5 h-3.5 text-[#0099ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg></button>}
                  </div>
                  <button onClick={() => doSearch(searchQuery)} className="px-7 py-3 rounded-2xl bg-gradient-to-r from-[#0099ff] to-[#0077cc] text-white text-sm font-semibold hover:from-[#00aaff] hover:to-[#0088dd] hover:shadow-[0_0_25px_rgba(0,153,255,0.3)] active:scale-[0.97] transition-all duration-200 tracking-wide">Ara</button>
                </div>
              </div>
              {searching ? (
                <div className="flex flex-col items-center justify-center h-full gap-6 px-4 select-none">
                  <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full border-[3px] border-[#0099ff]/10" />
                    <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#0099ff] border-r-[#0099ff]/30 animate-spin" style={{ animationDuration: '1.2s' }} />
                    <div className="absolute inset-2 rounded-full border-[3px] border-transparent border-b-[#0099ff] border-l-[#0099ff]/30 animate-spin" style={{ animationDuration: '0.8s', animationDirection: 'reverse' }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#0099ff]/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                    </div>
                  </div>
                  <div className="text-center space-y-1.5">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0099ff] animate-pulse" />
                      <span className="text-base font-bold text-white tracking-[0.2em]" style={{ fontFamily: 'Orbitron, sans-serif' }}>ARANIYOR</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0099ff] animate-pulse" />
                    </div>
                    <p className="text-xs text-gray-500 tracking-wide">"{searchQuery}" taranıyor</p>
                  </div>
                  <div className="flex gap-1.5">
                    {[0,1,2,3,4,5].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#0099ff]/40 animate-pulse" style={{ animationDelay: `${i * 200}ms`, animationDuration: '1.4s' }} />)}
                  </div>
                </div>
              ) : searchResults.movies.length > 0 ? (
                <MovieCategoryGrid items={searchResults.movies} loading={false} categoryName={`"${searchQuery}" için sonuçlar`} />
              ) : searchQuery && searchResults.movies.length === 0 && allVods ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-sm gap-2"><svg className="w-8 h-8 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>Sonuç bulunamadı</div>
              ) : (
              showMovieCategory && activeMovieCat ? (
                <MovieCategoryGrid items={vodItems[activeMovieCat]} loading={!allVods && !vodItems[activeMovieCat]} categoryName={trName(filteredVodCats.find((c: any) => c.category_id === activeMovieCat)?.category_name || 'Filmler')} adultCover={adultCatIds.has(activeMovieCat) ? adultCover : undefined} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm px-4">Yükleniyor...</div>
              )
              )}
            </div>
          </div>
        )}

        {/* SERIES TAB */}
        {tab === 'series' && (
          <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]">
            <SlideCategoryPanel title="Dizi Kategorileri" items={displaySeriesCats} selected={selectedSeriesCat} onSelect={(id) => {
              if (id === '__twd__') {
                setSearchQuery(''); setSearchResults({ movies: [], series: [] })
                navigate('/dashboard?tab=series&scat=' + id, { replace: true })
                if (!seriesItems['__twd__'] && server) {
                  fetchAllSeries(server.base_url, server.xtream_user, server.xtream_pass).then(all => {
                    const twd = (all || []).filter((s: any) => s.name?.toLowerCase().includes('the walking dead'))
                    setSeriesItems(prev => ({ ...prev, '__twd__': twd }))
                  })
                }
                return
              }
              const cat = seriesCats.find(c => c.category_id === id)
              if (cat && isAdultCat(cat.category_name)) { setAdultPrompt({ catId: id, type: 'series' }); return }
              setSearchQuery(''); setSearchResults({ movies: [], series: [] })
              navigate('/dashboard?tab=series&scat=' + id, { replace: true }); loadFullCategory(id, 'series')
            }} />
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="sticky top-0 z-10 bg-[#0f172a]/80 backdrop-blur-xl px-4 md:px-8 py-4 border-b border-white/5">
                <div className="flex items-center gap-3 max-w-2xl mx-auto">
                  <div className="relative flex-1 group">
                    <input type="text" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); if (!e.target.value.trim()) { setSearchResults({ movies: [], series: [] }); setSearching(false) } }} onKeyDown={e => e.key === 'Enter' && doSearch(searchQuery)} placeholder="Dizi veya Film Ara" className="w-full pl-12 pr-10 py-3 rounded-2xl bg-[#1a1f35] border border-[#0099ff]/20 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#0099ff]/50 focus:bg-[#1e2440] focus:shadow-[0_0_25px_rgba(0,153,255,0.1)] transition-all duration-300 group-hover:border-[#0099ff]/30 tracking-wide" />
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#0099ff] transition-colors duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                    {searchQuery && <button onClick={() => { setSearchQuery(''); setSearchResults({ movies: [], series: [] }) }} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0099ff]/20 hover:bg-[#0099ff]/40 flex items-center justify-center transition-all duration-200"><svg className="w-3.5 h-3.5 text-[#0099ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg></button>}
                  </div>
                  <button onClick={() => doSearch(searchQuery)} className="px-7 py-3 rounded-2xl bg-gradient-to-r from-[#0099ff] to-[#0077cc] text-white text-sm font-semibold hover:from-[#00aaff] hover:to-[#0088dd] hover:shadow-[0_0_25px_rgba(0,153,255,0.3)] active:scale-[0.97] transition-all duration-200 tracking-wide">Ara</button>
                </div>
              </div>
              {searching ? (
                <div className="flex flex-col items-center justify-center h-full gap-6 px-4 select-none">
                  <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full border-[3px] border-[#0099ff]/10" />
                    <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#0099ff] border-r-[#0099ff]/30 animate-spin" style={{ animationDuration: '1.2s' }} />
                    <div className="absolute inset-2 rounded-full border-[3px] border-transparent border-b-[#0099ff] border-l-[#0099ff]/30 animate-spin" style={{ animationDuration: '0.8s', animationDirection: 'reverse' }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#0099ff]/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                    </div>
                  </div>
                  <div className="text-center space-y-1.5">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0099ff] animate-pulse" />
                      <span className="text-base font-bold text-white tracking-[0.2em]" style={{ fontFamily: 'Orbitron, sans-serif' }}>ARANIYOR</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0099ff] animate-pulse" />
                    </div>
                    <p className="text-xs text-gray-500 tracking-wide">"{searchQuery}" taranıyor</p>
                  </div>
                  <div className="flex gap-1.5">
                    {[0,1,2,3,4,5].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#0099ff]/40 animate-pulse" style={{ animationDelay: `${i * 200}ms`, animationDuration: '1.4s' }} />)}
                  </div>
                </div>
              ) : searchResults.series.length > 0 ? (
                <SeriesCategoryGrid items={searchResults.series} loading={false} categoryName={`"${searchQuery}" için sonuçlar`} />
              ) : searchQuery && searchResults.series.length === 0 && allSeries ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-sm gap-2"><svg className="w-8 h-8 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>Sonuç bulunamadı</div>
              ) : (
              activeSeriesCat === '__twd__' ? (
                <SeriesCategoryGrid items={seriesItems['__twd__']} loading={!allSeries && !seriesItems['__twd__']} categoryName="THE WALKING DEAD" />
              ) : (
              showSeriesCategory && activeSeriesCat ? (
                <SeriesCategoryGrid items={seriesItems[activeSeriesCat]} loading={!allSeries && !seriesItems[activeSeriesCat]} categoryName={trName(seriesCats.find((c: any) => c.category_id === activeSeriesCat)?.category_name || 'Diziler')} adultCover={adultCatIds.has(activeSeriesCat) ? adultCover : undefined} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm px-4">Yükleniyor...</div>
              )
              )
              )}
            </div>
          </div>
        )}

        {/* OYUNLAR TAB */}
        {tab === 'games' && <GamesScreen />}

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

    {/* Adult password modal */}
    {adultPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-80 max-w-[90vw] shadow-2xl shadow-black/50">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-red-500" />
              <h3 className="text-base font-bold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>YETİŞKİN İÇERİK</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">Bu kategori yetişkinlere yönelik içerikler içerir. Devam etmek için şifreyi girin.</p>
            <input type="password" value={adultPassword} onChange={e => setAdultPassword(e.target.value)}
              placeholder="Şifre" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm mb-3 focus:outline-none focus:border-[#0099ff]/50" autoFocus />
            <div className="flex gap-2">
              <button onClick={() => { setAdultPrompt(null); setAdultPassword('') }}
                className="flex-1 py-2.5 rounded-xl bg-white/5 text-white text-sm hover:bg-white/10 transition-colors">İptal</button>
              <button onClick={() => {
                if (adultPassword === 'bgV7rQk') {
                  const p = adultPrompt
                  setAdultPrompt(null); setAdultPassword('')
                  if (p.type === 'movie') { navigate('/dashboard?tab=movies&cat=' + p.catId, { replace: true }); loadFullCategory(p.catId, 'movie') }
                  else { navigate('/dashboard?tab=series&scat=' + p.catId, { replace: true }); loadFullCategory(p.catId, 'series') }
                } else { setAdultPassword('') }
              }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm hover:bg-red-700 transition-colors">Giriş</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const newestByAdded = (items: any[]) => {
  const ts = (it: any) => {
    const n = Number(it?.added)
    if (!isNaN(n) && n > 0) return n
    const p = Date.parse(it?.added || '')
    return isNaN(p) ? 0 : p
  }
  const list = [...(items || [])]
  const hasAdded = list.some(it => ts(it) > 0)
  if (hasAdded) return list.sort((a, b) => ts(b) - ts(a) || Number(b?.stream_id) - Number(a?.stream_id))[0]
  return list[0]
}

function MovieCategoryGrid({ items, loading, categoryName, adultCover }: any) {
  const navigate = useNavigate()
  const { server } = useAuth()
  const pImg = (url: string) => {
    if (!url) return url
    const path = url.replace(/^https?:\/\/[^\/]+/, '')
    if (path.startsWith('/t/p/')) return `https://image.tmdb.org${path}`
    if (url.startsWith('http://') && server?.base_url) return proxyUrl(server.base_url, path)
    return url
  }

  const handleDetail = (item: any) => {
    const sp = new URLSearchParams({ id: String(item.stream_id), type: 'movie', cat: item.category_id || '' })
    if (adultCover) sp.set('icon', 'adult')
    else if (item.cover_big || item.stream_icon) sp.set('icon', item.cover_big || item.stream_icon)
    if (item.container_extension) sp.set('ext', item.container_extension)
    if (item.name) sp.set('name', item.name.replace(/[✓✔☑✗✘]/g, ''))
    navigate(`/detail?${sp}`)
  }

  const newestId = categoryName === 'GÜNCELLENEN FİLMLER' ? newestByAdded(items)?.stream_id : undefined

  return (
    <div className="px-4 md:px-6 pt-3">
      <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2 flex-wrap" style={{ fontFamily: 'Orbitron, sans-serif' }}>
        {categoryName} <span className="text-xs text-gray-500 font-normal">({items?.length || 0})</span>
        {categoryName === 'GÜNCELLENEN FİLMLER' && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_2px_rgba(74,222,128,0.8)]" />
            <span className="text-[9px] font-bold text-green-400 tracking-widest">GÜNCEL VERİLER</span>
          </span>
        )}
      </h2>
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-[#0099ff] animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {(items || []).map((s: any) => (
            <GridItem key={s.stream_id} item={s} adultCover={adultCover} pImg={pImg} handleDetail={handleDetail} type="movie" isSeries={false} isNew={newestId === s.stream_id} />
          ))}
        </div>
      )}
    </div>
  )
}

function SeriesCategoryGrid({ items, loading, categoryName, adultCover }: any) {
  const navigate = useNavigate()
  const { server } = useAuth()
  const pImg = (url: string) => {
    if (!url) return url
    const path = url.replace(/^https?:\/\/[^\/]+/, '')
    if (path.startsWith('/t/p/')) return `https://image.tmdb.org${path}`
    if (url.startsWith('http://') && server?.base_url) return proxyUrl(server.base_url, path)
    return url
  }
  const handleDetail = (item: any) => {
    const sp = new URLSearchParams({ id: String(item.series_id), type: 'series', cat: item.category_id || '' })
    if (adultCover) sp.set('icon', 'adult')
    else if (item.cover_big || item.movie_image || item.cover || item.thumbnail) sp.set('icon', item.cover_big || item.movie_image || item.cover || item.thumbnail)
    if (item.name) sp.set('name', item.name.replace(/[✓✔☑✗✘]/g, ''))
    navigate(`/detail?${sp}`)
  }

  return (
    <div className="px-4 md:px-6 pt-3">
      <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2 flex-wrap" style={{ fontFamily: 'Orbitron, sans-serif' }}>
        {categoryName} <span className="text-xs text-gray-500 font-normal">({items?.length || 0})</span>
        {categoryName === 'YERLİ GÜNCEL DİZİLER' && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_2px_rgba(74,222,128,0.8)]" />
            <span className="text-[9px] font-bold text-green-400 tracking-widest">GÜNCEL VERİLER</span>
          </span>
        )}
      </h2>
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-[#0099ff] animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {(items || []).map((s: any) => (
            <GridItem key={s.series_id} item={s} adultCover={adultCover} pImg={pImg} handleDetail={handleDetail} type="series" isSeries={true} />
          ))}
        </div>
      )}
    </div>
  )
}

function GridItem({ item, adultCover, pImg, handleDetail, type, isSeries, isNew }: any) {
  const [hide, setHide] = useState(false)
  const posterSrc = adultCover ? undefined : pImg(item.cover_big || item.stream_icon || item.movie_image || item.cover || item.thumbnail)
  if (hide) return null
  return (
    <div className="group">
      <button onClick={() => handleDetail(item)} className="w-full">
        <div className={`aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 mb-2 relative transition-all duration-300 group-hover:scale-[1.07] group-hover:shadow-[0_0_30px_rgba(0,153,255,0.35)] group-hover:ring-2 group-hover:ring-[#0099ff]/40 ${isSeries ? 'group-hover:shadow-[0_0_30px_rgba(20,184,166,0.35)] group-hover:ring-[#14b8a6]/40' : ''}`}>
          <Poster src={posterSrc} type={type} onError={() => setHide(true)} />
          {isNew && (
            <div className="absolute top-1.5 left-1.5 z-10 px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#ff2d55] to-[#ff8c42] shadow-[0_0_16px_rgba(255,45,85,0.9)] border border-white/30">
              <span className="text-[10px] font-black text-white tracking-widest drop-shadow" style={{ fontFamily: 'Orbitron, sans-serif' }}>YENİ</span>
            </div>
          )}
          {adultCover ? (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center">
              <span className="text-2xl md:text-3xl font-black text-red-500 opacity-60" style={{ fontFamily: 'Orbitron, sans-serif' }}>18+</span>
              <span className="text-[10px] text-gray-500 mt-1">YETİŞKİN</span>
            </div>
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-125">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,153,255,0.6)] backdrop-blur-sm ${isSeries ? 'bg-[#14b8a6] shadow-[0_0_20px_rgba(20,184,166,0.6)]' : 'bg-[#0099ff] shadow-[0_0_20px_rgba(0,153,255,0.6)]'}`}>
              <Play className="w-6 h-6 text-white ml-1 fill-white" />
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 truncate group-hover:text-white transition-colors duration-150 text-left">{item.name}</p>
      </button>
    </div>
  )
}

function SlideCategoryPanel({ title, items, selected, onSelect }: { title: string; items: any[]; selected: string; onSelect: (id: string) => void }) {
  const catName = (cat: any) => {
    const name = cat.category_name || cat.name || ''
    const trimmed = name.trim()
    const n = trimmed.toLowerCase()
    if (n.includes('adult') || n.includes('yetişkin') || n.includes('18+') || n.includes('xxx') || n.includes('porno') || n.includes('erotik')) {
      return 'ADULT +18'
    }
    const categoryNameOverride: Record<string, string> = {
      'TR ✦ Pazartesi Dizi': 'PAZARTESİ DİZİLERİ', 'TR ✦ Salı Dizi': 'SALI DİZİLERİ', 'TR ✦ Çarşamba Dizi': 'ÇARŞAMBA DİZİLERİ',
      'TR ✦ Perşembe Dizi': 'PERŞEMBE DİZİLERİ', 'TR ✦ Cuma Dizi': 'CUMA DİZİLERİ', 'TR ✦ Cumartesi Dizi': 'CUMARTESİ DİZİLERİ',
      'TR ✦ Pazar Dizi': 'PAZAR DİZİLERİ', 'TR ✦ SİNEVİZYON 2025/2026': 'GÜNCELLENEN FİLMLER',
      'TR ✦ SİNEVİZYON 2024/2025': 'SİNEMA ARŞİVİ 2024-2025', 'TR ✦ SİNEVİZYON 2023/2024': 'SİNEMA ARŞİVİ 2023-2024',
      'TR ✦ SİNEVİZYON 2021/2022': 'SİNEMA ARŞİVİ 2021-2022', 'TR ✦ SİNETÜRK': 'SİNEMA VE FİLM KÜLLİYATI',
      'TR ✦ 4K SİNEMA': '4K SİNEMA', 'TR ✦ AKSİYON & MACERA': 'AKSİYON VE MACERA',
      'TR ✦ FANTASTİK & BİLİMKURGU': 'FANTASTİK VE BİLİMKURGU', 'TR ✦ KORKU & GERİLİM': 'KORKU VE GERİLİM',
      'TR ✦ AŞK & ROMANTİK': 'AŞK VE ROMANTİK', 'TR ✦ KOMEDİ': 'KOMEDİ',
      'TR ✦ DRAM & TARİH': 'DRAM VE TARİH', 'TR ✦ KOVBOY & WESTERN FİLMLER': 'KOVBOY VE WESTERN',
      'TR ✦ ÇOCUK & ANİMASYON': 'ÇOCUK VE ANİMASYON', 'TR ✦ KLASİK & NOSTALJİ FİLM': 'KLASİK VE NOSTALJİ',
      'TR ✦ BoX SeT SINEMA': 'BOX SET FİLMLER', 'TR ✦ H265 FİLMLER': 'YÜKSEK KALİTE FİLMLER',
      'TR ✦ YEŞİLÇAM': 'YEŞİLÇAM', 'TR ✦ KEMAL SUNAL': 'KEMAL SUNAL FİLMLERİ',
      'TR ✦ ŞENER ŞEN': 'ŞENER ŞEN FİLMLERİ', 'TR ✦ ZEKİ & METİN': 'ZEKİ VE METİN FİLMLERİ',
      'TR ✦ KADİR İNANIR': 'KADİR İNANIR FİLMLERİ', 'TR ✦ CÜNEYT ARKIN': 'CÜNEYT ARKIN FİLMLERİ',
      'TR ✦ SADRİ ALIŞIK': 'SADRİ ALIŞIK FİLMLERİ', 'TR ✦ TÜRKAN ŞORAY': 'TÜRKAN ŞORAY FİLMLERİ',
      'TR ✦ FERDİ TAYFUR': 'FERDİ TAYFUR FİLMLERİ', 'TR ✦ YILMAZ GÜNEY': 'YILMAZ GÜNEY FİLMLERİ',
      'TR ✦ TARIK AKAN': 'TARIK AKAN FİLMLERİ', 'TR ✦ BOLLYWOOD': 'DÜNYA SİNEMASI',
      'TR ✦ JAMES BOND FİLMLER': 'JAMES BOND SERİSİ', 'TR ✦ BELGESEL FİLM': 'BELGESEL FİLMLER',
      'TR ✦ DİNİ': 'DİNİ İÇERİKLER', 'EU ✦ MULTI NETFLIX 2025/2026': 'ULUSLARARASI FİLMLER 2022-2026',
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
      'DE ✦ KINOVISION 2025/2026': 'ALMANCA SİNEMA ARŞİVİ', 'DE ✦ ACTION & ABENTEUER': 'ALMANCA AKSİYON VE MACERA',
      'DE ✦ KRIMI & THRILLER & MYSTERY': 'ALMANCA POLİSİYE VE GİZEM', 'DE ✦ HORROR': 'ALMANCA KORKU',
      'DE ✦ SCI-FI & FANTASY': 'ALMANCA BİLİMKURGU VE FANTASTİK', 'DE ✦ KOMÖDIE': 'ALMANCA KOMEDİ',
      'DE ✦ LIEBESFILME': 'ALMANCA ROMANTİK', 'DE ✦ DRAMA': 'ALMANCA DRAMA',
      'DE ✦ FAMILIE FILME': 'ALMANCA AİLE FİLMLERİ', 'DE ✦ KRIEGSFILME': 'ALMANCA SAVAŞ FİLMLERİ',
      'DE ✦ KUNGFU & KARATE': 'ALMANCA KUNG FU VE KARATE', 'DE ✦ WESTERN': 'ALMANCA WESTERN',
      'DE ✦ BOLLYWOOD FILME': 'ALMANCA DÜNYA SİNEMASI', 'DE ✦ Legendäre KINOBOX': 'ALMANCA EFSANE KİNOBOX',
      'DE ✦ WEIHNACHTEN FILME': 'ALMANCA YILBAŞI FİLMLERİ', 'DE ✦ KINDER ANIMATION': 'ALMANCA ÇOCUK VE ANİMASYON',
      'DE ✦ THE COLLECTION': 'ALMANCA SEÇKİ FİLMLER', 'DE ✦ KLASSIKER': 'ALMANCA NOSTALJİK FİLMLER',
      'DE ✦ DOKU FILME': 'ALMANCA BELGESELLER', 'NL ✦ ACTIE & MISDAAD': 'HOLLANDACA AKSİYON VE SUÇ',
      'NL ✦ THRILLER & MYSTERY': 'HOLLANDACA GERİLİM VE GİZEM', 'NL ✦ HORROR': 'HOLLANDACA KORKU',
      'NL ✦ SCI-FI & FANTASIE': 'HOLLANDACA BİLİMKURGU VE FANTASTİK', 'NL ✦ KOMEDIE': 'HOLLANDACA KOMEDİ',
      'NL ✦ ROMANTIEK': 'HOLLANDACA ROMANTİK', 'NL ✦ DRAMA & FAMILIE': 'HOLLANDACA DRAM VE AİLE',
      'NL ✦ DOCUMENTAIRE': 'HOLLANDACA BELGESELLER', 'ALB ✦ KİNEMAJA 2023/2024': 'ARNAVUTÇA SİNEMA ARŞİVİ',
      'ALB ✦ SHQIPTAR': 'ARNAVUTÇA FİLMLER', 'ALB ✦ FILMAT TURQISHT': 'ARNAVUTÇA TÜRKÇE FİLMLER',
      'ALB ✦ AKSION & AVENTURE': 'ARNAVUTÇA AKSİYON VE MACERA', 'ALB ✦ FANTAZI & FANTASHKENCE': 'ARNAVUTÇA FANTASTİK VE BİLİMKURGU',
      'ALB ✦ HORROR & THRILLER': 'ARNAVUTÇA KORKU VE GERİLİM', 'ALB ✦ ANIMASION': 'ARNAVUTÇA ANİMASYON',
      'NO✦ NORDIC SCANDINAVIAN MOVIES': 'İSKANDİNAV VE KUZEY AVRUPA FİLMLERİ',
      'TR ✦ YERLİ GÜNCEL DİZİLER': 'YERLİ GÜNCEL DİZİLER', 'TR ✦ YERLİ FİNAL DİZİLER': 'YERLİ FİNAL YAPMIŞ DİZİLER',
      'TR ✦ EFSANE HİT DİZİLER': 'EFSANE HİT DİZİLER', 'TR ✦ YABANCI DUBLAJ DİZİLER': 'YABANCI DUBLAJLI DİZİLER',
      'TR ✦ EXXEN TV DİZİ': 'DİJİTAL PLATFORM DİZİLERİ (GENEL)',
      'TR ✦ HBO MAX & BLUETV DİZİLER': 'DİJİTAL PLATFORM DİZİLERİ (ÖZEL)',
      'TR ✦ APPLE TV': 'DİJİTAL PLATFORM DİZİLERİ (ÖZEL)',
    'TR ✦ TURKCELL TV+': 'TR HOLLYWOOD DİZİLERİ',
      'TR ✦ BEIN TOD SERIES': 'DİJİTAL PLATFORM DİZİLERİ (GENEL)',
      'TR ✦ TABİİ TV DİZİLER': 'DİJİTAL PLATFORM DİZİLERİ (GENEL)',
      'TR ✦ GAIN TV DİZİLER': 'DİJİTAL PLATFORM DİZİLERİ (GENEL)',
      'TR ✦ ÇOCUK ANİMASYON DİZİLER': 'ÇOCUK VE ANİMASYON DİZİLERİ',
      'TR ✦ BELGESEL DİZİLER': 'BELGESEL DİZİLER', 'TR ✦ KOMEDİ & STAND UP & TALK SHOW': 'KOMEDİ, STAND UP VE TALK SHOW',
      'TR ✦ EĞİTİM KURS': 'EĞİTİM VE KURS İÇERİKLERİ', 'DE ✦ NETFLIX SERIEN': 'ALMANCA DİZİLER (GENEL)',
      'DE ✦ AMAZON PRIME SERIEN': 'ALMANCA DİZİLER (GENEL)', 'DE ✦ DISNEY+ SERIEN': 'ALMANCA DİZİLER (GENEL)',
      'DE ✦ DISNEY+ KIDS': 'ALMANCA ÇİZGİ FİLM VE ANİMASYON DİZİLERİ',
      'DE ✦ DISNEY+ MARVEL SERIEN': 'ALMANCA DİZİLER (GENEL)', 'DE ✦ DISNEY+ STAR WARS SERIEN': 'ALMANCA DİZİLER (GENEL)',
      'DE ✦ SKY ORIGINALS SERIEN': 'ALMANCA DİZİLER (GENEL)', 'DE ✦ APPLE TV SERIEN': 'ALMANCA DİZİLER (GENEL)',
      'DE ✦ PARAMOUNT SERIEN': 'ALMANCA DİZİLER (GENEL)', 'DE ✦ HBO SERIEN': 'ALMANCA DİZİLER (GENEL)',
      'DE ✦ STARZ SERIEN': 'ALMANCA DİZİLER (GENEL)', 'DE ✦ JOYN+ SERIEN': 'ALMANCA DİZİLER (GENEL)',
      'DE ✦ HULU SERIEN': 'ALMANCA DİZİLER (GENEL)', 'DE ✦ RTL+ SERIEN': 'ALMANCA DİZİLER (GENEL)',
      'DE ✦ ACTION & ABENTEUER SERIEN': 'ALMANCA AKSİYON VE MACERA DİZİLERİ',
      'DE ✦ KRIMI & THRILLER SERIEN': 'ALMANCA POLİSİYE VE GERİLİM DİZİLERİ',
      'DE ✦ SyFy & FANTASY SERIEN': 'ALMANCA BİLİMKURGU VE FANTASTİK DİZİLERİ',
      'DE ✦ DRAMA SERIEN': 'ALMANCA DRAMA DİZİLERİ', 'DE ✦ KOMÖDIE SERIEN': 'ALMANCA KOMEDİ DİZİLERİ',
      'DE ✦ DOKU SERIEN': 'ALMANCA BELGESEL DİZİLERİ', 'DE ✦ ANIME SERIEN': 'ALMANCA ANİME DİZİLERİ',
      'DE ✦ CARTOONS & ANIMATION SERIEN': 'ALMANCA ÇİZGİ FİLM VE ANİMASYON DİZİLERİ',
      'DE ✦ TV NOW & SHOWS SERIEN': 'ALMANCA TELEVİZYON ŞOVLARI',
      'ALB ✦ SERIALET TURKE': 'ARNAVUTÇA TÜRK DİZİLERİ', 'ALB ✦ SERIALE TË HUAJA': 'ARNAVUTÇA YABANCI DİZİLER',
      'EX-YU ✦ TURSKE SERIJE': 'BALKAN TÜRK DİZİLERİ', 'EU ✦ MULTI NETFLIX SERIES': 'ULUSLARARASI DİZİLER',
      'EU ✦ MULTI NETFLIX KIDS SERIES': 'ULUSLARARASI ÇOCUK DİZİLERİ',
      'EU ✦ MULTI AMAZON PRIME SERIES': 'ULUSLARARASI DİZİLER', 'EU ✦ MULTI DISNEY+ SERIES': 'TR HOLLYWOOD DİZİLERİ II',
      'EU ✦ MULTI DISNEY+ KIDS SERIES': 'ULUSLARARASI ÇOCUK DİZİLERİ',
      'ADULT +18 ✦ 4K UHD': 'YETİŞKİN +18 4K ULTRA HD', 'ADULT+ 18 ✦ AMATEUR': 'YETİŞKİN +18 AMATÖR',
      'ADULT +18 ✦ ANAL': 'YETİŞKİN +18 ANAL', 'ADULT +18 ✦ ASIAN': 'YETİŞKİN +18 ASYA',
      'ADULT +18 ✦ BLACK': 'YETİŞKİN +18 SİYAH', 'ADULT +18 ✦ BIG ASS': 'YETİŞKİN +18 İRİ POPO',
      'ADULT +18 ✦ BIG TITS': 'YETİŞKİN +18 BÜYÜK GÖĞÜS', 'ADULT +18 ✦ EROTICA FILM': 'YETİŞKİN +18 EROTİK FİLMLER',
      'ADULT +18 ✦ FAKE HUB': 'YETİŞKİN +18 AMATÖR EV', 'ADULT +18 ✦ GROUPS': 'YETİŞKİN +18 GRUP',
      'ADULT +18 ✦ HARDCORE': 'YETİŞKİN +18 SERT', 'ADULT +18 ✦ LESBIAN': 'YETİŞKİN +18 LEZBİYEN',
      'ADULT +18 ✦ MASSAGE': 'YETİŞKİN +18 MASAJ', 'ADULT +18 ✦ MILF': 'YETİŞKİN +18 OLGUN',
      'ADULT +18 ✦ PUBLIC': 'YETİŞKİN +18 HALK', 'ADULT +18 ✦ TEEN': 'YETİŞKİN +18 GENÇ',
      'ADULT +18 ✦ TURKISH SUB.': 'YETİŞKİN +18 TÜRKÇE ALTYAZILI',
    }
    const overridden = categoryNameOverride[trimmed]
    if (overridden) return overridden
    const cleaned = trimmed.replace(/[★☆✦✧✩✪✫✬✭✮✯✰⭐🌟🌠◆◇◈◉◊○●•¤☆★]/g, ' ').replace(/\s+/g, ' ').trim()
    if (!cleaned) return name
    const withoutPrefix = cleaned.replace(/^(?:TR|EU|DE|NL|ALB|NO|AL|EX-YU)\s*✦?\s*/i, '').trim()
    return withoutPrefix || cleaned
  }
  const [open, setOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const show = () => { clearTimeout(timerRef.current); setOpen(true) }
  const scheduleHide = () => { timerRef.current = setTimeout(() => setOpen(false), 3000) }
  const handleMouseEnter = () => { clearTimeout(timerRef.current) }
  const handleMouseLeave = () => { scheduleHide() }
  const handleSelect = (id: string) => { onSelect(id); scheduleHide() }

  return (
    <>
      {/* Trigger button */}
      <button onClick={() => open ? scheduleHide() : show()}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-30 w-7 h-16 rounded-r-xl bg-[#0099ff]/80 hover:bg-[#0099ff] text-white flex items-center justify-center transition-all shadow-lg backdrop-blur-sm group">
        <svg className={`w-4 h-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
      </button>
      {/* Overlay */}
      {open && <div className="fixed inset-0 z-20 bg-black/40" onClick={() => scheduleHide()} />}
      {/* Panel */}
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
        className={`fixed left-0 top-16 md:top-20 bottom-0 z-20 w-56 bg-[#0f172a]/95 backdrop-blur-xl border-r border-white/10 transition-transform duration-300 ease-out ${open ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
          <h3 className="text-xs font-semibold text-[#0099ff] tracking-widest uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>{title}</h3>
        </div>
        <div className="overflow-y-auto flex-1 pb-16">
          {items.map(cat => {
            const cName = catName(cat)
            return (
              <button key={cat.category_id}
                onClick={() => handleSelect(cat.category_id)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors uppercase tracking-wide ${
                  selected === cat.category_id
                    ? 'bg-[#0099ff]/10 text-white border-r-2 border-[#0099ff] font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}>
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate">{cName}</span>
                  {cName === 'GÜNCELLENEN FİLMLER' || cName === 'YERLİ GÜNCEL DİZİLER' && (
                    <span className="inline-flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_2px_rgba(74,222,128,0.8)]" />
                      <span className="text-[8px] font-bold text-green-400 tracking-widest">GÜNCEL VERİLER</span>
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </>
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
              if (item.name) sp.set('name', item.name)
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
