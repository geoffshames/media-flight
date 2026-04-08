import Image from 'next/image';

export function Footer() {
  return (
    <footer className="border-t border-surface-200 bg-surface py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/CC-LOGO-2025-PROFILE.png"
              alt="Crowd Control Digital"
              width={24}
              height={24}
              className="rounded-full"
            />
            <span className="text-text-muted text-[13px] font-body tracking-wide">
              © 2026 Crowd Control Digital
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-body text-[11px] tracking-[0.2em] text-text-muted uppercase">
              Powered by
            </span>
            <Image
              src="/brand/CC-LOGO-2024-WHITE.png"
              alt="Crowd Control Digital"
              width={100}
              height={24}
              className="opacity-80"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
