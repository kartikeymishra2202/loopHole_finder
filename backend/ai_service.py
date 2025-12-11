import os
import google.generativeai as genai
from dotenv import load_dotenv


load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

async def generate_motivation(completed_count: int, total_count: int, msg_type: str) -> str:
    """
    Generates a motivational quote using Google Gemini.
    """
    if not GEMINI_API_KEY:
        print("AI Error: GEMINI_API_KEY is missing in .env")
        return "You are doing great! (Configure GEMINI_API_KEY to see AI quotes)"

    try:
        
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        prompt = ""
        if msg_type == 'celebration':
            prompt = (
                f"I just finished 100% of my daily tasks ({total_count} tasks). "
                "Give me a short, punchy, professional congratulatory message (max 1 sentence)."
            )
        else:
            
            prompt = (
                f"I have completed {completed_count} out of {total_count} tasks today. "
                "Give me a short, stern but motivating stoic quote to make me finish "
                "the remaining tasks immediately. (max 1 sentence)."
            )
            
        # Using await for async non-blocking call
        response = await model.generate_content_async(prompt)
        
        # Safety check for empty response
        if not response.text:
            return "Keep pushing forward."
            
        return response.text
        
    except Exception as e:
        print(f"AI Service Error: {e}")
        return "Focus on the step in front of you, not the whole staircase."