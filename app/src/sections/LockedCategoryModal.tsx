import { useEffect } from 'react'
import { X, Lock, Download, Smartphone } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  apkUrl: string
}

export default function LockedCategoryModal({ open, onClose, apkUrl }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const handleDownload = () => {
    window.open(apkUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-gradient-to-b from-[#11161d] to-[#0a0d12] border border-[#0099ff]/30 shadow-[0_0_50px_rgba(0,153,255,0.3)] p-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Arka plan parıltısı */}
        <div className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full bg-[#0099ff]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-purple-500/15 blur-3xl" />

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-10"
          aria-label="Kapat"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0099ff] to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-[#0099ff]/30">
              <Smartphone className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Bu içerik yalnızca</h3>
              <h3 className="text-base font-bold text-[#0099ff] leading-tight">Android uygulamamıza özeldir</h3>
            </div>
          </div>

          <p className="text-sm text-gray-300 leading-relaxed mb-2">
            Steamix TV aboneliğiniz bulunsa da bu bölümlere yalnızca{' '}
            <span className="text-white font-medium">Android uygulaması</span> üzerinden erişilebilir.
          </p>
          <p className="text-sm text-gray-400 leading-relaxed mb-5">
            Uygulamayı indirmek için Profil bölümündeki{' '}
            <span className="text-[#0099ff] font-medium">&ldquo;Mobil Uygulamayı İndir&rdquo;</span>{' '}
            seçeneğine tıklayıp; televizyonunuza veya telefonunuza kurabilirsiniz.
          </p>

          <button
            onClick={handleDownload}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0099ff] to-blue-600 text-white text-sm font-semibold hover:shadow-[0_0_30px_rgba(0,153,255,0.55)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />Mobil Uygulamayı İndir
          </button>

          <button
            onClick={onClose}
            className="mt-2 w-full py-2.5 rounded-xl text-gray-400 text-sm font-medium hover:text-white hover:bg-white/5 transition-colors"
          >
            Şimdi Değil
          </button>
        </div>
      </div>
    </div>
  )
}
