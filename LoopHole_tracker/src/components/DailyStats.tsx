import React from "react";
import { Activity } from "lucide-react";
import { CircularProgress } from "./CircularProgress";
import { type Task } from "../services/api";

const TODAY_DATE = new Date().toISOString().split("T")[0];

export const DailyStats = ({ tasks }: { tasks: Task[] }) => {
  const dailyTasks = tasks.filter((t) => t.date === TODAY_DATE);
  const dailyTotal = dailyTasks.length;
  const dailyCompleted = dailyTasks.filter((t) => t.isCompleted).length;
  const dailyProgress =
    dailyTotal === 0 ? 0 : (dailyCompleted / dailyTotal) * 100;

  return (
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
        <CircularProgress percentage={dailyProgress} size={70} stroke={6} />
      </div>
      <div className="mt-6 pt-6 border-t border-slate-50">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-slate-500">Day Efficiency</span>
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
  );
};
