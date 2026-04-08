import Image from 'next/image';

export function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md">
      <div className="h-px bg-gradient-to-r from-accent via-accent/60 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/CC-LOGO-2024-WHITE.png"
            alt="CCD"
            width={28}
            height={28}
            priority
          />
          <span className="font-heading text-[13px] tracking-[0.3em] text-text-primary uppercase">
            Media Flight
          </span>
        </div>
        <span className="font-heading text-[11px] tracking-[0.4em] text-text-muted uppercase">
          Crowd Control Digital
        </span>
      </div>
    </nav>
  );
}
