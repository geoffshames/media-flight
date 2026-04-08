'use client';
import { motion } from 'framer-motion';

export function SectionDivider() {
  return (
    <motion.div
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className="h-px bg-gradient-to-r from-transparent via-surface-200/60 to-transparent origin-left"
    />
  );
}
