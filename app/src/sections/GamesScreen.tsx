import { useState } from 'react'
import { Loader2 } from 'lucide-react'

const GAMES = [
  { name: 'Subway Surfers', slug: 'subway-surfers' },
  { name: 'Angry Birds 2', slug: 'angry-birds-2' },
  { name: 'Stick War Legacy', slug: 'stick-war-legacy' },
  { name: 'Geometry Dash', slug: 'geometry-dash-freezenova' },
  { name: 'Temple Run 2', slug: 'temple-run-2' },
  { name: 'Cut the Rope', slug: 'cut-the-rope' },
  { name: 'Fruit Ninja', slug: 'fruit-ninja' },
  { name: 'Highway Traffic', slug: 'highway-traffic' },
  { name: '2048', slug: '2048' },
  { name: 'Doodle Jump', slug: 'doodle-jump' },
]

const SLUG_TO_EMOJI: Record<string, string> = {
  'subway-surfers': '🏃', 'angry-birds-2': '🐦', 'stick-war-legacy': '⚔️',
  'geometry-dash-freezenova': '🔥', 'temple-run-2': '🏛️', 'cut-the-rope': '🍬',
  'fruit-ninja': '🍉', 'highway-traffic': '🚗', '2048': '🔢', 'doodle-jump': '🎮',
}

const GRADIENTS: Record<string, string> = {
  'subway-surfers': 'from-orange-500 to-yellow-500',
  'angry-birds-2': 'from-red-500 to-orange-400',
  'stick-war-legacy': 'from-blue-600 to-purple-600',
  'geometry-dash-freezenova': 'from-cyan-500 to-blue-600',
  'temple-run-2': 'from-amber-700 to-yellow-600',
  'cut-the-rope': 'from-green-400 to-emerald-500',
  'fruit-ninja': 'from-red-400 to-pink-500',
  'highway-traffic': 'from-blue-500 to-indigo-600',
  '2048': 'from-purple-500 to-pink-500',
  'doodle-jump': 'from-teal-400 to-cyan-500',
}

export default function GamesScreen() {
  const [playing, setPlaying] = useState<string | null>(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)

  return (
    <div className="h-full flex flex-col bg-[#0f172a]">
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
              src={`https://www.madkidgames.com/full/${playing}`}
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
            <p className="text-xs text-gray-500 mt-1">Android oyunları tarayıcında oyna</p>
          </div>
          <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {GAMES.map(game => (
                <button key={game.slug} onClick={() => setPlaying(game.slug)}
                  className="group bg-[#1a1f35] rounded-xl overflow-hidden hover:bg-[#252b45] transition-all hover:shadow-lg hover:shadow-[#0099ff]/10 active:scale-[0.97]">
                  <div className={`aspect-[4/3] bg-gradient-to-br ${GRADIENTS[game.slug] || 'from-gray-600 to-gray-800'} flex items-center justify-center relative overflow-hidden`}>
                    <span className="text-5xl drop-shadow-xl">{SLUG_TO_EMOJI[game.slug] || '🎮'}</span>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                  <div className="p-3 text-left">
                    <p className="text-sm font-medium text-white truncate">{game.name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">HTML5 · Android</p>
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
