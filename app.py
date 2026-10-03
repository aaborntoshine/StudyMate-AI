import json
import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024  # 8 MB upload limit

API_KEY = os.getenv("GEMINI_API_KEY")
MODEL = os.getenv("GEMMA_MODEL", "gemma-4-26b-a4b-it")
client = genai.Client(api_key=API_KEY) if API_KEY else None

MODE_PROMPTS = {
    "explain": (
        "You are StudyMate AI, a patient tutor. Explain the student's question in simple language. "
        "Use clear headings, define important terms, and show steps for calculations when useful. "
        "If the question is ambiguous, say what is unclear. Do not invent facts."
    ),
    
"quiz": (
    "You are StudyMate AI, a patient tutor. Create exactly 5 multiple-choice "
    "questions about the student's topic, with a mix of easy and medium difficulty. "
    "Return ONLY valid JSON, with no markdown or code fences, using this structure: "
    '{"questions":[{"question":"Question text","options":["Option A","Option B","Option C","Option D"],"correct_index":0,"explanation":"Brief explanation"}]}. '
    "Each question must have exactly 4 options. correct_index must be an integer "
    "from 0 to 3 indicating the correct option. Include a brief, accurate explanation. "
    "Do not invent facts."
),
    
    "notes": (
        "You are StudyMate AI. Turn the student's question or topic into concise revision notes. "
        "Use headings, bullet points, key definitions, and a short recap. Do not invent facts."
    ),
}

@app.get("/")
def home():
    return render_template("index.html")

@app.post("/api/study")
def study():
    if client is None:
        return jsonify(error="API key not configured. Add GEMINI_API_KEY to your .env file and restart the app."), 500

    question = (request.form.get("question") or "").strip()
    mode = (request.form.get("mode") or "explain").strip()
    image = request.files.get("image")

    if mode not in MODE_PROMPTS:
        mode = "explain"
    if not question and (not image or not image.filename):
        return jsonify(error="Type a question or upload an image first."), 400

    prompt = MODE_PROMPTS[mode] + "\n\nStudent's request:\n" + (question or "Please study and explain the uploaded image.")
    contents = [prompt]

    if image and image.filename:
        allowed = {"image/png", "image/jpeg", "image/webp"}
        if image.mimetype not in allowed:
            return jsonify(error="Please upload a PNG, JPG/JPEG, or WEBP image."), 400
        image_bytes = image.read()
        if not image_bytes:
            return jsonify(error="The uploaded image is empty."), 400
        mime_type = image.mimetype
        contents = [
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            prompt
        ]

    try:
        response = client.models.generate_content(model=MODEL, contents=contents)
        answer = (response.text or "").strip()
        if not answer:
            return jsonify(error="The model returned an empty response. Please try again."), 502
        
        if mode == "quiz":
            try:
                # Remove optional Markdown code fences.
                cleaned = answer.strip()
                if cleaned.startswith("```"):
                    cleaned = cleaned.split("\n", 1)[1]
                    cleaned = cleaned.rsplit("```", 1)[0].strip()

                quiz_data = json.loads(cleaned)
                questions = quiz_data.get("questions", [])

                if len(questions) != 5:
                    raise ValueError("Expected 5 questions")

                for item in questions:
                    if (
                        not isinstance(item.get("question"), str)
                        or not isinstance(item.get("options"), list)
                        or len(item["options"]) != 4
                        or not isinstance(item.get("correct_index"), int)
                        or item["correct_index"] not in range(4)
                        or not isinstance(item.get("explanation"), str)
                    ):
                        raise ValueError("Invalid quiz structure")

                return jsonify(quiz=quiz_data)

            except (ValueError, TypeError, json.JSONDecodeError):
                app.logger.warning("The model returned invalid quiz JSON")
                return jsonify(
                    error="Quiz format sahi nahi aaya. Please try again."
                ), 502

        return jsonify(answer=answer)
    except Exception as exc:
        # Keep detailed exception out of the browser response; server logs can help debugging.
        app.logger.exception("Gemma API request failed")
        return jsonify(error="The AI request failed. Check your API key, model availability, internet connection, and API usage limits."), 502

@app.errorhandler(413)
def too_large(_error):
    return jsonify(error="Image is too large. Please choose an image under 8 MB."), 413

if __name__ == "__main__":
    app.run(debug=True)
