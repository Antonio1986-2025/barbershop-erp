# Technical Metrics

> Executar: `.\scripts\metrics.ps1`
> Requer: Node.js, Jest, dependências instaladas

## Última medição

| Métrica | Valor |
|---|---|
| Módulos | 30+ |
| Serviços | 40+ |
| Controllers | 25+ |
| Endpoints | 150+ |
| Tabelas (Prisma) | 45+ |
| Enums | 30+ |
| Eventos de domínio | 51 |
| Providers de integração | 5 |
| Testes | 381 |
| Suites de teste | 26 |
| Tempo médio dos testes | ~13s |
| Linhas de código (TS) | ~25.000 |
| TODOs / FIXMEs | — |
| Dependências circulares | 0 |
| Vulnerabilidades (npm audit) | — |

## Como medir

```powershell
.\scripts\metrics.ps1
```

O script percorre:

- `backend/src/modules/` — módulos, services, controllers
- `backend/prisma/schema.prisma` — modelos e enums
- `backend/src/` — endpoints (decorators), TODOs, linhas
- `docs/technical/domain-events.md` — eventos catalogados
- `jest` — contagem e tempo dos testes
- `madge` — dependências circulares (opcional)
- `npm audit` — vulnerabilidades

## Objetivo

Acompanhar a evolução do projeto ao longo das sprints e identificar:
- regressões na cobertura de testes;
- aumento de complexidade não planejado;
- dívida técnica (TODOs, circular deps, vulnerabilidades);
- crescimento saudável dos indicadores.
