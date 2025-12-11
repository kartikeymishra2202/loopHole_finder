import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from dotenv import load_dotenv

from ai_service import generate_motivation
import auth 


load_dotenv()
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")



app = FastAPI()

# 3. CORS Configuration
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
origins = [url.strip() for url in frontend_url.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Database Setup
client = AsyncIOMotorClient(MONGO_URI)
db = client.focuslab
users_collection = db.users
tasks_collection = db.tasks
habits_collection = db.habits

# 5. Auth Dependency
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    username = auth.verify_token(token)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return username

# 6. Models
class UserAuth(BaseModel):
    email: str
    password: str

class Task(BaseModel):
    id: str
    text: str
    isCompleted: bool
    date: str
    createdAt: str
    user_id: str | None = None

class Habit(BaseModel):
    id: str
    name: str
    completedDates: List[str] = []
    user_id: str | None = None

class MotivationRequest(BaseModel):
    completed_count: int
    total_count: int
    type: str  # 'encouragement' or 'celebration'

# --- ROUTES: AUTH ---

@app.post("/signup")
async def signup(user: UserAuth):
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    await users_collection.insert_one({"email": user.email, "password": hashed_password})
    return {"message": "User created successfully"}

@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await users_collection.find_one({"email": form_data.username})
    if not user or not auth.verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = auth.create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

# --- ROUTES: TASKS ---

@app.get("/tasks", response_model=List[Task])
async def get_tasks(current_user: str = Depends(get_current_user)):
    return await tasks_collection.find({"user_id": current_user}).to_list(1000)

@app.post("/tasks")
async def create_task(task: Task, current_user: str = Depends(get_current_user)):
    task.user_id = current_user
    await tasks_collection.insert_one(task.dict())
    return task

@app.put("/tasks/{task_id}")
async def update_task(task_id: str, update: dict, current_user: str = Depends(get_current_user)):
    result = await tasks_collection.update_one(
        {"id": task_id, "user_id": current_user}, 
        {"$set": update}
    )
    if result.modified_count == 0:
         raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "updated"}

@app.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user: str = Depends(get_current_user)):
    await tasks_collection.delete_one({"id": task_id, "user_id": current_user})
    return {"status": "deleted"}

# --- ROUTES: HABITS ---

@app.get("/habits", response_model=List[Habit])
async def get_habits(current_user: str = Depends(get_current_user)):
    habits = await habits_collection.find({"user_id": current_user}).to_list(100)
    return habits

@app.post("/habits")
async def create_habit(habit: Habit, current_user: str = Depends(get_current_user)):
    habit.user_id = current_user
    await habits_collection.insert_one(habit.dict())
    return habit

@app.put("/habits/{habit_id}")
async def update_habit(habit_id: str, habit: Habit, current_user: str = Depends(get_current_user)):
    habit.user_id = current_user
    await habits_collection.replace_one({"id": habit_id, "user_id": current_user}, habit.dict())
    return habit

# --- ROUTES: AI ---

@app.post("/ai/motivation")
async def get_motivation_route(req: MotivationRequest, current_user: str = Depends(get_current_user)):
    # Call the service function
    return {"message": await generate_motivation(req.completed_count, req.total_count, req.type)}