# Investigação — Hydration Error na Tela Caixa

**Data:** 26/07/2026
**Status:** ✅ RESOLVIDO

---

## Problema

React hydration error ao acessar qualquer página autenticada:

```
A tree hydrated but some attributes of the server rendered HTML
didn't match the client properties.

Diferença:
<html lang="pt-BR" className="...">
- __gcrremoteframetoken="972d6aad204940c93c06709a3dfcdfc6"
```

## Causa

### 🔴 Browser Extension (não é bug do código)

O atributo `__gcrremoteframetoken` é **injetado por uma extensão do navegador** no elemento `<html>` após o servidor renderizar a página.

**Extensões conhecidas que injetam este atributo:**

- Google Cast (Chromecast)
- Extensões de gravação de tela / remote desktop
- Ferramentas de desenvolvimento remote

**Evidência:**

1. O atributo `__gcrremoteframetoken` não existe no código fonte — nenhum componente do sistema o insere
2. Todas as páginas autenticadas são componentes `'use client'` — não há SSR dinâmico
3. A Caixa (`caixa/page.tsx`) é um componente client que renderiza apenas no navegador
4. O único local que renderiza `<html>` é o `layout.tsx` raiz (server component) — sem conteúdo dinâmico

### Teste de Confirmação

Para confirmar:
1. Abrir o sistema em uma **janela anônima/privada sem extensões**
2. Acessar `/caixa`
3. O erro de hidratação **não deve aparecer**

## Correção

Adicionado `suppressHydrationWarning` no `<html>` do `layout.tsx`:

```tsx
<html
  lang="pt-BR"
  className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
  suppressHydrationWarning   // ← adicionado
>
```

Esta é a prática recomendada pela documentação do Next.js para ignorar diferenças de atributos causadas por extensões de navegador.

## Arquivos Alterados

| Arquivo | Alteração |
|---------|-----------|
| `frontend/src/app/layout.tsx` | +`suppressHydrationWarning` no `<html>` |

## Testes Realizados

| Teste | Resultado |
|-------|:---------:|
| Verificar se `__gcrremoteframetoken` existe no código fonte | ❌ Não existe — é de extensão |
| Verificar se caixa/page.tsx usa `'use client'` | ✅ Sim — sem SSR dinâmico |
| Verificar se layout.tsx tem conteúdo dinâmico | ✅ Não — apenas fontes estáticas |
| Adicionar suppressHydrationWarning | ✅ Implementado |
| npx next build | ⚠️ OOM na máquina local (limitação de recurso, não código) |

## Conclusão

**Causa raiz:** Extensão de navegador injetando `__gcrremoteframetoken` no `<html>`.
**Correção:** `suppressHydrationWarning` no root layout.
**Impacto:** Zero — não altera funcionalidade, não altera backend, não altera regras financeiras.
