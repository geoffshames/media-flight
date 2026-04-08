'use client';
import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface PasswordGateProps {
  slug: string;
  artist: string;
  tourName: string;
  legName: string;
  passwordHash: string;
  children: React.ReactNode;
}

/**
 * Simple client-side password gate. Checks the entered password against
 * a stored value and persists the unlock in sessionStorage so the user
 * doesn't have to re-enter it on every page load during their session.
 */
export function PasswordGate({
  slug,
  artist,
  tourName,
  legName,
  passwordHash,
  children,
}: PasswordGateProps) {
  const storageKey = `media-flight-auth-${slug}`;
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored === passwordHash) {
        setUnlocked(true);
      }
    } catch { /* sessionStorage unavailable */ }
    setChecking(false);
  }, [storageKey, passwordHash]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (input === passwordHash) {
      try {
        sessionStorage.setItem(storageKey, passwordHash);
      } catch { /* sessionStorage unavailable */ }
      setUnlocked(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 1500);
    }
  }, [input, passwordHash, storageKey]);

  if (checking) {
    return <div className="min-h-screen bg-surface" />;
  }

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/brand/CC-LOGO-2025-PROFILE.png"
            alt="Crowd Control Digital"
            width={48}
            height={48}
            className="rounded-full"
          />
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-surface-200 bg-surface-50/80 backdrop-blur-sm p-8">
          <div className="text-center mb-6">
            <h1 className="font-heading text-2xl font-bold text-text-primary mb-1">
              {artist}
            </h1>
            <p className="text-text-muted text-sm font-body">
              {tourName} — {legName}
            </p>
            <p className="text-text-muted text-xs font-body mt-1 tracking-wider uppercase">
              Media Flight Plan
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <input
                type="password"
                value={input}
                onChange={e => { setInput(e.target.value); setError(false); }}
                placeholder="Enter password"
                autoFocus
                className={`
                  w-full px-4 py-3 rounded-xl bg-surface-100 border text-text-primary
                  font-body text-sm placeholder:text-text-muted/50
                  focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20
                  transition-colors
                  ${error ? 'border-tier-red/50 animate-shake' : 'border-surface-200'}
                `}
              />
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-tier-red text-xs mt-2 text-center font-body"
                >
                  Incorrect password
                </motion.p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-accent text-white font-heading text-sm tracking-wider uppercase
                hover:bg-accent-light transition-colors"
            >
              View Dashboard
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-text-muted text-[11px] font-body mt-6 tracking-wide">
          Crowd Control Digital
        </p>
      </motion.div>

      {/* Shake animation */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
