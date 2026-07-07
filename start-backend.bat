@echo off
echo Starting HealthHub AI Backend (Python AI)...
cd /d "%~dp0backend"
if not exist .venv python -m venv .venv
call .venv\Scripts\pip install -r requirements.txt -q
call .venv\Scripts\uvicorn main:app --reload --port 8000
