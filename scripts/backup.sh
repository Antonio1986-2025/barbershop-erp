#!/bin/bash
# Barbershop ERP - Backup Script
# Uso: ./scripts/backup.sh
# 
# Configuração:
#   Exporte as variáveis DATABASE_URL antes de executar
#   Ou edite as variáveis abaixo diretamente

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/barbershop_${TIMESTAMP}.sql"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Barbershop ERP - Backup do Banco${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Criar diretório de backup
mkdir -p "${BACKUP_DIR}"

# Verificar se DATABASE_URL está configurada
if [ -z "${DATABASE_URL:-}" ]; then
  if [ -f .env ]; then
    source .env 2>/dev/null || true
    # Tentar extrair DATABASE_URL do .env
    DATABASE_URL=$(grep -o 'DATABASE_URL="[^"]*"' .env | cut -d'"' -f2 || echo "")
  fi
  
  if [ -z "${DATABASE_URL:-}" ]; then
    echo -e "${RED}ERRO: DATABASE_URL não configurada${NC}"
    echo "Exporte a variável ou configure o arquivo .env"
    exit 1
  fi
fi

echo -e "${YELLOW}📁 Diretório: ${BACKUP_DIR}${NC}"
echo -e "${YELLOW}📦 Arquivo: ${BACKUP_FILE}${NC}"
echo ""

# Executar pg_dump
echo -e "${YELLOW}🔄 Iniciando backup...${NC}"

# Extrair host, port, db da connection string
if echo "$DATABASE_URL" | grep -q "postgresql://\|postgres://"; then
  pg_dump "${DATABASE_URL}" \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
    --format=plain \
    > "${BACKUP_FILE}" 2>/dev/null || {
    # Fallback: usar componentes individuais
    echo -e "${RED}❌ Erro no pg_dump. Tentando formato alternativo...${NC}"
    pg_dump "${DATABASE_URL}" > "${BACKUP_FILE}" 2>/dev/null || {
      echo -e "${RED}❌ Falha no backup. Verifique se o pg_dump está instalado.${NC}"
      exit 1
    }
  }
else
  echo -e "${RED}❌ Formato de DATABASE_URL não reconhecido${NC}"
  exit 1
fi

# Verificar resultado
if [ -f "${BACKUP_FILE}" ]; then
  SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
  LINES=$(wc -l < "${BACKUP_FILE}")
  echo -e "${GREEN}✅ Backup concluído!${NC}"
  echo -e "${GREEN}   Tamanho: ${SIZE}${NC}"
  echo -e "${GREEN}   Linhas: ${LINES}${NC}"
  echo ""
  
  # Comprimir
  gzip -f "${BACKUP_FILE}"
  echo -e "${GREEN}📦 Comprimido: ${BACKUP_FILE}.gz${NC}"
  
  # Manter apenas últimos 7 backups
  echo ""
  echo -e "${YELLOW}🧹 Limpando backups antigos (7 dias)...${NC}"
  find "${BACKUP_DIR}" -name "barbershop_*.sql.gz" -mtime +7 -delete 2>/dev/null || true
  echo -e "${GREEN}✅ Limpeza concluída${NC}"
else
  echo -e "${RED}❌ Falha ao criar arquivo de backup${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Backup finalizado com sucesso!${NC}"
echo -e "${GREEN}========================================${NC}"
