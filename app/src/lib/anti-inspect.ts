export function initAntiInspect() {
  const params = new URLSearchParams(window.location.search)
  if (params.has('kon')) return

  document.addEventListener('contextmenu', (e) => { e.preventDefault(); return false })

  document.addEventListener('keydown', (e) => {
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
      (e.ctrlKey && e.key.toUpperCase() === 'U')
    ) {
      e.preventDefault()
      return false
    }
  })

  let devtoolsOpen = false
  const check = () => {
    const threshold = 160
    const widthDiff = window.outerWidth - window.innerWidth > threshold
    const heightDiff = window.outerHeight - window.innerHeight > threshold
    if ((widthDiff || heightDiff) && !devtoolsOpen) {
      devtoolsOpen = true
      document.title = 'Geliştirici Araçları Tespit Edildi'
      document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#000;color:#fff;font-family:sans-serif;font-size:18px">Geliştirici araçları bu sitede kullanılamaz.</div>'
    }
  }
  setInterval(check, 1000)
}
