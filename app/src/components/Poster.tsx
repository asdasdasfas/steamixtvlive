import { useState } from 'react'
import { Film, Tv } from 'lucide-react'

interface PosterProps {
  src?: string
  type?: 'movie' | 'series' | 'channel'
  className?: string
  onClick?: () => void
}

export default function Poster({ src, type, className, onClick }: PosterProps) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className={`w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center ${className || ''}`}
        onClick={onClick}>
        {type === 'series' ? <Tv className="w-5 h-5 text-gray-500" /> : <Film className="w-5 h-5 text-gray-500" />}
      </div>
    )
  }

  return (
    <div className="w-full h-full relative" onClick={onClick}>
      <img src={src} alt="" className={`w-full h-full object-cover ${className || ''}`} loading="lazy" onError={() => setFailed(true)} />
    </div>
  )
}