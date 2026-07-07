import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500); // Wait a bit after 100% before firing complete
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 150);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] bg-slate-50 flex flex-col items-center justify-center text-slate-900"
    >
      <div className="flex flex-col items-center gap-6 max-w-sm w-full px-6">
        {/* Animated Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="p-4 rounded-2xl shadow-sm bg-white ring-1 ring-slate-100"
        >
          <img src="/logo.png" alt="RGTVetrex" className="w-20 h-20 object-contain" />
        </motion.div>
        
        {/* Typographic Title */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold tracking-widest uppercase mb-2">RGTVetrex</h2>
          <p className="text-zinc-500 text-xs tracking-[0.2em] font-medium">AUTONOMOUS LEAD ENGINE</p>
        </motion.div>

        {/* Progress Bar */}
        <div className="w-full mt-4">
          <div className="flex justify-between text-xs text-slate-500 mb-2 font-mono">
            <span>INITIALIZING...</span>
            <span>{Math.min(progress, 100)}%</span>
          </div>
          <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-slate-900"
              initial={{ width: "0%" }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ ease: "easeOut", duration: 0.2 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
