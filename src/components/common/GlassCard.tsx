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
      transition={{ duration: 0.5, delay }}
      whileHover={hover ? { y: -4 } : undefined}
      className={`
        relative rounded-lg border border-surface-200 bg-surface-50/50
        backdrop-blur-sm p-4 sm:p-6
        transition-colors duration-300
        ${hover ? 'hover:border-accent/30 hover:bg-surface-50/70' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
