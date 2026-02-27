"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface AlertProps {
  message: string | null;
  type?: 'error' | 'success' | 'info';
  onClose: () => void;
}

export default function Alert({ message, type = 'error', onClose }: AlertProps) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  const styles = {
    error: "border-red-500/30 bg-red-950/90 text-red-200 shadow-[0_10px_40px_rgba(220,38,38,0.2)]",
    success: "border-green-500/30 bg-green-950/90 text-green-200 shadow-[0_10px_40px_rgba(22,163,74,0.2)]",
    info: "border-blue-500/30 bg-blue-950/90 text-blue-200 shadow-[0_10px_40px_rgba(37,99,235,0.2)]"
  };

  const icons = {
    error: '⚠️',
    success: '✅',
    info: 'ℹ️'
  };

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9, x: "-50%" }}
          animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
          exit={{ opacity: 0, y: -20, scale: 0.9, x: "-50%" }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          
          drag="y"
          dragConstraints={{ top: -50, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, info) => {
            if (info.offset.y < -20) onClose();
          }}

          className={`fixed top-4 md:top-6 left-1/2 z-[100] 
                      w-[calc(100%-2rem)] max-w-sm
                      px-5 py-4 rounded-2xl border backdrop-blur-xl
                      flex items-center gap-3.5 cursor-grab active:cursor-grabbing
                      ${styles[type]}`}
        >
          <span className="text-xl shrink-0 drop-shadow-md">
            {icons[type]}
          </span>
          
          <p className="font-bold text-sm flex-1 leading-snug tracking-wide">{message}</p>
  
          <button 
            onClick={onClose}
            className="opacity-60 hover:opacity-100 transition-all p-2 -mr-2 shrink-0 bg-black/20 hover:bg-black/40 rounded-full active:scale-90"
            aria-label="Bezárás"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
