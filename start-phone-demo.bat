@echo off
echo ========================================
echo HealthHub AI - Phone Demo Setup
echo ========================================
echo.
echo 1. Start backend:  start-backend.bat
echo 2. Start frontend: start-frontend.bat  (now exposes LAN IP)
echo 3. On your phone (same WiFi), open the Network URL shown by Vite
echo    Example: http://192.168.1.5:5173
echo.
echo 4. Login - go to Medications - follow ntfy setup
echo 5. Install ntfy app, subscribe to your topic, tap "Send now"
echo    Your phone will buzz in front of the judges!
echo.
echo Optional HTTPS tunnel (for browser push without ntfy):
echo   winget install Cloudflare.cloudflared
echo   cloudflared tunnel --url http://localhost:5173
echo.
pause
