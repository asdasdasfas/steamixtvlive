import { useState, useEffect, useCallback } from 'react'
import { Loader2, Send, Trash2, RefreshCw, Radio } from 'lucide-react'
import { getKanalKomutlari, insertKanalKomutu, deleteKanalKomutu, type KanalKomutu } from '@/lib/supabase'

const islemler = [
  { value: 'gizle', label: 'Gizle', aciklama: 'Kanal listeden gizlenir' },
  { value: 'göster', label: 'Göster', aciklama: 'Gizlenen kanal geri getirilir' },
  { value: 'ekle', label: 'Veri Değiştir', aciklama: 'Kanalın yayını çalışan numaraya bağlanır (ad aynı kalır)' },
  { value: 'isim', label: 'İsim Değiştir', aciklama: 'Kanalın adı değiştirilir' },
]

export default function KanalYonetimPanel() {
  const [islem, setIslem] = useState('gizle')
  const [sunucu, setSunucu] = useState('')
  const [kategori, setKategori] = useState('')
  const [streamId, setStreamId] = useState('')
  const [kanalAdi, setKanalAdi] = useState('')
  const [komutlar, setKomutlar] = useState<KanalKomutu[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const yenile = useCallback(async () => {
    setLoading(true)
    setKomutlar(await getKanalKomutlari())
    setLoading(false)
  }, [])

  useEffect(() => { yenile() }, [yenile])

  const gonder = async () => {
    const id = parseInt(streamId)
    if (!id) {
      setMsg({ ok: false, text: 'Kanal numarası girin (örn. 193970)' })
      return
    }
    if ((islem === 'ekle' || islem === 'isim') && !kanalAdi.trim()) {
      setMsg({ ok: false, text: 'Bu işlem için kanal adı gerekli' })
      return
    }
    setSending(true)
    const ok = await insertKanalKomutu({
      islem,
      stream_id: id,
      sunucu: sunucu.trim(),
      kategori_id: kategori ? parseInt(kategori) : undefined,
      kanal_adi: kanalAdi.trim(),
    })
    setSending(false)
    if (ok) {
      setMsg({ ok: true, text: 'Komut gönderildi. Uygulamalar 30 saniye içinde otomatik uygular.' })
      setStreamId('')
      setKanalAdi('')
      yenile()
    } else {
      setMsg({ ok: false, text: 'Gönderilemedi. Tabloya INSERT izni eklenmemiş olabilir — SQL Editor\'de: create policy "kanal_yonetim_insert" on public.kanal_yonetim for insert with check (true);' })
    }
  }

  const sil = async (id: number) => {
    if (!confirm('Bu komut silinsin mi?')) return
    await deleteKanalKomutu(id)
    yenile()
  }

  const aktifIslem = islemler.find(i => i.value === islem)

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 bg-[#0099ff] rounded-full" />
        <h2 className="text-sm font-bold text-white tracking-widest flex-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          YAYIN <span className="text-[#0099ff]">YÖNETİMİ</span>
        </h2>
        <button onClick={yenile} disabled={loading} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl p-5 md:p-6 border border-white/10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">İşlem</label>
            <select value={islem} onChange={e => setIslem(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#0099ff] transition-colors">
              {islemler.map(i => (
                <option key={i.value} value={i.value} className="bg-gray-900">{i.label}</option>
              ))}
            </select>
            <p className="text-[10px] text-gray-600 mt-1">{aktifIslem?.aciklama}</p>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Kanal Numarası</label>
            <input value={streamId} onChange={e => setStreamId(e.target.value)} inputMode="numeric" placeholder="örn. 193970"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#0099ff] transition-colors" />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Sunucu <span className="text-gray-700">(boş = hepsi)</span></label>
            <input value={sunucu} onChange={e => setSunucu(e.target.value)} placeholder="örn. ctn34.xyz — boş bırakırsan her cihazda uygulanır"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#0099ff] transition-colors" />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Kanal Adı <span className="text-gray-700">(Veri/İsim için)</span></label>
            <input value={kanalAdi} onChange={e => setKanalAdi(e.target.value)} placeholder="örn. S Sport Plus 1"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#0099ff] transition-colors" />
          </div>
        </div>

        {msg && (
          <div className={`mb-3 px-4 py-2.5 rounded-xl text-xs ${msg.ok ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {msg.text}
          </div>
        )}

        <button onClick={gonder} disabled={sending}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0099ff] to-blue-600 text-white text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0099ff]/20 disabled:opacity-50">
          {sending ? <><Loader2 className="w-4 h-4 animate-spin" />Gönderiliyor...</> : <><Send className="w-4 h-4" />Komutu Gönder</>}
        </button>
      </div>

      <div className="mt-4">
        <h3 className="text-xs font-semibold text-gray-500 tracking-widest mb-3 flex items-center gap-2">
          <Radio className="w-3.5 h-3.5" /> BEKLEYEN / GÖNDERİLEN KOMUTLAR ({komutlar.length})
        </h3>
        {komutlar.length === 0 ? (
          <p className="text-xs text-gray-600 bg-white/[0.02] border border-white/5 rounded-xl p-4">Henüz komut yok.</p>
        ) : (
          <div className="space-y-2">
            {komutlar.map(k => (
              <div key={k.id} className="flex items-center gap-3 bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3">
                <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                  k.islem === 'gizle' || k.islem === 'cikar' ? 'bg-red-500/10 text-red-400' :
                  k.islem === 'göster' || (k.islem === 'ekle' && !k.kanal_adi) ? 'bg-green-500/10 text-green-400' :
                  'bg-[#0099ff]/10 text-[#0099ff]'
                }`}>
                  {k.islem}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    #{k.stream_id}{k.kanal_adi ? ` · ${k.kanal_adi}` : ''}
                  </p>
                  <p className="text-[10px] text-gray-600 truncate">
                    sunucu: {k.sunucu || '(hepsi)'} · durum: {k.durum}
                  </p>
                </div>
                <button onClick={() => sil(k.id)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
