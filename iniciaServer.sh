#!/bin/bash

echo "==> Navegando até o diretório do projeto..."
cd "/c/b2b-emsoft" || {
  echo "Erro: diretório '/c/b2b-emsoft' não encontrado."
  read -p "Pressione Enter para sair..."
  exit 1
}

echo "==> Iniciando o servidor com yarn start..."
yarn start
if [ $? -ne 0 ]; then
  echo "Erro ao iniciar o servidor. Verifique os logs acima."
  read -p "Pressione Enter para sair..."
  exit 1
fi

read -p "Servidor encerrado. Pressione Enter para sair..."

