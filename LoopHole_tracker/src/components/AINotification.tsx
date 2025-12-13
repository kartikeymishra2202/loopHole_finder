import { useEffect } from "react";
import { Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  quote: string | null;
  onClose: () => void;
};

export const AINotification = ({ quote, onClose }: Props) => {
  // --- Auto-dismiss timer (40 seconds) ---
  useEffect(() => {
    if (quote) {
      const timer = setTimeout(() => {
        onClose();
      }, 40000); // 40 seconds

      // Cleanup timer if component unmounts or quote changes
      return () => clearTimeout(timer);
    }
  }, [quote, onClose]);

  return (
    <AnimatePresence>
      {quote && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9, x: "-50%" }}
          animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
          exit={{ opacity: 0, y: -20, scale: 0.95, x: "-50%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-6 left-1/2 z-50 w-full max-w-2xl px-4"
        >
          <div className="bg-slate-900/95 text-slate-100 p-6 rounded-3xl shadow-2xl backdrop-blur-md border border-slate-800/50 flex items-start gap-4 relative">
            <div className="bg-indigo-500/20 p-2 rounded-full shrink-0">
              <Sparkles size={20} className="text-indigo-400" />
            </div>
            <div className="flex-1 pt-0.5">
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-1">
                AI Insight
              </h3>
              <p className="text-lg font-medium leading-relaxed text-slate-100">
                "{quote}"
              </p>
            </div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
