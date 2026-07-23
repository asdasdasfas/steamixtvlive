import { useEffect, useRef, useState } from 'react';
import { useLang } from '@/lib/language';

export default function ScreenshotsTV() {
  useLang();
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); obs.unobserve(entry.target); } },
      { threshold: 0.1 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="screenshots" ref={ref} className="relative w-full py-6 md:py-20 bg-[#0f172a] overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className={`text-center mb-8 md:mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Uygulama <span className="text-gradient">Ekran Görüntüleri</span>
          </h2>
          <p className="text-gray-500 mt-2">Steamix TV arayüzünden kareler</p>
        </div>
      </div>
    </section>
  );
}
