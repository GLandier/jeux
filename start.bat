@echo off
echo.
echo ========================================
echo   MORPHIA - Lancer le jeu
echo ========================================
echo.
echo Demarrage du serveur multijoueur...
start "Serveur Morphia" cmd /k "cd /d %~dp0server && node index.js"

echo Attente 2 secondes...
timeout /t 2 /nobreak > nul

echo Demarrage du client (navigateur)...
start "Client Morphia" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo Le jeu s'ouvrira sur http://localhost:5173
echo Pour le multijoueur, lancez ce fichier sur deux machines.
echo.
pause
