// src/services/api.ts

const API_URL = "http://localhost:8000";

export type Task = {
  id: string;
  text: string;
  isCompleted: boolean;
  date: string;
  createdAt: string;
};

export type Habit = {
  id: string;
  name: string;
  completedDates: string[];
};

export const apiService = {
  // --- Tasks ---
  async getTasks(): Promise<Task[]> {
    const res = await fetch(`${API_URL}/tasks`);
    return res.json();
  },

  async createTask(task: Task): Promise<void> {
    await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    await fetch(`${API_URL}/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  },

  async deleteTask(id: string): Promise<void> {
    await fetch(`${API_URL}/tasks/${id}`, { method: "DELETE" });
  },

  // --- Habits ---
  async getHabits(): Promise<Habit[]> {
    const res = await fetch(`${API_URL}/habits`);
    return res.json();
  },

  async updateHabit(habit: Habit): Promise<void> {
    await fetch(`${API_URL}/habits/${habit.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(habit),
    });
  },

  // --- AI ---
  async getMotivation(
    completed: number,
    total: number,
    type: "encouragement" | "celebration"
  ): Promise<string> {
    try {
      const res = await fetch(`${API_URL}/ai/motivation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completed_count: completed,
          total_count: total,
          type,
        }),
      });
      const data = await res.json();
      return data.message;
    } catch (e) {
      console.error(e);
      return "Keep going.";
    }
  },
};
