@echo off
echo Mencari proses di port 3006...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3006" ^| find "LISTENING"') do (
    echo Mematikan PID %%a...
    taskkill /PID %%a /F
)
echo.
echo Port 3006 sudah bebas. Jalankan: npm run dev
pause
