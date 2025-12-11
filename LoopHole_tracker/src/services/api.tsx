const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

// --- Types ---
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

// --- Helper: Get Headers with Token ---
const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const apiService = {
  // --- AUTHENTICATION ---

  async login(email: string, password: string) {
    // FastAPI OAuth2 expects form-data, not JSON
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    });

    if (!res.ok) throw new Error("Login failed. Check credentials.");
    return res.json(); // Returns { access_token, token_type }
  },

  async signup(email: string, password: string) {
    const res = await fetch(`${API_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Signup failed");
    }
    return res.json();
  },

  // --- TASKS ---

  async getTasks(): Promise<Task[]> {
    const res = await fetch(`${API_URL}/tasks`, { headers: getHeaders() });
    if (res.status === 401) throw new Error("Unauthorized");
    return res.json();
  },

  async createTask(task: Task): Promise<void> {
    await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(task),
    });
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    await fetch(`${API_URL}/tasks/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
  },

  async deleteTask(id: string): Promise<void> {
    await fetch(`${API_URL}/tasks/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
  },

  // --- HABITS ---

  async getHabits(): Promise<Habit[]> {
    const res = await fetch(`${API_URL}/habits`, { headers: getHeaders() });
    if (res.status === 401) throw new Error("Unauthorized");
    return res.json();
  },
  async createHabit(habit: Habit): Promise<void> {
    await fetch(`${API_URL}/habits`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(habit),
    });
  },

  async updateHabit(habit: Habit): Promise<void> {
    await fetch(`${API_URL}/habits/${habit.id}`, {
      method: "PUT",
      headers: getHeaders(),
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
        headers: getHeaders(),
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
      return "Keep pushing forward.";
    }
  },
};
