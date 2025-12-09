import { useState, useEffect } from "react";
import { Check, Plus, Trash2, Activity, Trophy, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Correct Import from your API Service ---
import { apiService, type Task, type Habit } from "./services/api";
import "./App.css";

// --- Utilities ---
const getWeekDays = () => {
  const curr = new Date();
  const first = curr.getDate() - curr.getDay() + 1; // Start Monday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(curr);
    d.setDate(first + i);
    return d.toISOString().split("T")[0];
  });
};

const DAYS = getWeekDays();
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// --- Components ---
const CircularProgress = ({
  percentage,
  size = 80,
  stroke = 8,
}: {
  percentage: number;
  size?: number;
  stroke?: number;
}) => {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          className="text-slate-100"
          strokeWidth={stroke}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-indigo-600 transition-all duration-1000 ease-out"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <span className="absolute text-sm font-bold text-slate-700">
        {Math.round(percentage)}%
      </span>
    </div>
  );
};

export default function App() {
  // --- State ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  // AI State
  const [quote, setQuote] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // --- Initial Data Load ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const [t, h] = await Promise.all([
          apiService.getTasks(),
          apiService.getHabits(),
        ]);
        setTasks(t);
        setHabits(h);
      } catch (err) {
        console.error("Failed to connect to backend:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // --- Handlers (Optimistic UI + Backend Sync) ---

  const addTask = async (date: string, text: string) => {
    if (!text.trim()) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      text,
      isCompleted: false,
      date,
      createdAt: new Date().toISOString(),
    };

    // 1. Show immediately (Optimistic UI)
    setTasks((prev) => [...prev, newTask]);
    setQuote(null); // Reset quote on new task

    // 2. Save to Backend in background
    await apiService.createTask(newTask);
  };

  const toggleTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const newStatus = !task.isCompleted;

    // 1. Optimistic Update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isCompleted: newStatus } : t))
    );

    // 2. Send update to Backend
    await apiService.updateTask(taskId, { isCompleted: newStatus });
  };

  const deleteTask = async (taskId: string) => {
    // 1. Optimistic Update
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    // 2. Delete from Backend
    await apiService.deleteTask(taskId);
  };

  const toggleHabit = async (habitId: string, date: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const isCompleted = habit.completedDates.includes(date);
    const newDates = isCompleted
      ? habit.completedDates.filter((d) => d !== date)
      : [...habit.completedDates, date];

    const updatedHabit = { ...habit, completedDates: newDates };

    // 1. Optimistic Update
    setHabits((prev) => prev.map((h) => (h.id === habitId ? updatedHabit : h)));

    // 2. Update Backend
    await apiService.updateHabit(updatedHabit);
  };

  // --- AI Logic ---
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const todaysTasks = tasks.filter((t) => t.date === today);
    if (todaysTasks.length === 0) return;

    const completedCount = todaysTasks.filter((t) => t.isCompleted).length;
    const progress = completedCount / todaysTasks.length;

    const fetchAI = async (type: "encouragement" | "celebration") => {
      // Don't fetch if quote already exists to avoid spamming API
      if (quote) return;

      setAiLoading(true);
      const msg = await apiService.getMotivation(
        completedCount,
        todaysTasks.length,
        type
      );
      setQuote(msg);
      setAiLoading(false);
    };

    if (progress === 1) fetchAI("celebration");
    else if (progress >= 0.75 && progress < 0.9) fetchAI("encouragement");
  }, [tasks, quote]); // dependencies

  // --- Metrics Calculation ---
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;
  const overallProgress =
    totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-400">
        Loading FocusLab...
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans selection:bg-indigo-100">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* --- Header & AI Quote --- */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              FocusLab{" "}
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wide">
                Weekly
              </span>
            </h1>
            <p className="text-slate-500 mt-1">
              Design your life, one day at a time.
            </p>
          </div>

          {/* AI Quote Banner */}
          <AnimatePresence>
            {(quote || aiLoading) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 bg-white border border-indigo-100 shadow-sm px-4 py-3 rounded-xl max-w-lg"
              >
                <div className="bg-indigo-600 text-white p-2 rounded-lg">
                  <Sparkles size={16} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                    {aiLoading ? "Consulting AI..." : "Focus Assistant"}
                  </div>
                  <p className="text-sm font-medium text-slate-700 leading-tight">
                    {aiLoading ? "Analyzing your progress..." : `"${quote}"`}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* --- Top Dashboard Section --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 1. Overall Metrics Card (3 cols) */}
          <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                  <Activity size={14} /> Total Progress
                </h3>
                <div className="mt-2 text-3xl font-bold text-slate-900">
                  {completedTasks}
                  <span className="text-slate-300 text-xl">/{totalTasks}</span>
                </div>
              </div>
              <CircularProgress
                percentage={overallProgress}
                size={70}
                stroke={6}
              />
            </div>

            <div className="mt-6 pt-6 border-t border-slate-50">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-slate-500">
                  Weekly Efficiency
                </span>
                <span className="font-bold text-indigo-600">
                  {Math.round(overallProgress)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${overallProgress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* 2. Habit Tracker Table (9 cols) */}
          <div className="lg:col-span-9 bg-white p-6 rounded-2xl shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100 overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <Trophy size={14} /> Habits
              </h3>
            </div>

            <table className="w-full min-w-[600px]">
              <thead>
                <tr>
                  <th className="text-left text-sm font-semibold text-slate-400 pb-4 pl-2">
                    Daily Goal
                  </th>
                  {DAYS.map((date, i) => (
                    <th key={date} className="pb-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold uppercase text-slate-400">
                          {DAY_NAMES[i]}
                        </span>
                        <span
                          className={`text-xs font-semibold mt-1 ${
                            date === new Date().toISOString().split("T")[0]
                              ? "text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md"
                              : "text-slate-600"
                          }`}
                        >
                          {date.split("-")[2]}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {habits.map((habit) => (
                  <tr
                    key={habit.id}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-3 pl-2 text-sm font-medium text-slate-700 border-t border-slate-50">
                      {habit.name}
                    </td>
                    {DAYS.map((date) => {
                      const isDone = habit.completedDates.includes(date);
                      return (
                        <td
                          key={date}
                          className="text-center border-t border-slate-50 py-2"
                        >
                          <button
                            onClick={() => toggleHabit(habit.id, date)}
                            className={`w-8 h-8 rounded-lg inline-flex items-center justify-center transition-all duration-200 ${
                              isDone
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-100"
                                : "bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-400 scale-90"
                            }`}
                          >
                            <Check size={16} strokeWidth={3} />
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- Bottom Section: Daily Columns --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 min-h-[500px]">
          {DAYS.map((date, index) => {
            const dayTasks = tasks.filter((t) => t.date === date);
            const dayCompleted = dayTasks.filter((t) => t.isCompleted).length;
            const dayProgress =
              dayTasks.length === 0
                ? 0
                : (dayCompleted / dayTasks.length) * 100;
            const isToday = new Date().toISOString().split("T")[0] === date;

            return (
              <div
                key={date}
                className={`flex flex-col h-full rounded-2xl border transition-all duration-300 ${
                  isToday
                    ? "bg-white border-indigo-200 shadow-xl shadow-indigo-100/50 ring-1 ring-indigo-50 z-10 scale-[1.02]"
                    : "bg-slate-50/50 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-lg"
                }`}
              >
                {/* Column Header */}
                <div
                  className={`p-4 rounded-t-2xl border-b ${
                    isToday
                      ? "bg-indigo-50/50 border-indigo-100"
                      : "bg-transparent border-slate-100"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div
                        className={`text-[10px] font-bold uppercase tracking-widest ${
                          isToday ? "text-indigo-600" : "text-slate-400"
                        }`}
                      >
                        {DAY_NAMES[index]}
                      </div>
                      <div className="text-lg font-bold text-slate-800 mt-1">
                        {date.split("-")[2]}
                      </div>
                    </div>
                    <div className="scale-75 origin-top-right opacity-80">
                      <CircularProgress
                        percentage={dayProgress}
                        size={40}
                        stroke={5}
                      />
                    </div>
                  </div>
                </div>

                {/* Task List Area */}
                <div className="p-3 flex-1 flex flex-col gap-2 overflow-y-auto max-h-[500px]">
                  <AnimatePresence mode="popLayout">
                    {dayTasks.map((task) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        key={task.id}
                        className={`group flex items-start gap-3 p-3 rounded-xl border shadow-sm transition-all ${
                          task.isCompleted
                            ? "bg-slate-50 border-slate-100 opacity-60"
                            : "bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md"
                        }`}
                      >
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={`mt-0.5 min-w-[18px] h-[18px] rounded border flex items-center justify-center transition-colors ${
                            task.isCompleted
                              ? "bg-indigo-500 border-indigo-500"
                              : "border-slate-300 hover:border-indigo-400"
                          }`}
                        >
                          {task.isCompleted && (
                            <Check
                              size={12}
                              className="text-white"
                              strokeWidth={4}
                            />
                          )}
                        </button>
                        <span
                          className={`text-xs font-medium leading-relaxed flex-1 ${
                            task.isCompleted
                              ? "text-slate-400 line-through"
                              : "text-slate-700"
                          }`}
                        >
                          {task.text}
                        </span>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Input Area */}
                <div className="p-3 mt-auto">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const input = e.currentTarget.elements.namedItem(
                        "task"
                      ) as HTMLInputElement;
                      addTask(date, input.value);
                      input.value = "";
                    }}
                    className="relative group"
                  >
                    <input
                      name="task"
                      placeholder="Add task"
                      autoComplete="off"
                      className="w-full text-xs pl-3 pr-8 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all shadow-sm"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 top-2.5 p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                    >
                      <Plus size={16} />
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
