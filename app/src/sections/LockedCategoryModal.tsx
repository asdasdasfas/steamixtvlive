import { useEffect } from 'react'
import { X, Lock } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

export default function LockedCategoryModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-[#0e1116] border border-[#0099ff]/30 shadow-[0_0_40px_rgba(0,153,255,0.25)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
          aria-label="Kapat"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#0099ff]/15 flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6 text-[#0099ff]" />
          </div>
          <h3 className="text-lg font-semibold text-white">Bu bölüm kilitli</h3>
        </div>

        <p className="text-sm text-gray-300 leading-relaxed">
          Steamix TV aboneliğiniz bulunsa da bu bölümlere yalnızca{' '}
          <span className="text-[#0099ff] font-medium">Android uygulaması</span> üzerinden
          erişilebilir. Uygulamayı indirmek için Profil bölümündeki{' '}
          <span className="text-[#0099ff] font-medium">&ldquo;Mobil Uygulamayı İndir&rdquo;</span>{' '}
          seçeneğine tıklayın; televizyonunuza veya telefonunuza kurabilirsiniz.
        </p>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 rounded-xl bg-[#0099ff] text-white font-medium hover:bg-[#0a86e0] transition-colors"
        >
          Anladım
        </button>
      </div>
    </div>
  )
}
