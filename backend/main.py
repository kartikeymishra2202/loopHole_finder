import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
import google.generativeai as genai
from dotenv import load_dotenv

# --- Configuration ---
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# --- App Setup ---
app = FastAPI()

# Enable CORS (Allows your React app to talk to Python)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Your Vite frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database Connection ---
client = AsyncIOMotorClient(MONGO_URI)
db = client.focuslab
tasks_collection = db.tasks
habits_collection = db.habits

# --- Models (Data Structure) ---
class Task(BaseModel):
    id: str
    text: str
    isCompleted: bool
    date: str
    createdAt: str

class Habit(BaseModel):
    id: str
    name: str
    completedDates: List[str] = []

class MotivationRequest(BaseModel):
    completed_count: int
    total_count: int
    type: str  # 'encouragement' or 'celebration'

# --- AI Configuration ---
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# --- Routes: TASKS ---

@app.get("/tasks", response_model=List[Task])
async def get_tasks():
    tasks = await tasks_collection.find().to_list(1000)
    return tasks

@app.post("/tasks", response_model=Task)
async def create_task(task: Task):
    await tasks_collection.insert_one(task.dict())
    return task

@app.put("/tasks/{task_id}")
async def update_task(task_id: str, update: dict = Body(...)):
    # We only update specific fields like isCompleted
    await tasks_collection.update_one({"id": task_id}, {"$set": update})
    return {"status": "updated"}

@app.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    await tasks_collection.delete_one({"id": task_id})
    return {"status": "deleted"}

# --- Routes: HABITS ---

@app.get("/habits", response_model=List[Habit])
async def get_habits():
    habits = await habits_collection.find().to_list(100)
    # Seed default habits if empty
    if not habits:
        defaults = [
            {"id": "h1", "name": "Wake up 6am", "completedDates": []},
            {"id": "h2", "name": "No A**", "completedDates": []},
            {"id": "h3", "name": "NO dopamine", "completedDates": []},
        ]
        await habits_collection.insert_many(defaults)
        return defaults
    return habits

@app.put("/habits/{habit_id}")
async def update_habit(habit_id: str, habit: Habit):
    await habits_collection.replace_one({"id": habit_id}, habit.dict())
    return habit

# --- Routes: AI ---

@app.post("/ai/motivation")
async def get_motivation(req: MotivationRequest):
    if not GEMINI_API_KEY:
        return {"message": "Great job! (Configure API Key for AI)"}
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = ""
        if req.type == 'celebration':
            prompt = f"I just finished 100% of my daily tasks ({req.total_count} tasks). Give me a short, punchy, professional congratulatory message (max 1 sentence)."
        else:
            prompt = f"I have completed {req.completed_count} out of {req.total_count} tasks today. Give me a short, stern but motivating stoic quote to finish the work. (max 1 sentence)."
            
        response = model.generate_content(prompt)
        return {"message": response.text}
    except Exception as e:
        print(f"AI Error: {e}")
        return {"message": "Stay focused. Keep pushing."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)