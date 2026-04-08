'use client';
import { motion } from 'framer-motion';
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
}

export function GlassCard({
  children,
  className = '',
  delay = 0,
  hover = true,
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hover ? { y: -4, transition: { duration: 0.3 } } : undefined}
      className={`
        relative rounded-xl border border-surface-200 bg-surface-50/80
        backdrop-blur-sm p-5 sm:p-6
        transition-all duration-300
        ${hover ? 'hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
