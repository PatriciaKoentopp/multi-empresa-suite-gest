

## Plano: Corrigir colunas fantasmas no PDF do Razão Contábil

### Diagnóstico
O PDF do Razão Contábil está gerando colunas extras (mostradas como "..." no anexo) porque nas linhas de cabeçalho de conta e de totais, além da célula com `colSpan`, estão sendo adicionadas células vazias (`''`) que o jsPDF interpreta como colunas adicionais.

### Arquivo a modificar
| Arquivo | Ação |
|---------|------|
| `src/hooks/usePdfLancamentos.ts` | Corrigir — remover células vazias extras nas linhas com colSpan |

### Alterações
1. **Linha de cabeçalho da conta (aprox. linha 199-202)**: Remover as 5 células vazias após a célula com `colSpan: 6`
2. **Linha de totais da conta (aprox. linha 217-223)**: Reestruturar para ter apenas as células necessárias:
   - Célula 1: `Totais - {código}` com `colSpan: 3`
   - Célula 2: Total de Débitos (sem colSpan, posição 3)
   - Célula 3: Total de Créditos (sem colSpan, posição 4)
   - Célula 4: Saldo Final (sem colSpan, posição 5)

### Resultado esperado
PDF com exatamente 6 colunas alinhadas: Data | NF/Parcela | Histórico | Débito | Crédito | Saldo — sem colunas fantasmas à direita.

