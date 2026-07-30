import { useState } from 'react'
import { Loader2 } from 'lucide-react'

const GAMES = [
  { name: 'Neon Run', slug: 'neon-run', emoji: '🏃' },
  { name: 'Cut the Rope', slug: 'cut-the-rope', emoji: '🍬' },
  { name: 'Fruit Slash', slug: 'fruit-slash', emoji: '🍉' },
  { name: 'Slope', slug: 'slope', emoji: '⚪' },
  { name: '2048', slug: '2048', emoji: '🔢' },
  { name: 'Drive Fury', slug: 'drive-fury', emoji: '🚗' },
  { name: 'Block Blast', slug: 'block-blast', emoji: '🧱' },
  { name: 'T-Rex Dino', slug: 't-rex', emoji: '🦖' },
  { name: 'Cookie Clicker', slug: 'cookie-clicker', emoji: '🍪' },
  { name: 'Chess', slug: 'chess', emoji: '♟️' },
]

const GRADIENTS: Record<string, string> = {
  'neon-run': 'from-purple-500 to-pink-500',
  'cut-the-rope': 'from-green-400 to-emerald-500',
  'fruit-slash': 'from-red-400 to-pink-500',
  'slope': 'from-cyan-500 to-blue-600',
  '2048': 'from-amber-500 to-yellow-600',
  'drive-fury': 'from-orange-500 to-red-500',
  'block-blast': 'from-blue-500 to-indigo-600',
  't-rex': 'from-teal-400 to-cyan-500',
  'cookie-clicker': 'from-yellow-400 to-orange-500',
  'chess': 'from-gray-600 to-gray-900',
}

export default function GamesScreen() {
  const [playing, setPlaying] = useState<string | null>(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-[#0f172a]">
      {playing ? (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#1a1f35] border-b border-white/5">
            <button onClick={() => { setPlaying(null); setIframeLoaded(false) }}
              className="px-4 py-1.5 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20 transition-colors">
              ← Geri
            </button>
            <span className="text-sm font-semibold text-white">{GAMES.find(g => g.slug === playing)?.name}</span>
          </div>
          <div className="flex-1 relative">
            {!iframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#0099ff] animate-spin" />
              </div>
            )}
            <iframe
              src={`https://gamezipper.com/${playing}/`}
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
          <div className="px-4 md:px-6 pt-4 pb-3">
            <h2 className="text-base font-bold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              🎮 Oyunlar <span className="text-xs text-gray-500 font-normal">({GAMES.length} oyun)</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">Reklamsız HTML5 oyunlar</p>
          </div>
          <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {GAMES.map(game => (
                <button key={game.slug} onClick={() => setPlaying(game.slug)}
                  className="group bg-[#1a1f35] rounded-xl overflow-hidden hover:bg-[#252b45] transition-all hover:shadow-lg hover:shadow-[#0099ff]/10 active:scale-[0.97]">
                  <div className={`aspect-[4/3] bg-gradient-to-br ${GRADIENTS[game.slug] || 'from-gray-600 to-gray-800'} flex items-center justify-center relative overflow-hidden`}>
                    <span className="text-5xl drop-shadow-xl">{game.emoji}</span>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                  <div className="p-3 text-left">
                    <p className="text-sm font-medium text-white truncate">{game.name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Reklamsız</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
