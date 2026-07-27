# Guia de Instalação — Barbershop ERP v1.0.5

## Requisitos Mínimos

| Recurso | Mínimo | Recomendado |
|---------|:------:|:-----------:|
| CPU | 2 cores | 4 cores |
| RAM | 2 GB | 4 GB |
| Disco | 10 GB | 20 GB SSD |
| Node.js | 18.x | 20.x LTS |
| PostgreSQL | 14.x | 16.x |
| NPM | 9.x | 10.x |

---

## Instalação Rápida (Linux)

```bash
# 1. Clonar o repositório
git clone https://github.com/Antonio1986-2025/barbershop-erp.git
cd barbershop-erp

# 2. Configurar variáveis de ambiente
cp backend/.env.example backend/.env
nano backend/.env
# Editar DATABASE_URL com suas credenciais PostgreSQL

# 3. Instalar dependências
cd backend && npm install
cd ../frontend && npm install
cd ..

# 4. Configurar banco de dados
cd backend
npx prisma generate
npx prisma db push
npx prisma db seed
cd ..

# 5. Build
cd backend && npm run build && cd ..
cd frontend && npm run build && cd ..

# 6. Iniciar
# Terminal 1: cd backend && node dist/src/main.js
# Terminal 2: cd frontend && npx next start
```

## Instalação via Docker

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: barbershop
      POSTGRES_USER: barbershop
      POSTGRES_PASSWORD: mudar123
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://barbershop:mudar123@postgres:5432/barbershop
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
    depends_on:
      - backend

volumes:
  pgdata:
```

## Primeiro Acesso

1. Acesse `http://localhost:3000`
2. Login: **admin@demo.com** / **123456**
3. Acesse Configurações para personalizar
4. Cadastre profissionais, serviços e horários

## Login Demo

| Perfil | Email | Senha |
|--------|-------|-------|
| Admin | admin@demo.com | 123456 |
| Barbeiro | barber@demo.com | 123456 |
| Operador | operador@demo.com | 123456 |
| Visualizador | visualizador@demo.com | 123456 |

## Deploy em Produção

### Railway
```bash
# Conecte o repositório GitHub ao Railway
# Adicione PostgreSQL via Railway Dashboard
# Configure as variáveis de ambiente
# Deploy automático a cada push no main
```

### VPS (Ubuntu)
```bash
# Usando PM2 para processos em background
npm install -g pm2
cd backend && pm2 start dist/src/main.js --name barber-api
cd frontend && pm2 start npx --name barber-web -- next start -p 3000

# Configurar nginx como reverse proxy
# Configurar SSL com Let's Encrypt
```

## Atualização

```bash
git pull
cd backend && npm install && npx prisma generate && npm run build
cd frontend && npm install && npm run build
pm2 restart all
```
