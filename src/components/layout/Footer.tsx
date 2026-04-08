import Image from 'next/image';

export function Footer() {
  return (
    <footer className="border-t border-surface-200 bg-surface py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/CC-LOGO-2024-WHITE.png"
              alt="CCD"
              width={24}
              height={24}
            />
            <span className="text-text-muted text-[13px] font-body tracking-wide">
              © 2025 Crowd Control Digital
            </span>
          </div>
          <span className="font-heading text-[11px] tracking-[0.4em] text-text-muted uppercase">
            Powered by Media Flight
          </span>
        </div>
      </div>
    </footer>
  );
}
