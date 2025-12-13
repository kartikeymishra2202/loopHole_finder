import {
  Trophy,
  ArrowUpCircle,
  ArrowDownCircle,
  Edit3,
  X,
  Check,
} from "lucide-react";
import { type Habit } from "../services/api";

type Props = {
  habits: Habit[];
  days: string[];
  dayNames: string[];
  todayDate: string;
  toggleHabit: (id: string, date: string) => void;
  saveHabitName: (id: string, name: string) => void;
  editingHabitId: string | null;
  setEditingHabitId: (id: string | null) => void;
};

export const HabitTracker = ({
  habits,
  days,
  dayNames,
  todayDate,
  toggleHabit,
  saveHabitName,
  editingHabitId,
  setEditingHabitId,
}: Props) => {
  return (
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
            {days.map((date, i) => (
              <th key={date} className="pb-4 text-center">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    {dayNames[i]}
                  </span>
                  <span
                    className={`text-xs font-semibold mt-1 ${
                      date === todayDate
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
                      onBlur={(e) => saveHabitName(habit.id, e.target.value)}
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
                {days.map((date) => {
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
  );
};
