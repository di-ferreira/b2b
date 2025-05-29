@echo off
cd /d "C:\pedido-web-server"
yarn start
if %errorlevel% neq 0 (
    echo Erro ao iniciar o servidor. Verifique os logs acima.
    pause
)

pause
