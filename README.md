# StudyMate AI — Gemma 4 Hackathon MVP

A beginner-friendly Flask web app that accepts a typed question or an image and uses Gemma 4 through the Gemini API to generate:
- Simple explanations
- Practice quizzes
- Revision notes

## Requirements
- Python 3.10+
- Internet connection
- Gemini API key with access to a supported Gemma 4 model

Official docs:
- Gemma 4 on Gemini API: https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api
- API key setup: https://ai.google.dev/gemini-api/docs/get-started
- Google Gen AI Python SDK: https://ai.google.dev/gemini-api/docs/libraries

## Run locally (Windows)

1. Extract this project folder.
2. Open a terminal in the `studymate_ai` folder.
3. Create a virtual environment:

   ```powershell
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

   If PowerShell blocks activation, open Command Prompt and run:
   `.\.venv\Scripts\activate.bat`

4. Install dependencies:

   ```bash
   python -m pip install -r requirements.txt
   ```

5. Copy `.env.example` to a new file named `.env`.
6. Edit `.env` and replace the placeholder with your API key.
7. Start the app:

   ```bash
   python app.py
   ```

8. Open http://127.0.0.1:5000 in your browser.

## Run locally (macOS/Linux)

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your API key
python app.py
```

Then open http://127.0.0.1:5000.

## Demo checklist
1. Click the "Data structures" example and ask for an explanation.
2. Switch to "Practice quiz" and generate a quiz on the same topic.
3. Switch to "Revision notes" and generate concise notes.
4. Upload a clear photo of a textbook question and enter a short instruction.
5. Test an empty request and an unsupported file type.

## Troubleshooting
- "API key not configured": check the `.env` filename and `GEMINI_API_KEY` value, then restart Flask.
- API request failed: verify your API key, model access, quota/rate limits, internet connection, and the model ID shown in the official Gemma docs.
- Image problems: use a clear PNG/JPG/WEBP image under 8 MB.
- Keep `.env` private. Never paste your key into HTML/JavaScript, a screenshot, or a public GitHub repository.

## Notes
- This is a hackathon MVP, not a validated educational product.
- AI can make mistakes; verify important answers against course materials.
- Debug mode is enabled for local development. Turn it off and use a production WSGI server before deploying publicly.
