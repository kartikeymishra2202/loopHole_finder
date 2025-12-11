import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiService, type Task } from "../services/api";

type Props = {
  tasks: Task[];
  token: string | null;
};

const TODAY_DATE = new Date().toISOString().split("T")[0];

export const AIQuote = ({ tasks, token }: Props) => {
  const [quote, setQuote] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // --- AI Trigger Logic ---
  useEffect(() => {
    if (!token) return;

    const todaysTasks = tasks.filter((t) => t.date === TODAY_DATE);
    if (todaysTasks.length === 0) return;

    const completedCount = todaysTasks.filter((t) => t.isCompleted).length;
    const progress = completedCount / todaysTasks.length;

    const fetchAI = async (type: "encouragement" | "celebration") => {
      // Don't re-fetch if we already have a quote visible
      if (quote) return;

      setAiLoading(true);
      try {
        const msg = await apiService.getMotivation(
          completedCount,
          todaysTasks.length,
          type
        );
        setQuote(msg);
      } catch (error) {
        console.error("AI Fetch Error", error);
      } finally {
        setAiLoading(false);
      }
    };

    // Trigger Logic:
    // 1. 100% Complete -> Celebration
    if (progress === 1) {
      fetchAI("celebration");
    }
    // 2. Between 75% and 99% -> Encouragement
    else if (progress >= 0.75 && progress < 1) {
      fetchAI("encouragement");
    }
    // Optional: Reset quote if they uncheck tasks and drop below threshold
    else if (progress < 0.75) {
      setQuote(null);
    }
  }, [tasks, token, quote]);

  return (
    <AnimatePresence>
      {(quote || aiLoading) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="hidden md:flex items-center gap-3 bg-white border border-indigo-100 shadow-sm px-4 py-2 rounded-xl"
        >
          <Sparkles size={14} className="text-indigo-500" />
          <p className="text-xs font-medium text-slate-700 max-w-xs truncate">
            {aiLoading ? "Consulting AI..." : `"${quote}"`}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
