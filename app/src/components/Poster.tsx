import { useState } from 'react'
import { Film, Tv } from 'lucide-react'

interface PosterProps {
  src?: string
  type?: 'movie' | 'series' | 'channel'
  className?: string
  onClick?: () => void
}

function fixUrl(src?: string): string | undefined {
  if (!src) return src
  if (src.startsWith('/t/p/')) return `https://image.tmdb.org${src}`
  if (src.startsWith('http://')) return src.replace('http://', 'https://')
  return src
}

export default function Poster({ src, type, className, onClick }: PosterProps) {
  const [failed, setFailed] = useState(false)
  const url = fixUrl(src)

  if (!url || failed) {
    return (
      <div className={`w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center ${className || ''}`}
        onClick={onClick}>
        {type === 'series' ? <Tv className="w-5 h-5 text-gray-500" /> : <Film className="w-5 h-5 text-gray-500" />}
      </div>
    )
  }

  return (
    <div className="w-full h-full relative" onClick={onClick}>
      <img src={url} alt="" className={`w-full h-full object-cover saturate-[1.1] contrast-[1.05] ${className || ''}`} loading="lazy" onError={() => setFailed(true)} />
    </div>
  )
}