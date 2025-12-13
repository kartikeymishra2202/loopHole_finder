import React from "react";
import { Plus, Check, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CircularProgress } from "./CircularProgress";
import { type Task } from "../services/api";

type Props = {
  days: string[];
  dayNames: string[];
  todayDate: string;
  tasks: Task[];
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  addTask: (date: string, text: string) => void;
};

export const WeekGrid = ({
  days,
  dayNames,
  todayDate,
  tasks,
  toggleTask,
  deleteTask,
  addTask,
}: Props) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
      {days.map((date, index) => {
        const dayTasks = tasks.filter((t) => t.date === date);
        const dayCompleted = dayTasks.filter((t) => t.isCompleted).length;
        const dayProgress =
          dayTasks.length === 0 ? 0 : (dayCompleted / dayTasks.length) * 100;
        const isToday = date === todayDate;

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
                    {dayNames[index]}
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
  );
};
