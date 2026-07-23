import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingCart } from 'lucide-react'

export default function Subscription() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />Geri
        </button>
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Steamix <span className="text-[#0099ff]">TV</span>
          </h1>
          <p className="text-sm text-gray-500">Size en uygun planı seçin, tüm içeriklere sınırsız erişim</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {[
            { name: '1 AYLIK', price: '300 TL', link: 'https://www.shopier.com/platool/45181977' },
            { name: '3 AYLIK', price: '600 TL', link: 'https://www.shopier.com/platool/45181945', popular: true },
            { name: '12 AYLIK', price: '1.200 TL', link: 'https://www.shopier.com/platool/44083927' },
          ].map(p => (
            <div key={p.name} className={`relative rounded-2xl p-6 border transition-all duration-300 hover:scale-[1.03] ${p.popular ? 'border-[#0099ff] bg-[#0099ff]/5 shadow-lg shadow-[#0099ff]/10' : 'border-white/10 bg-white/5'}`}>
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#0099ff] to-purple-500 text-white text-xs font-semibold whitespace-nowrap shadow-lg">
                  En Popüler
                </div>
              )}
              <div className="text-center mb-6 mt-2">
                <p className="text-xs text-gray-500 tracking-widest mb-2">{p.name}</p>
                <div className="text-3xl md:text-4xl font-bold text-[#0099ff] mb-1">{p.price}</div>
              </div>
              <a href={p.link} target="_blank" rel="noopener noreferrer"
                className="block w-full py-3 rounded-xl bg-gradient-to-r from-[#0099ff] to-blue-600 text-white font-semibold text-sm text-center hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0099ff]/20">
                <ShoppingCart className="w-4 h-4" />Satın Al
              </a>
            </div>
          ))}
        </div>
        <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 max-w-xl mx-auto">
          <p className="text-xs text-gray-400 leading-relaxed text-center">
            <span className="text-yellow-400 font-semibold">📌 Önemli:</span> Satın aldıktan sonra{' '}
            <span className="text-[#0099ff] font-medium">steamixgame@yandex.com</span> mail adresine
            satın aldığınıza dair ekran görüntüsü atın. Yönetici tarafından onaylanıp en kısa sürede
            abonelik giriş bilgileriniz size teslim edilecektir.
          </p>
        </div>
      </div>
    </div>
  )
}
