import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLang } from '@/lib/language'
import { useAuth } from '@/hooks/use-auth'
import { Eye, EyeOff, Globe, ChevronDown, Loader2, ShoppingCart, X, CreditCard, Check, Mail, AlertTriangle } from 'lucide-react'

export default function Login() {
  const { t, lang, setLang, langNames, languages } = useLang()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const expired = params.get('expired') === '1'
  const [username, setUsername] = useState(() => { try { return localStorage.getItem('remember_user') || '' } catch { return '' } })
  const [password, setPassword] = useState(() => { try { return localStorage.getItem('remember_pass') || '' } catch { return '' } })
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(() => { try { return localStorage.getItem('remember_me') !== 'false' } catch { return true } })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [showSubModal, setShowSubModal] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const bgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = bgRef.current
    if (!el) return
    el.style.transform = 'translateX(0px)'
    const startTime = Date.now()
    let raf: number
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000
      const offset = Math.sin(elapsed * 0.03) * 25
      el.style.transform = `translateX(${offset}px)`
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) { setError('Kullanıcı adı ve şifre girin'); return }
    setLoading(true); setError(null)
    const err = await login(username.trim(), password)
    if (err) { setError(err); setLoading(false) }
    else {
      try {
        if (remember) {
          localStorage.setItem('remember_user', username.trim())
          localStorage.setItem('remember_pass', password)
          localStorage.setItem('remember_me', 'true')
        } else {
          localStorage.removeItem('remember_user')
          localStorage.removeItem('remember_pass')
          localStorage.setItem('remember_me', 'false')
        }
      } catch {}
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col relative overflow-hidden">
      {/* Arka plan - transform ile kaydırma, boşluksuz */}
      <div className="absolute inset-0 overflow-hidden">
        <div ref={bgRef} className="absolute" style={{
          top: '-30px', bottom: '-30px', left: '-30px', right: '-30px',
          backgroundImage: 'url(/images/login.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.5) blur(1px)',
        }} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/70" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-[#0099ff]/10 rounded-full blur-[150px]" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>
      <div className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-2">
          <img src="/images/steamix-logo.jpg" alt="" className="w-8 h-8 md:w-10 md:h-10 rounded-lg" />
          <span className="text-lg md:text-xl font-bold text-white tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>Steamix <span className="text-[#0099ff]">TV</span></span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowSubModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all">
            <CreditCard className="w-4 h-4" /><span className="hidden sm:inline">Planlar</span>
          </button>
          <button onClick={() => setShowTestModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[#0099ff] border border-[#0099ff]/30 hover:bg-[#0099ff]/10 hover:border-[#0099ff] transition-all">
            <Mail className="w-4 h-4" /><span className="hidden sm:inline">Test Al</span>
          </button>
          <div className="relative">
            <button onClick={() => setLangOpen(!langOpen)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all">
              <Globe className="w-4 h-4" /><span>{langNames[lang]}</span><ChevronDown className={`w-3 h-3 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
            </button>
            {langOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 w-40 rounded-xl bg-gray-900 border border-white/10 shadow-2xl overflow-hidden">
                  {languages.map((l: string) => (
                    <button key={l} onClick={(e) => { e.stopPropagation(); setLang(l); setLangOpen(false) }} className={`w-full px-4 py-2.5 text-sm text-left transition-colors ${lang === l ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>{langNames[l]}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="relative z-10 flex-1 flex items-center px-4 md:px-12 pb-12">
        <div className="w-full flex flex-col md:flex-row items-center md:items-stretch gap-8 md:gap-16 max-w-5xl mx-auto">
          {/* Sol taraf - Slogan */}
          <div className="flex-1 flex flex-col justify-center text-center md:text-left">
            <div className="mb-4">
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Steamix <span className="text-[#0099ff]">TV</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-300 leading-relaxed font-light">
                Sınırsız eğlence, kesintisiz keyif.
              </p>
              <p className="text-sm text-gray-500 mt-3 leading-relaxed max-w-md">
                4K Ultra HD kalitesinde binlerce film, dizi ve VOD içeriği. 
                Dilediğin zaman, dilediğin yerde izle.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-4 mt-6">
              <div className="relative w-16 h-[2px] bg-white/5 overflow-hidden rounded-full">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0099ff] to-transparent opacity-80 rounded-full"
                  style={{ animation: 'lightSweep 2s ease-in-out infinite' }} />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-40 rounded-full"
                  style={{ animation: 'lightSweep 2s ease-in-out infinite', animationDelay: '0.5s', filter: 'blur(3px)' }} />
              </div>
              <span className="text-xs text-gray-600 tracking-widest uppercase">Steamix TV Company</span>
              <style>{`@keyframes lightSweep { 0%,100% { transform: translateX(-100%) } 50% { transform: translateX(100%) } }`}</style>
            </div>
          </div>
          {/* Sağ taraf - Giriş Formu */}
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>{t('login.title')}</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">{t('login.username')}</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-[#0099ff] focus:shadow-[0_0_20px_rgba(0,153,255,0.15)] transition-all duration-300" placeholder={t('login.username')} autoComplete="username" disabled={loading} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">{t('login.password')}</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 pr-10 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-[#0099ff] focus:shadow-[0_0_20px_rgba(0,153,255,0.15)] transition-all duration-300" placeholder={t('login.password')} autoComplete="current-password" disabled={loading} />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={remember} onChange={e => { setRemember(e.target.checked); try { localStorage.setItem('remember_me', e.target.checked ? 'true' : 'false'); if (!e.target.checked) { localStorage.removeItem('remember_user'); localStorage.removeItem('remember_pass') } } catch {} }} className="w-4 h-4 rounded border-gray-600 bg-white/5 text-[#0099ff] focus:ring-[#0099ff]" />
                <span className="text-sm text-gray-400">{t('login.remember')}</span>
              </label>
              {error && (
                <div className="text-center">
                  <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
                  {error === 'Abonelik süreniz dolmuştur' && (
                    <button type="button" onClick={() => setShowSubModal(true)}
                      className="mt-2 text-xs text-[#0099ff] hover:underline">
                      Planları Görüntüle &rarr;
                    </button>
                  )}
                </div>
              )}
              <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0099ff] to-blue-600 text-white font-semibold text-sm hover:shadow-[0_0_30px_rgba(0,153,255,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 flex items-center justify-center">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{t('login.loading')}</> : t('login.button')}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Abonelik Süresi Doldu Overlay */}
      {expired && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="text-center max-w-lg mx-auto px-6">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              ABONELİK <span className="text-red-400">SÜRENİZ</span> DOLMUŞTUR
            </h1>
            <p className="text-lg text-gray-300 mb-6">
              Oturum süreniz dolduğu için çıkış yapıldı. Aboneliğinizi yenilemek için aşağıdaki butonu kullanabilirsiniz.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={() => navigate('/login', { replace: true })}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-all">
                Geri Dön
              </button>
              <button onClick={() => { navigate('/login', { replace: true }); setShowSubModal(true) }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#0099ff] to-blue-600 text-white text-sm font-semibold hover:shadow-[0_0_30px_rgba(0,153,255,0.5)] transition-all">
                Planları Gör
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Abonelik Modal */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowSubModal(false)} />
          <div className="relative z-10 bg-gradient-to-b from-gray-900 to-gray-950 rounded-3xl p-6 md:p-8 max-w-2xl w-full mx-4 border border-white/10 shadow-2xl shadow-[#0099ff]/5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                <CreditCard className="w-5 h-5 text-[#0099ff]" /> ABONELİK <span className="text-[#0099ff]">PLANLARI</span>
              </h2>
              <button onClick={() => setShowSubModal(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              {[
                { name: '1 AYLIK', price: '300 TL', link: 'https://www.shopier.com/platool/45181977', features: ['4K Ultra HD', 'Sınırsız İzleme', 'Tüm Kategoriler', 'VOD + Arşiv', '7/24 Destek'] },
                { name: '3 AYLIK', price: '600 TL', link: 'https://www.shopier.com/platool/45181945', popular: true, features: ['4K Ultra HD', 'Sınırsız İzleme', 'Tüm Kategoriler', 'VOD + Arşiv', '7/24 Destek', 'En Popüler Seçim'] },
                { name: '12 AYLIK', price: '1.200 TL', original: '2.500 TL', link: 'https://www.shopier.com/platool/44083927', features: ['4K Ultra HD', 'Sınırsız İzleme', 'Tüm Kategoriler', 'VOD + Arşiv', '7/24 Destek', 'Kampanya Fiyatı!'] },
              ].map(p => (
                <div key={p.name} className={`relative rounded-2xl p-5 border transition-all duration-300 hover:scale-[1.03] ${p.popular ? 'border-[#0099ff] bg-[#0099ff]/5 shadow-lg shadow-[#0099ff]/10' : 'border-white/10 bg-white/5'}`}>
                  {p.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#0099ff] to-purple-500 text-white text-xs font-semibold whitespace-nowrap shadow-lg">
                      En Popüler
                    </div>
                  )}
                  <div className="text-center mb-4 mt-2">
                    <p className="text-xs text-gray-500 tracking-widest mb-2">{p.name}</p>
                    {p.original && <div className="text-sm text-gray-500 line-through mb-0.5">{p.original}</div>}
                    <div className="text-3xl font-bold text-[#0099ff] mb-1">{p.price}</div>
                  </div>
                  <ul className="space-y-2 mb-5">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-[11px] text-gray-400">
                        <Check className="w-3.5 h-3.5 text-[#0099ff] shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <a href={p.link} target="_blank" rel="noopener noreferrer"
                    className="block w-full py-2.5 rounded-xl bg-gradient-to-r from-[#0099ff] to-blue-600 text-white font-semibold text-xs text-center hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0099ff]/20">
                    <ShoppingCart className="w-3.5 h-3.5" />Satın Al
                  </a>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-gray-400 leading-relaxed">
                <span className="text-yellow-400 font-semibold">📌 Önemli:</span> Satın aldıktan sonra{' '}
                <span className="text-[#0099ff] font-medium">steamixgame@yandex.com</span> mail adresine
                satın aldığınıza dair ekran görüntüsü atın. Yönetici tarafından onaylanıp en kısa sürede
                abonelik giriş bilgileriniz size teslim edilecektir.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Test Al Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowTestModal(false)} />
          <div className="relative z-10 bg-gradient-to-b from-gray-900 to-gray-950 rounded-3xl p-6 md:p-8 max-w-lg w-full mx-4 border border-white/10 shadow-2xl shadow-[#0099ff]/5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                <Mail className="w-5 h-5 text-[#0099ff]" /> TEST <span className="text-[#0099ff]">YAYINI</span>
              </h2>
              <button onClick={() => setShowTestModal(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                <X className="w-4 h-4" />
              </button>
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
        </div>
      )}
    </div>
  )
}
