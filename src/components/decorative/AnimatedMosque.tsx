import { motion } from 'framer-motion';

export default function AnimatedMosque({ size = 80 }: { size?: number }) {
  return (
    <motion.svg
      width={size} height={size}
      viewBox="0 0 100 100"
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      style={{ filter: 'drop-shadow(0 0 8px var(--accent-light))' }}
    >
      <circle cx="50" cy="50" r="45" fill="none" stroke="var(--accent)" strokeWidth="0.5" opacity="0.3" />
      <path d="M30 80 L30 50 L50 25 L70 50 L70 80 Z" fill="var(--accent-bg)" stroke="var(--accent)" strokeWidth="1" />
      <path d="M50 25 L50 15" stroke="var(--accent)" strokeWidth="1.5" />
      <circle cx="50" cy="12" r="3" fill="var(--accent)" opacity="0.6" />
      <rect x="35" y="55" width="30" height="25" fill="var(--bg-card)" stroke="var(--accent)" strokeWidth="0.5" opacity="0.5" />
      <path d="M37 60 L43 60 L43 80 L37 80 Z" fill="var(--accent)" opacity="0.3" />
      <path d="M57 60 L63 60 L63 80 L57 80 Z" fill="var(--accent)" opacity="0.3" />
    </motion.svg>
  );
}
