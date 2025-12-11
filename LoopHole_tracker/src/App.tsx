import React, { useState, useEffect } from "react";
import {
  Check,
  Plus,
  Trash2,
  Activity,
  Trophy,
  LogOut,
  LayoutGrid,
  X,
  Edit3,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";

import { apiService, type Task, type Habit } from "./services/api";
import { CircularProgress } from "./components/CircularProgress";
import { Analytics } from "./components/Analytics";
import { AIQuote } from "./components/AIQuote";
// --- Utilities ---
const getWeekDays = () => {
  const curr = new Date();
  const first = curr.getDate() - curr.getDay() + 1;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(curr);
    d.setDate(first + i);
    return d.toISOString().split("T")[0];
  });
};

const DAYS = getWeekDays();
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TODAY_DATE = new Date().toISOString().split("T")[0];

export default function App() {
  // --- Auth State ---
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginView, setIsLoginView] = useState(true);
  const [authError, setAuthError] = useState("");

  // --- App Data State ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);

  // --- Auth Handlers ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setLoading(true);
    try {
      if (isLoginView) {
        const data = await apiService.login(email, password);
        localStorage.setItem("token", data.access_token);
        setToken(data.access_token);
      } else {
        await apiService.signup(email, password);
        alert("Account created! Please login.");
        setIsLoginView(true);
      }
    } catch (err) {
      if (err instanceof Error) setAuthError(err.message);
      else setAuthError("Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setTasks([]);
    setHabits([]);
    setEmail("");
    setPassword("");
  };

  // --- Data Loading ---
  useEffect(() => {
    if (!token) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const [t, h] = await Promise.all([
          apiService.getTasks(),
          apiService.getHabits(),
        ]);
        setTasks(t);

        // Habit Filling Logic
        const filledHabits = [...h];
        if (filledHabits.length < 4) {
          while (filledHabits.length < 4) {
            filledHabits.push({
              id: `temp_${filledHabits.length}_${crypto.randomUUID()}`,
              name: "Click to Edit",
              completedDates: [],
            });
          }
        }
        setHabits(filledHabits.slice(0, 4));
      } catch (err) {
        console.error("Failed to load data:", err);
        if (err instanceof Error && err.message === "Unauthorized") logout();
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [token]);

  // --- Handlers ---
  const addTask = async (date: string, text: string) => {
    if (!text.trim()) return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      text,
      isCompleted: false,
      date,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, newTask]);
    await apiService.createTask(newTask);
  };

  const toggleTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const newStatus = !task.isCompleted;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isCompleted: newStatus } : t))
    );
    await apiService.updateTask(taskId, { isCompleted: newStatus });
  };

  const deleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await apiService.deleteTask(taskId);
  };

  const toggleHabit = async (habitId: string, date: string) => {
    if (habitId.startsWith("temp_")) {
      alert("Please rename this habit first!");
      return;
    }
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const isCompleted = habit.completedDates.includes(date);
    const newDates = isCompleted
      ? habit.completedDates.filter((d) => d !== date)
      : [...habit.completedDates, date];
    const updatedHabit = { ...habit, completedDates: newDates };
    setHabits((prev) => prev.map((h) => (h.id === habitId ? updatedHabit : h)));
    await apiService.updateHabit(updatedHabit);
  };

  const saveHabitName = async (habitId: string, newName: string) => {
    setEditingHabitId(null);
    if (!newName.trim()) return;

    const isTemp = habitId.startsWith("temp_");
    let updatedHabit: Habit;

    if (isTemp) {
      const realId = crypto.randomUUID();
      updatedHabit = { id: realId, name: newName, completedDates: [] };
      setHabits((prev) =>
        prev.map((h) => (h.id === habitId ? updatedHabit : h))
      );
      await apiService.createHabit(updatedHabit);
    } else {
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;
      updatedHabit = { ...habit, name: newName };
      setHabits((prev) =>
        prev.map((h) => (h.id === habitId ? updatedHabit : h))
      );
      await apiService.updateHabit(updatedHabit);
    }
  };

  // --- METRICS ---
  const dailyTasks = tasks.filter((t) => t.date === TODAY_DATE);
  const dailyTotal = dailyTasks.length;
  const dailyCompleted = dailyTasks.filter((t) => t.isCompleted).length;
  const dailyProgress =
    dailyTotal === 0 ? 0 : (dailyCompleted / dailyTotal) * 100;

  // --- RENDER LOGIN ---
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-[0_2px_20px_-5px_rgba(0,0,0,0.1)] w-full max-w-sm border border-slate-100">
          <div className="flex justify-center mb-6 text-indigo-600">
            <LayoutGrid size={40} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center tracking-tight">
            {isLoginView ? "Welcome back" : "Create account"}
          </h1>
          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="email"
              required
              placeholder="name@example.com"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              required
              placeholder="Password"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {authError && (
              <p className="text-xs text-red-500 text-center font-medium bg-red-50 py-2 rounded-lg">
                {authError}
              </p>
            )}
            <button
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {loading ? "Processing..." : isLoginView ? "Sign In" : "Sign Up"}
            </button>
          </form>
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <button
              onClick={() => {
                setIsLoginView(!isLoginView);
                setAuthError("");
              }}
              className="text-sm text-slate-500 hover:text-indigo-600 font-medium"
            >
              {isLoginView
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans selection:bg-indigo-100">
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              FocusLab
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wide">
                Beta
              </span>
            </h1>
            <p className="text-slate-500 mt-1">
              Design your life, one day at a time.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <AIQuote tasks={tasks} token={token} />

            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:text-red-500 hover:border-red-200 transition-all shadow-sm"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </header>

        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Daily Analysis */}
          <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                  <Activity size={14} /> Today's Insight
                </h3>
                <div className="mt-2 text-3xl font-bold text-slate-900">
                  {dailyCompleted}
                  <span className="text-slate-300 text-xl">/{dailyTotal}</span>
                </div>
                <div className="text-xs text-slate-400 mt-1 font-medium">
                  {dailyTotal - dailyCompleted} tasks remaining
                </div>
              </div>
              <CircularProgress
                percentage={dailyProgress}
                size={70}
                stroke={6}
              />
            </div>
            <div className="mt-6 pt-6 border-t border-slate-50">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-slate-500">
                  Day Efficiency
                </span>
                <span className="font-bold text-indigo-600">
                  {Math.round(dailyProgress)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${dailyProgress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Habit Tracker */}
          <div className="lg:col-span-9 bg-white p-6 rounded-2xl shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100 overflow-x-auto">
            <div className="flex items-center gap-6 mb-4">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <Trophy size={14} /> Habits
              </h3>
              <div className="flex gap-4">
                <span className="text-[10px] font-bold px-2 py-1 bg-green-50 text-green-700 rounded-md flex items-center gap-1">
                  <ArrowUpCircle size={12} /> Build
                </span>
                <span className="text-[10px] font-bold px-2 py-1 bg-red-50 text-red-700 rounded-md flex items-center gap-1">
                  <ArrowDownCircle size={12} /> Break
                </span>
              </div>
            </div>
            <table className="w-full min-w-[600px]">
              <thead>
                <tr>
                  <th className="text-left text-sm font-semibold text-slate-400 pb-4 pl-2">
                    Goal Name
                  </th>
                  {DAYS.map((date, i) => (
                    <th key={date} className="pb-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold uppercase text-slate-400">
                          {DAY_NAMES[i]}
                        </span>
                        <span
                          className={`text-xs font-semibold mt-1 ${
                            date === TODAY_DATE
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
                {habits.slice(0, 4).map((habit, index) => {
                  const isBadHabit = index >= 2;
                  return (
                    <tr
                      key={habit.id}
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-3 pl-2 text-sm font-medium text-slate-700 border-t border-slate-50 relative">
                        {editingHabitId === habit.id ? (
                          <input
                            autoFocus
                            className="border border-indigo-300 rounded px-2 py-1 text-xs w-32 outline-none focus:ring-2 focus:ring-indigo-100"
                            defaultValue={habit.name}
                            onBlur={(e) =>
                              saveHabitName(habit.id, e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                saveHabitName(habit.id, e.currentTarget.value);
                            }}
                          />
                        ) : (
                          <div
                            className="flex items-center gap-2 group/edit cursor-pointer"
                            onClick={() => setEditingHabitId(habit.id)}
                          >
                            <span
                              className={
                                isBadHabit ? "text-red-700" : "text-slate-700"
                              }
                            >
                              {habit.name}
                            </span>
                            <Edit3
                              size={12}
                              className="opacity-0 group-hover/edit:opacity-100 text-slate-400"
                            />
                          </div>
                        )}
                        <span
                          className={`text-[9px] absolute -left-1 top-4 -translate-x-full font-bold uppercase ${
                            isBadHabit ? "text-red-300" : "text-green-300"
                          }`}
                        >
                          {isBadHabit ? "BAD" : "GOOD"}
                        </span>
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
                                  ? isBadHabit
                                    ? "bg-red-500 text-white shadow-md shadow-red-200"
                                    : "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                  : "bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-400 scale-90"
                              }`}
                            >
                              {isBadHabit ? (
                                <X size={16} strokeWidth={3} />
                              ) : (
                                <Check size={16} strokeWidth={3} />
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Middle Section: Daily Columns  */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          {DAYS.map((date, index) => {
            const dayTasks = tasks.filter((t) => t.date === date);
            const dayCompleted = dayTasks.filter((t) => t.isCompleted).length;
            const dayProgress =
              dayTasks.length === 0
                ? 0
                : (dayCompleted / dayTasks.length) * 100;
            const isToday = date === TODAY_DATE;

            return (
              <div
                key={date}
                className={`flex flex-col h-[520px] rounded-2xl border transition-all duration-300 ${
                  isToday
                    ? "bg-white border-indigo-200 shadow-xl shadow-indigo-100/50 ring-1 ring-indigo-50 z-10 scale-[1.02]"
                    : "bg-slate-50/50 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-lg"
                }`}
              >
                <div
                  className={`p-4 rounded-t-2xl border-b shrink-0 ${
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
                <div className="p-3 flex-1 flex flex-col gap-2 overflow-y-auto min-h-0 no-scrollbar">
                  <AnimatePresence mode="popLayout">
                    {dayTasks.map((task) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        key={task.id}
                        className={`group flex items-start gap-3 p-3 rounded-xl border shadow-sm transition-all shrink-0 ${
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
                <div className="p-3 mt-auto shrink-0">
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

        <Analytics tasks={tasks} />
      </div>
    </div>
  );
}
