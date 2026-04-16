

## Plano: Corrigir coluna Parcela no Excel de Contas a Pagar

### Problema
Na exportação Excel, a coluna "Parcela" mostra apenas `numeroParcela` (ex: `1`), sem incluir o número do documento/título. Deveria mostrar no formato `título/parcela` (ex: `123/1`), igual à tabela na tela.

### Arquivo a modificar

**`src/hooks/useExcelContasPagar.ts`** — linha 59

Alterar de:
```typescript
"Parcela": conta.numeroParcela,
```

Para:
```typescript
"Parcela": `${conta.numeroTitulo || '-'}/${conta.numeroParcela}`,
```

### O que NÃO será alterado
- Layout da página
- Demais colunas do Excel
- Funcionalidades existentes

