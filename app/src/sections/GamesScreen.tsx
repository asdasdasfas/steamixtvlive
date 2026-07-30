import { useState, useRef, useCallback, useEffect } from 'react'
import { Loader2, Maximize2, Minimize2, ArrowLeft } from 'lucide-react'

const GAMES = [
  { name: 'Slope', slug: 'slope', cat: 'Arcade' },
  { name: '2048', slug: '2048', cat: 'Puzzle' },
  { name: 'Snake', slug: 'snake', cat: 'Arcade' },
  { name: 'Tetris', slug: 'tetris', cat: 'Puzzle' },
  { name: 'Chess', slug: 'chess', cat: 'Puzzle' },
  { name: 'Cut the Rope', slug: 'cut-the-rope', cat: 'Puzzle' },
  { name: 'Sudoku', slug: 'sudoku', cat: 'Puzzle' },
  { name: 'Solitaire', slug: 'solitaire', cat: 'Puzzle' },
  { name: 'Pong', slug: 'pong', cat: 'Arcade' },
  { name: 'Doodle Jump', slug: 'doodle-jump', cat: 'Arcade' },
  { name: 'Neon Dash', slug: 'neon-dash', cat: 'Arcade' },
  { name: 'Slice Master', slug: 'slice-master', cat: 'Puzzle' },
  { name: 'T-Rex Dino', slug: 't-rex', cat: 'Arcade' },
  { name: 'Drive Fury', slug: 'drive-fury', cat: 'Arcade' },
  { name: 'Cookie Clicker', slug: 'cookie-clicker', cat: 'Idle' },
  { name: 'Flappy Wings', slug: 'flappy-wings', cat: 'Arcade' },
  { name: 'Brick Breaker', slug: 'brick-breaker', cat: 'Arcade' },
  { name: 'Minesweeper', slug: 'minesweeper', cat: 'Puzzle' },
  { name: 'Crossword', slug: 'crossword', cat: 'Puzzle' },
  { name: 'Wordle', slug: 'wordle', cat: 'Puzzle' },
  { name: 'Basketball Shoot', slug: 'basketball-shoot', cat: 'Arcade' },
  { name: 'Pinball', slug: 'pinball', cat: 'Arcade' },
  { name: 'Helix Jump', slug: 'helix-jump', cat: 'Arcade' },
  { name: 'Doodle Jump', slug: 'doodle-jump', cat: 'Arcade' },
  { name: 'Paper.io', slug: 'paper-io', cat: 'Arcade' },
  { name: 'Monkey Mart', slug: 'monkey-mart', cat: 'Arcade' },
  { name: 'Eggy Car', slug: 'eggy-car', cat: 'Arcade' },
  { name: 'Drift Boss', slug: 'drift-boss', cat: 'Arcade' },
  { name: 'Snow Rider', slug: 'snow-rider', cat: 'Arcade' },
  { name: 'Stack Ball', slug: 'stack-ball', cat: 'Arcade' },
  { name: 'Knife Hit', slug: 'knife-hit', cat: 'Arcade' },
  { name: 'Bounce Bot', slug: 'bounce-bot', cat: 'Arcade' },
  { name: 'Level Devil', slug: 'level-devil', cat: 'Arcade' },
  { name: 'Gravity Run', slug: 'gravity-run', cat: 'Arcade' },
  { name: 'Stickman Swing', slug: 'stickman-swing', cat: 'Arcade' },
  { name: 'Stickman Escape', slug: 'stickman-escape', cat: 'Arcade' },
  { name: 'Bottle Flip 3D', slug: 'bottle-flip-3d', cat: 'Arcade' },
  { name: 'Snake vs Block', slug: 'snake-vs-block', cat: 'Arcade' },
  { name: 'Magic Sort', slug: 'magic-sort', cat: 'Puzzle' },
  { name: 'Bubble Pop', slug: 'bubble-pop', cat: 'Puzzle' },
  { name: 'Bubble Shooter', slug: 'bubble-shooter', cat: 'Puzzle' },
  { name: 'Mahjong', slug: 'mahjong-solitaire', cat: 'Puzzle' },
  { name: 'Tile Dynasty', slug: 'tile-dynasty', cat: 'Puzzle' },
  { name: 'Crystal Sort', slug: 'color-sort', cat: 'Puzzle' },
  { name: 'Watermelon Merge', slug: 'watermelon-merge', cat: 'Puzzle' },
  { name: 'Sushi Stack', slug: 'sushi-stack', cat: 'Puzzle' },
  { name: 'Bolt Jam 3D', slug: 'bolt-jam-3d', cat: 'Puzzle' },
  { name: 'Wood Block', slug: 'wood-block-puzzle', cat: 'Puzzle' },
  { name: 'Parking Jam', slug: 'parking-jam', cat: 'Puzzle' },
  { name: 'Unblock Me', slug: 'unblock-me', cat: 'Puzzle' },
  { name: 'Pipe Connect', slug: 'pipe-connect', cat: 'Puzzle' },
  { name: 'Hex Block', slug: 'hex-block', cat: 'Puzzle' },
  { name: 'Flow Connect', slug: 'flow-connect', cat: 'Puzzle' },
  { name: 'Wordscapes', slug: 'wordscapes', cat: 'Puzzle' },
  { name: 'Jigsaw', slug: 'jigsaw-puzzle', cat: 'Puzzle' },
  { name: 'Nonogram', slug: 'nonogram', cat: 'Puzzle' },
  { name: 'Number Match', slug: 'number-match', cat: 'Puzzle' },
  { name: 'Tangram', slug: 'tangram', cat: 'Puzzle' },
  { name: 'Pull the Pin', slug: 'pull-the-pin', cat: 'Puzzle' },
  { name: 'Sand Balls', slug: 'sand-balls', cat: 'Puzzle' },
  { name: 'Fill The Fridge', slug: 'fill-fridge', cat: 'Puzzle' },
  { name: 'Little Alchemy', slug: 'little-alchemy', cat: 'Puzzle' },
  { name: 'Brain Out', slug: 'brain-out', cat: 'Puzzle' },
  { name: 'Trivia Crack', slug: 'trivia-crack', cat: 'Puzzle' },
  { name: 'Tic Tac Toe', slug: 'tic-tac-toe', cat: 'Puzzle' },
  { name: 'Reversi', slug: 'reversi', cat: 'Puzzle' },
  { name: 'Connect Four', slug: 'connect-four', cat: 'Puzzle' },
  { name: 'Hangman', slug: 'hangman', cat: 'Puzzle' },
  { name: 'Dominoes', slug: 'dominoes', cat: 'Puzzle' },
  { name: 'Checkers', slug: 'checkers', cat: 'Puzzle' },
  { name: 'Gomoku', slug: 'gomoku', cat: 'Puzzle' },
  { name: 'Yahtzee', slug: 'yahtzee', cat: 'Puzzle' },
  { name: 'Sliding Puzzle', slug: 'sliding-puzzle', cat: 'Puzzle' },
  { name: 'Peg Solitaire', slug: 'peg-solitaire', cat: 'Puzzle' },
  { name: 'Tower of Hanoi', slug: 'tower-of-hanoi', cat: 'Puzzle' },
  { name: 'Simon Says', slug: 'simon-says', cat: 'Puzzle' },
  { name: 'Maze Runner', slug: 'maze-runner', cat: 'Puzzle' },
  { name: 'Word Search', slug: 'word-search', cat: 'Puzzle' },
  { name: 'Spot the Diff', slug: 'spot-the-difference', cat: 'Puzzle' },
  { name: 'Hidden Object', slug: 'hidden-object', cat: 'Puzzle' },
  { name: 'Jewel Crush', slug: 'jewel-crush', cat: 'Puzzle' },
  { name: 'Bejeweled', slug: 'bejeweled', cat: 'Puzzle' },
  { name: 'Cover Orange', slug: 'cover-orange', cat: 'Puzzle' },
  { name: 'Fireboy&Watergirl', slug: 'fireboy-watergirl', cat: 'Puzzle' },
  { name: 'Physics Draw', slug: 'physics-draw-puzzle', cat: 'Puzzle' },
  { name: 'Dots and Boxes', slug: 'dots-and-boxes', cat: 'Puzzle' },
  { name: 'Word Connect', slug: 'word-connections', cat: 'Puzzle' },
  { name: 'Marble Shooter', slug: 'marble-shooter', cat: 'Puzzle' },
  { name: 'Bridge Builder', slug: 'bridge-builder', cat: 'Puzzle' },
  { name: 'Screw Jam', slug: 'screw-jam', cat: 'Puzzle' },
  { name: 'Escape Manor', slug: 'escape-manor', cat: 'Puzzle' },
  { name: 'Tower Defense', slug: 'tower-defense', cat: 'Puzzle' },
  { name: 'Rope Rescue', slug: 'rope-rescue', cat: 'Puzzle' },
  { name: 'Ice Breaker', slug: 'ice-breaker', cat: 'Puzzle' },
  { name: 'Happy Glass', slug: 'happy-glass', cat: 'Puzzle' },
  { name: 'Mekorama', slug: 'mekorama', cat: 'Puzzle' },
  { name: 'Blockudoku', slug: 'blockudoku', cat: 'Puzzle' },
  { name: 'Infinity Loop', slug: 'infinity-loop', cat: 'Puzzle' },
  { name: 'Tidy Up 3D', slug: 'tidy-up-3d', cat: 'Puzzle' },
  { name: 'Poly Art 3D', slug: 'poly-art-3d', cat: 'Puzzle' },
  { name: 'Pop Them', slug: 'pop-them', cat: 'Puzzle' },
  { name: 'Ball Sort', slug: 'ball-sort', cat: 'Puzzle' },
  { name: 'Word Scramble', slug: 'word-scramble', cat: 'Puzzle' },
  { name: 'Peg Blast', slug: 'peg-blast', cat: 'Puzzle' },
  { name: 'Mini Golf', slug: 'mini-golf', cat: 'Puzzle' },
]

const GAME_EMOJIS: Record<string, string> = {
  slope: '🔴', '2048': '🌌', snake: '🐍', tetris: '🧱', chess: '♔',
  'cut-the-rope': '🍬', sudoku: '🧩', solitaire: '🃏', pong: '🏓',
  'doodle-jump': '🐸', 'neon-dash': '⚡', 'slice-master': '🔪',
  't-rex': '🦖', 'drive-fury': '🏎️', 'cookie-clicker': '🍪',
  'flappy-wings': '🐦', 'brick-breaker': '🧱', minesweeper: '💣',
  crossword: '✏️', wordle: '🔤', 'basketball-shoot': '🏀',
  pinball: '🎱', 'helix-jump': '🌀', 'paper-io': '📦',
  'monkey-mart': '🐵', 'eggy-car': '🥚', 'drift-boss': '🏎️',
  'snow-rider': '🏂', 'stack-ball': '🔴', 'knife-hit': '🗡',
  'bounce-bot': '🤖', 'level-devil': '😈', 'gravity-run': '🏃',
  'stickman-swing': '🏃', 'stickman-escape': '🏃', 'bottle-flip-3d': '🍾',
  'snake-vs-block': '🐍', 'magic-sort': '🧪', 'bubble-pop': '🫧',
  'bubble-shooter': '🫧', 'mahjong-solitaire': '🀄', 'tile-dynasty': '🀄',
  'color-sort': '🧊', 'watermelon-merge': '🍉', 'sushi-stack': '🍣',
  'bolt-jam-3d': '🔩', 'wood-block-puzzle': '🪵', 'parking-jam': '🚗',
  'unblock-me': '🧱', 'pipe-connect': '🔧', 'hex-block': '⬡',
  'flow-connect': '🔗', wordscapes: '🌿', 'jigsaw-puzzle': '🧩',
  nonogram: '🔲', 'number-match': '🔢', tangram: '🔺',
  'pull-the-pin': '📌', 'sand-balls': '🏐', 'fill-fridge': '🧊',
  'little-alchemy': '⚗️', 'brain-out': '🧠', 'trivia-crack': '❓',
  'tic-tac-toe': '⭕', reversi: '⚫', 'connect-four': '🔴',
  hangman: '🎯', dominoes: '🁣', checkers: '⬤', gomoku: '⚫',
  yahtzee: '🎲', 'sliding-puzzle': '🔢', 'peg-solitaire': '⚪',
  'tower-of-hanoi': '🏰', 'simon-says': '🧠', 'maze-runner': '🏃',
  'word-search': '🔍', 'spot-the-difference': '🔍', 'hidden-object': '🔍',
  'jewel-crush': '💎', bejeweled: '💎', 'cover-orange': '🍊',
  'fireboy-watergirl': '🔥', 'physics-draw-puzzle': '✏️', 'dots-and-boxes': '⬜',
  'word-connections': '🔗', 'marble-shooter': '🔮', 'bridge-builder': '🌉',
  'screw-jam': '🔩', 'escape-manor': '🏚️', 'tower-defense': '🏰',
  'rope-rescue': '🪢', 'ice-breaker': '🧊', 'happy-glass': '🥛',
  mekorama: '🤖', blockudoku: '🧩', 'infinity-loop': '♾️',
  'tidy-up-3d': '🧹', 'poly-art-3d': '🎨', 'pop-them': '💥',
  'ball-sort': '🎱', 'word-scramble': '🔤', 'peg-blast': '🎯',
  'mini-golf': '⛳',
}

const uniqueGames = GAMES.filter((g, i, a) => a.findIndex(x => x.slug === g.slug) === i)

export default function GamesScreen() {
  const [playing, setPlaying] = useState<string | null>(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const playerRef = useRef<HTMLDivElement>(null)

  const game = playing ? uniqueGames.find(g => g.slug === playing) : null

  const toggleFullscreen = useCallback(async () => {
    if (!playerRef.current) return
    try {
      if (!document.fullscreenElement) {
        await playerRef.current.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch { /* not supported */ }
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const handleImgError = (slug: string) => {
    setImgErrors(prev => new Set(prev).add(slug))
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-[#0f172a]">
      {playing ? (
        <div ref={playerRef} className="flex-1 flex flex-col bg-black relative">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1f35] border-b border-white/5 z-10">
            <button onClick={() => { setPlaying(null); setIframeLoaded(false) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Geri
            </button>
            <span className="text-sm font-semibold text-white flex-1 truncate">{game?.name}</span>
            <button onClick={toggleFullscreen}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20 transition-colors">
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              {isFullscreen ? 'Küçült' : 'Tam Ekran'}
            </button>
          </div>
          <div className="flex-1 relative">
            {!iframeLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-[#0099ff] animate-spin" />
                <span className="text-xs text-gray-500">Oyun yükleniyor...</span>
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
          <div className="px-4 md:px-6 pt-4 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                🎮 Oyunlar
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">{uniqueGames.length} reklamsız HTML5 oyun</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6 scrollbar-thin">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {uniqueGames.map((game, i) => {
                const hue = (i * 47) % 360
                const grad = `linear-gradient(135deg, hsl(${hue},60%,30%), hsl(${(hue + 60) % 360},60%,20%))`
                const showImg = playing === null && !imgErrors.has(game.slug)
                return (
                  <button key={game.slug} onClick={() => { setPlaying(game.slug); setIframeLoaded(false) }}
                    className="group bg-[#1a1f35] rounded-xl overflow-hidden hover:bg-[#252b45] transition-all hover:shadow-lg hover:shadow-[#0099ff]/10 active:scale-[0.97] text-left">
                    <div className="aspect-[4/3] relative overflow-hidden" style={{ background: grad }}>
                      {showImg && (
                        <img
                          src={`https://gamezipper.com/og-images/${game.slug}.png`}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={() => handleImgError(game.slug)}
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-4xl drop-shadow-xl opacity-60">{GAME_EMOJIS[game.slug] || '🎮'}</span>
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                    <div className="p-2.5">
                      <p className="text-sm font-medium text-white truncate">{game.name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{game.cat}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
