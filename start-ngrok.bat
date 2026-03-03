@echo off
echo [CitaLiks] Iniciando servidor de desarrollo + ngrok...

REM Mata procesos previos de ngrok para evitar conflictos
taskkill /F /IM ngrok.exe 2>nul
timeout /t 1 /nobreak >nul

REM Inicia ngrok con host-header=rewrite (OBLIGATORIO para que Retell funcione)
start "ngrok" ngrok http 3003 --domain=philanthropistic-verbosely-lu.ngrok-free.dev --host-header=rewrite

echo [OK] ngrok iniciado con --host-header=rewrite
echo [OK] Las llamadas de Retell ahora llegarán correctamente al servidor

pause
