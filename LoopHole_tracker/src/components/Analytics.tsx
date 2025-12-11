import { BarChart3, Calendar as CalendarIcon } from "lucide-react";
import { CircularProgress } from "./CircularProgress"; // Import shared component
import { type Task } from "../services/api";

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

// Internal Component for this file
const WeeklyBarChart = ({ tasks }: { tasks: Task[] }) => {
  const maxTasks = Math.max(
    ...DAYS.map((d) => tasks.filter((t) => t.date === d).length),
    5
  );

  return (
    <div className="flex items-end justify-between h-32 gap-3 mt-4">
      {DAYS.map((date, index) => {
        const dayTasks = tasks.filter((t) => t.date === date);
        const total = dayTasks.length;
        const completed = dayTasks.filter((t) => t.isCompleted).length;
        const totalHeight = (total / maxTasks) * 100;
        const isToday = date === TODAY_DATE;

        return (
          <div
            key={date}
            className="flex flex-col items-center gap-2 flex-1 group cursor-default"
          >
            <div className="relative w-full bg-slate-50 rounded-lg h-full flex items-end overflow-hidden group-hover:bg-slate-100 transition-colors">
              <div
                className="absolute bottom-0 w-full bg-indigo-100/50 rounded-t-sm transition-all duration-500"
                style={{ height: `${totalHeight}%` }}
              />
              <div
                className={`w-full rounded-t-sm transition-all duration-700 relative z-10 ${
                  isToday ? "bg-indigo-600" : "bg-indigo-400 opacity-80"
                }`}
                style={{ height: `${(completed / maxTasks) * 100}%` }}
              >
                {completed > 0 && (
                  <div className="text-[10px] text-white text-center font-bold pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {completed}
                  </div>
                )}
              </div>
            </div>
            <span
              className={`text-[10px] font-bold uppercase ${
                isToday ? "text-indigo-600" : "text-slate-400"
              }`}
            >
              {DAY_NAMES[index]}
            </span>
          </div>
        );
      })}
    </div>
  );
};

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8">
      {/* Weekly Analysis */}
      <div className="lg:col-span-8 bg-white p-6 rounded-2xl shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
            <BarChart3 size={14} /> Weekly Analysis
          </h3>
          <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
            Last 7 Days
          </span>
        </div>
        <WeeklyBarChart tasks={tasks} />
      </div>

      {/* Monthly Analysis */}
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
              className="bg-purple-600 h-full"
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
