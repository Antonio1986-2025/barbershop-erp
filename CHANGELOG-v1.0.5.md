# CHANGELOG — v1.0.5

## v1.0.5 — Preparação Comercial (27/07/2026)

### 🐛 Bugs Corrigidos
- Agendamento: `getDay()` usava timezone local. Corrigido para `getUTCDay()` (BRT causava dia anterior)
- Seed: Adicionado BusinessHours (Seg-Sex 08-18h, Sáb 08-13h)
- Auth: `professionalId` ausente no endpoint `/api/auth/profile`
- Barber: Criado endpoint `/api/barber/commissions`

### ✨ Melhorias
- Sidebar reorganizada em 6 grupos recolhíveis (Operação, Atendimento, Financeiro, Administração, Barbeiro, Suporte)
- Central de Ajuda em `/ajuda` com guia rápido, perfis, módulos e FAQ
- Página de Comandas para ADMIN em `/service-orders`
- Toast global com 4 tipos (SUCCESS, ERROR, WARNING, INFO)
- Breadcrumbs em todas as páginas
- ConfirmDialog padronizado

### 🚀 Funcionalidades Novas
- Comissões automáticas (cálculo no PAID)
- Aprovação/rejeição de comissões
- Fechamento de período (CommissionClosing)
- Frontend de comissões do barbeiro
- Frontend de gestão de comissões (admin)

### 📦 Infraestrutura
- INSTALL.md com guia de instalação (Linux, Docker, Railway, VPS)
- Documentação de instalação completa

### Commit Hash
`fd4ff7d` (RC1) — branch `main`

---

## v1.0.3 — Módulo BARBER

- Comissões: cálculo, aprovação, fechamento
- Perfil BARBER com permissões restritas
- Hotfix Caixa (transactions undefined + JSX quebrado)
- UX.1: Toast, ConfirmDialog, Breadcrumbs

## v1.0.2 — Baseline

- Versão estável inicial
- Todos os módulos operacionais
- CRM, Estoque, Financeiro, Caixa
