import { motion } from 'framer-motion';

export default function AnimatedLantern({ size = 60 }: { size?: number }) {
  return (
    <motion.svg
      width={size} height={size}
      viewBox="0 0 100 100"
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <path d="M50 10 L50 20" stroke="var(--accent)" strokeWidth="2" />
      <path d="M35 20 L65 20 L60 30 L40 30 Z" fill="var(--accent-bg)" stroke="var(--accent)" strokeWidth="1" />
      <path d="M38 30 Q38 30 40 60 Q42 85 50 88 Q58 85 60 60 Q62 30 62 30" fill="var(--accent-bg)" stroke="var(--accent)" strokeWidth="1" />
      <motion.circle
        cx="50" cy="60" r="10"
        fill="var(--accent)"
        opacity={0.3}
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <path d="M40 88 L60 88 L55 95 L45 95 Z" fill="var(--accent-bg)" stroke="var(--accent)" strokeWidth="1" />
    </motion.svg>
  );
}
