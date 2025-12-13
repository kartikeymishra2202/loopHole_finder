import { BarChart3, Calendar as CalendarIcon, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { CircularProgress } from "./CircularProgress";
import { type Task } from "../services/api";

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

// --- Enhanced Weekly Graph Component ---
const WeeklyGraph = ({ tasks }: { tasks: Task[] }) => {
  // 1. Prepare Data
  const data = DAYS.map((date, index) => {
    const dayTasks = tasks.filter((t) => t.date === date);
    const total = dayTasks.length;
    const completed = dayTasks.filter((t) => t.isCompleted).length;
    return {
      day: DAY_NAMES[index],
      date,
      total,
      completed,
      isToday: date === TODAY_DATE,
    };
  });

  // 2. Dynamic Scaling
  const maxVal = Math.max(...data.map((d) => d.total), 5); // Minimum scale of 5

  return (
    <div className="mt-6 h-48 flex items-end justify-between gap-2 md:gap-4 relative px-2">
      {/* Background Grid Lines (Optional Polish) */}
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0 opacity-20">
        <div className="border-t border-slate-300 w-full"></div>
        <div className="border-t border-slate-300 w-full"></div>
        <div className="border-t border-slate-300 w-full"></div>
        <div className="border-t border-slate-300 w-full"></div>
        <div className="border-t border-slate-300 w-full"></div>
      </div>

      {/* Bars */}
      {data.map((item, i) => {
        // Calculate heights
        const totalHeight = (item.total / maxVal) * 100;
        const completedHeight =
          item.total === 0 ? 0 : (item.completed / item.total) * 100;

        return (
          <div
            key={item.date}
            className="relative flex-1 h-full flex flex-col justify-end group z-10"
          >
            {/* Tooltip (Hover) */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg z-20">
              {item.completed}/{item.total} Tasks
              <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
            </div>

            {/* The Bar Container */}
            <div
              className="relative w-full rounded-t-lg bg-slate-100/80 overflow-hidden transition-all duration-300 group-hover:bg-slate-200"
              style={{ height: `${totalHeight || 5}%` }} // Min height 5% for visuals
            >
              {/* Completed Portion (Animated) */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${completedHeight}%` }}
                transition={{ duration: 1, delay: i * 0.1, type: "spring" }}
                className={`absolute bottom-0 w-full rounded-t-sm ${
                  item.isToday
                    ? "bg-gradient-to-t from-indigo-600 to-indigo-400"
                    : "bg-gradient-to-t from-indigo-400 to-indigo-300 opacity-70"
                }`}
              />
            </div>

            {/* Label */}
            <span
              className={`text-[10px] text-center mt-3 font-bold uppercase tracking-wider ${
                item.isToday ? "text-indigo-600" : "text-slate-400"
              }`}
            >
              {item.day}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// --- Main Analytics Export ---
export const Analytics = ({ tasks }: { tasks: Task[] }) => {
  // Logic extracted from App.tsx
  const currentMonth = new Date().getMonth();
  const monthlyTasks = tasks.filter(
    (t) => new Date(t.date).getMonth() === currentMonth
  );
  const monthlyTotal = monthlyTasks.length;
  const monthlyCompleted = monthlyTasks.filter((t) => t.isCompleted).length;
  const monthlyProgress =
    monthlyTotal === 0 ? 0 : (monthlyCompleted / monthlyTotal) * 100;

  // Calculate Trend
  const completedToday = tasks.filter(
    (t) => t.date === TODAY_DATE && t.isCompleted
  ).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8">
      {/* Weekly Analysis (Graph) */}
      <div className="lg:col-span-8 bg-white p-6 rounded-2xl shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <BarChart3 size={14} /> Performance
            </h3>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              Weekly Activity
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md">
            <TrendingUp size={12} /> +{completedToday} today
          </div>
        </div>

        {/* NEW GRAPH COMPONENT */}
        <WeeklyGraph tasks={tasks} />
      </div>

      {/* Monthly Analysis (Card) */}
      <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2 mb-6">
            <CalendarIcon size={14} /> Monthly Overview
          </h3>
          <div className="flex items-center gap-6">
            <CircularProgress
              percentage={monthlyProgress}
              size={90}
              stroke={8}
              color="text-purple-600"
            />
            <div>
              <div className="text-3xl font-bold text-slate-900">
                {monthlyCompleted}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Tasks Done in{" "}
                {new Date().toLocaleString("default", { month: "long" })}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Total Tasks</span>
            <span className="font-bold text-slate-700">{monthlyTotal}</span>
          </div>
          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
            <div
              className="bg-purple-600 h-full transition-all duration-1000"
              style={{ width: `${monthlyProgress}%` }}
            ></div>
          </div>
          <div className="text-xs text-slate-400 text-center pt-2">
            "Consistency is what transforms average into excellence."
          </div>
        </div>
      </div>
    </div>
  );
};
