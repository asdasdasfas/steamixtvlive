export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <style>{`@keyframes slowPanRight { 0% { transform: translateX(-150px) } 50% { transform: translateX(150px) } 100% { transform: translateX(-150px) } }`}</style>
      <div className="absolute" style={{
        top: '-165px', bottom: '-165px', left: '-165px', right: '-165px',
        backgroundImage: 'url(/images/login.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'brightness(0.4) blur(1px)',
        animation: 'slowPanRight 60s ease-in-out infinite',
      }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/70" />
    </div>
  )
}