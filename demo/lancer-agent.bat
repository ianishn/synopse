@echo off
REM Lance l'agent de demo (profil "client") protege par Synopse en production.
REM Double-clic, ou depuis un terminal : demo\lancer-agent.bat
REM Prerequis : copier demo\.env.example en demo\.env et y coller ton token d'agent.
cd /d "%~dp0.."

if not exist "demo\.env" (
  echo [ERREUR] Fichier demo\.env introuvable.
  echo Copie demo\.env.example en demo\.env et colle ton token d'agent dedans.
  pause
  exit /b 1
)

for /f "usebackq tokens=1,* delims==" %%a in ("demo\.env") do set %%a=%%b
for /f "tokens=1,* delims==" %%a in ('findstr /b "ANTHROPIC_API_KEY=" spike-f3\.env') do set ANTHROPIC_API_KEY=%%b

if "%SYNOPSE_AGENT_TOKEN%"=="" (
  echo [ERREUR] SYNOPSE_AGENT_TOKEN absent de demo\.env
  pause
  exit /b 1
)
if "%ANTHROPIC_API_KEY%"=="" (
  echo [ERREUR] Cle Anthropic introuvable dans spike-f3\.env
  pause
  exit /b 1
)

echo Agent protege par Synopse : token OK, API %SYNOPSE_API_URL%
echo.
openclaw --profile client chat
