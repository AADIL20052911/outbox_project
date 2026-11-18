@echo off
echo ========================================================
echo   Starting ReachInbox Infrastructure (Docker Desktop)
echo ========================================================

:: Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not running. Starting Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Waiting 15 seconds for Docker engine to initialize...
    timeout /t 15 /nobreak >nul
)

:: Start containers
cd /d "%~dp0"
docker compose up -d
echo.
echo Infrastructure containers:
docker compose ps
echo.
echo ========================================================
echo   PostgreSQL (5433), Redis (6379), Elasticsearch (9200) are UP!
echo ========================================================
pause
