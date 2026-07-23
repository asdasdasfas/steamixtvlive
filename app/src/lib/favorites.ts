const STORAGE_KEY = 'steamix_favorites'

export interface FavoriteItem {
  id: number
  type: 'movie' | 'series'
  name: string
  image: string
  addedAt: number
}

export function getFavorites(): FavoriteItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch { return [] }
}

export function addFavorite(item: FavoriteItem) {
  const list = getFavorites().filter(f => !(f.id === item.id && f.type === item.type))
  list.unshift(item)
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) } catch {}
}

export function removeFavorite(id: number, type: string) {
  const list = getFavorites().filter(f => !(f.id === id && f.type === type))
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) } catch {}
}

export function isFavorite(id: number, type: string): boolean {
  return getFavorites().some(f => f.id === id && f.type === type)
}

export function toggleFavorite(item: FavoriteItem): boolean {
  if (isFavorite(item.id, item.type)) {
    removeFavorite(item.id, item.type)
    return false
  } else {
    addFavorite(item)
    return true
  }
}
