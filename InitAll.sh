#!/bin/bash

echo "==> Atualizando EMSoft B2B..."
/c/b2b-emsoft/AtualizarPedidoWeb.sh
if [ $? -ne 0 ]; then
  echo "[ERRO] Atualizando B2B falhou. Abortando sequência."
  read -p "Pressione Enter para sair..."
  exit 1
fi

echo "==> Iniciando EMSoft B2B..."
/c/b2b-emsoft/iniciaServer.sh
if [ $? -ne 0 ]; then
  echo "[ERRO] Inicialização EMSoft B2B apresentou erro."
fi

# Manter o terminal aberto ao final
echo "==> Execução finalizada. Você pode fechar esta janela quando quiser."
exec bash
