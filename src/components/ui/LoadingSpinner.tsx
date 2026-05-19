import { motion } from 'framer-motion';

export default function LoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <motion.div
        className="w-12 h-12 rounded-full border-2 border-t-transparent"
        style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {text && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{text}</p>
      )}
    </div>
  );
}
