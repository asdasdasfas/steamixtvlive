export function buildSteamixIntentUrl(
  type: 'movie' | 'series',
  streamId: string,
  serverUrl: string,
  user: string,
  pass: string,
  opts?: { name?: string; icon?: string; ext?: string; season?: string; episode?: string; seriesId?: string }
): string {
  const sp = new URLSearchParams({ stream_id: streamId, type, server: serverUrl, user, pass })
  if (opts?.name) sp.set('name', opts.name)
  if (opts?.icon) sp.set('icon', opts.icon)
  if (opts?.ext) sp.set('ext', opts.ext)
  if (type === 'series') {
    sp.set('season', opts?.season || '1')
    sp.set('episode', opts?.episode || '1')
    if (opts?.seriesId) sp.set('series_id', opts.seriesId)
  }
  return `steamixtv://play?${sp.toString()}`
}
