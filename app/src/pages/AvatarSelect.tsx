import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '@/lib/language'
import { useAuth } from '@/hooks/use-auth'
import { Check, Loader2 } from 'lucide-react'

const avatars = [1, 2, 3, 4, 5]

export default function AvatarSelect() {
  const { t } = useLang()
  const { saveAvatar } = useAuth()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const handleConfirm = async () => {
    if (!selected) return
    setSaving(true)
    const ok = await saveAvatar(selected)
    if (ok) navigate('/dashboard', { replace: true })
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-[#0099ff]/10 rounded-full blur-[150px]" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>
      <div className="relative z-10 text-center mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>{t('avatar.title')}</h1>
        <p className="text-sm text-gray-500">Kendinize bir avatar seçin</p>
      </div>
      <div className="relative z-10 grid grid-cols-3 md:grid-cols-5 gap-4 md:gap-6 mb-10">
        {avatars.map(id => (
          <button key={id} onClick={() => setSelected(id)}
            className={`relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden ring-2 transition-all duration-300 ${
              selected === id ? 'ring-[#0099ff] ring-offset-4 ring-offset-[#0f172a] scale-110' : 'ring-white/10 hover:scale-105'
            }`}>
            <img src={`/images/avatar${id}.jpg`} alt="" className="w-full h-full object-cover" />
            {selected === id && (
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#0099ff] flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
      <div className="relative z-10">
        <button onClick={handleConfirm} disabled={!selected || saving}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#0099ff] to-purple-500 text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-40 flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {t('avatar.button')}
        </button>
      </div>
    </div>
  )
}
