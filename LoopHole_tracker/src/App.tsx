import React, { useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import "./App.css";

import { apiService, type Task, type Habit } from "./services/api";

import { AuthScreen } from "./components/AuthScreen";
import { DailyStats } from "./components/DailyStats";
import { HabitTracker } from "./components/HabbitTracker";
import { WeekGrid } from "./components/WeekDays";
import { Analytics } from "./components/Analytics";
import { AIQuote } from "./components/AIQuote";

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

  // --- RENDER ---
  if (!token) {
    return (
      <AuthScreen
        handleAuth={handleAuth}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        isLoginView={isLoginView}
        setIsLoginView={setIsLoginView}
        authError={authError}
        setAuthError={setAuthError}
        loading={loading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans selection:bg-indigo-100">
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              FocusLab{" "}
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
          <DailyStats tasks={tasks} />
          <HabitTracker
            habits={habits}
            days={DAYS}
            dayNames={DAY_NAMES}
            todayDate={TODAY_DATE}
            toggleHabit={toggleHabit}
            saveHabitName={saveHabitName}
            editingHabitId={editingHabitId}
            setEditingHabitId={setEditingHabitId}
          />
        </div>

        {/* Daily Columns */}
        <WeekGrid
          days={DAYS}
          dayNames={DAY_NAMES}
          todayDate={TODAY_DATE}
          tasks={tasks}
          toggleTask={toggleTask}
          deleteTask={deleteTask}
          addTask={addTask}
        />

        {/* Analytics */}
        <Analytics tasks={tasks} />
      </div>
    </div>
  );
}
