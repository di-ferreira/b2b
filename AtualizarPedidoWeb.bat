@echo off

git pull
if %errorlevel% neq 0 (
    echo Erro ao iniciar o servidor. Verifique os logs acima.
    pause
)

yarn build
if %errorlevel% neq 0 (
    echo Erro ao iniciar o servidor. Verifique os logs acima.
    pause
)

pause
