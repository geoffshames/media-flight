'use client';
import { motion } from 'framer-motion';
import { useInView } from '@/hooks/useInView';

interface AnimatedNumberProps {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}

export function AnimatedNumber({
  value,
  format = (n) => n.toLocaleString('en-US'),
  duration = 1.5,
  className = '',
}: AnimatedNumberProps) {
  const { ref, inView } = useInView();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : { opacity: 0 }}
      className={className}
    >
      <AnimatedCounter value={value} format={format} duration={duration} isVisible={inView} />
    </motion.div>
  );
}

function AnimatedCounter({
  value,
  format,
  duration,
  isVisible,
}: {
  value: number;
  format: (n: number) => string;
  duration: number;
  isVisible: boolean;
}) {
  return (
    <motion.span
      initial={isVisible ? { opacity: 0 } : { opacity: 1 }}
      animate={{ opacity: 1 }}
    >
      {isVisible ? (
        <CountUp value={value} format={format} duration={duration} />
      ) : (
        format(0)
      )}
    </motion.span>
  );
}

function CountUp({
  value,
  format,
  duration,
}: {
  value: number;
  format: (n: number) => string;
  duration: number;
}) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {value > 0 ? (
        <motion.span
          initial="from"
          animate="to"
          variants={{
            from: { opacity: 0 },
            to: { opacity: 1 },
          }}
          transition={{ duration }}
        >
          {format(Math.round(value))}
        </motion.span>
      ) : (
        format(value)
      )}
    </motion.span>
  );
}
