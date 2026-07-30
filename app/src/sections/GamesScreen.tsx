import { useState } from 'react'

const GAMES = [
  { name: 'Subway Surfers', slug: 'subway-surfers', thumb: 'https://img.gamezop.com/games/subway-surfers/icon.webp' },
  { name: 'Angry Birds 2', slug: 'angry-birds-2', thumb: 'https://img.gamezop.com/games/angry-birds-2/icon.webp' },
  { name: 'Stick War Legacy', slug: 'stick-war-legacy', thumb: 'https://img.gamezop.com/games/stick-war-legacy/icon.webp' },
  { name: 'Geometry Dash', slug: 'geometry-dash', thumb: 'https://img.gamezop.com/games/geometry-dash/icon.webp' },
  { name: 'Temple Run 2', slug: 'temple-run-2', thumb: 'https://img.gamezop.com/games/temple-run-2/icon.webp' },
  { name: 'Cut the Rope', slug: 'cut-the-rope', thumb: 'https://img.gamezop.com/games/cut-the-rope/icon.webp' },
  { name: 'Fruit Ninja', slug: 'fruit-ninja', thumb: 'https://img.gamezop.com/games/fruit-ninja/icon.webp' },
  { name: 'Highway Traffic', slug: 'highway-traffic', thumb: 'https://img.gamezop.com/games/highway-traffic/icon.webp' },
  { name: '2048', slug: '2048', thumb: 'https://img.gamezop.com/games/2048/icon.webp' },
  { name: 'Doodle Jump', slug: 'doodle-jump', thumb: 'https://img.gamezop.com/games/doodle-jump/icon.webp' },
]

export default function GamesScreen() {
  const [playing, setPlaying] = useState<string | null>(null)

  return (
    <div className="h-full flex flex-col bg-[#0f172a]">
      {playing ? (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#1a1f35] border-b border-white/5">
            <button onClick={() => setPlaying(null)}
              className="px-4 py-1.5 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20 transition-colors">
              ← Geri
            </button>
            <span className="text-sm font-semibold text-white">{GAMES.find(g => g.slug === playing)?.name}</span>
          </div>
          <iframe
            src={`https://www.madkidgames.com/full/${playing}`}
            className="flex-1 w-full"
            allowFullScreen
            allow="autoplay; fullscreen; gamepad"
            style={{ border: 'none' }}
          />
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {GAMES.map(game => (
                <button key={game.slug} onClick={() => setPlaying(game.slug)}
                  className="group bg-[#1a1f35] rounded-xl overflow-hidden hover:bg-[#252b45] transition-all hover:shadow-lg hover:shadow-[#0099ff]/10 active:scale-[0.98]">
                  <div className="aspect-[4/3] bg-[#0f172a] flex items-center justify-center">
                    <span className="text-4xl opacity-30 group-hover:opacity-50 transition-opacity">
                      {game.name === 'Subway Surfers' ? '🏃' :
                       game.name === 'Angry Birds 2' ? '🐦' :
                       game.name === 'Stick War Legacy' ? '⚔️' :
                       game.name === 'Geometry Dash' ? '🔥' :
                       game.name === 'Temple Run 2' ? '🏛️' :
                       game.name === 'Cut the Rope' ? '🍬' :
                       game.name === 'Fruit Ninja' ? '🍉' :
                       game.name === 'Highway Traffic' ? '🚗' :
                       game.name === '2048' ? '🔢' : '🎮'}
                    </span>
                  </div>
                  <div className="p-2.5 text-left">
                    <p className="text-xs font-medium text-white truncate">{game.name}</p>
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
