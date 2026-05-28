#!/bin/bash

echo "==> Executando git pull..."
git pull
if [ $? -ne 0 ]; then
  echo "Erro ao fazer git pull. Verifique os logs acima."
  read -p "Pressione enter para continuar..."
  exit 1
fi

echo "==> Executando npm run build..."
npm run build
if [ $? -ne 0 ]; then
  echo "Erro ao executar npm run build. Verifique os logs acima."
  read -p "Pressione enter para continuar..."
  exit 1
fi

read -p "Pressione enter para finalizar..."
