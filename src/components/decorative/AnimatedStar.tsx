import { motion } from 'framer-motion';

export default function AnimatedStar({ size = 24 }: { size?: number }) {
  return (
    <motion.svg
      width={size} height={size}
      viewBox="0 0 24 24"
      animate={{ rotate: 360, scale: [1, 1.1, 1] }}
      transition={{ rotate: { duration: 8, repeat: Infinity, ease: 'linear' }, scale: { duration: 3, repeat: Infinity } }}
    >
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill="var(--accent)" opacity="0.6"
      />
    </motion.svg>
  );
}
