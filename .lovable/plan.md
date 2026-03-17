
## Correção: Baixa com Antecipação Parcial e Desfazer Baixa

### Problemas Identificados

#### 1. Processamento DUPLICADO das antecipações
O `BaixarContaPagarModal` (handleConfirmar) já executa todas as operações no banco de dados:
- Atualiza a parcela
- Insere na tabela `movimentacoes_parcelas_antecipacoes`
- Incrementa `valor_utilizado` na antecipação
- Insere registros no `fluxo_caixa`

Depois, chama `onBaixar()` que dispara `realizarBaixa()` em `index.tsx`, que repete as mesmas operações:
- Atualiza a parcela NOVAMENTE
- Incrementa `valor_utilizado` NOVAMENTE (duplicando o valor)
- Insere na tabela de relacionamento NOVAMENTE
- Insere no `fluxo_caixa` NOVAMENTE

**Exemplo:** Antecipação de R$1.000, uso parcial de R$500:
- Modal: valor_utilizado = 0 + 500 = **500** (correto)
- realizarBaixa: valor_utilizado = 500 + 500 = **1.000** (errado - aparece como totalmente utilizada)

#### 2. Status da antecipação não atualizado corretamente
O modal atualiza `valor_utilizado` mas nunca atualiza o campo `status`. A antecipação deveria manter status "ativa" quando ainda tem saldo disponível, e mudar para "utilizada" somente quando totalmente consumida.

#### 3. Desfazer baixa com valor duplicado
Ao desfazer a baixa, o sistema subtrai o valor uma vez (correto), mas como foi duplicado, o `valor_utilizado` fica com saldo residual incorreto. Além disso, existem registros duplicados na tabela `movimentacoes_parcelas_antecipacoes`.

---

### Solução

#### Arquivo 1: `src/pages/financeiro/contas-a-pagar/index.tsx`

**Remover toda a lógica duplicada de `realizarBaixa`**. A função deve apenas recarregar os dados e exibir o toast, já que o modal faz todo o trabalho.

Antes (linhas 133-243):
```typescript
function realizarBaixa({ ... }) {
  // Atualiza parcela DUPLICADO
  // Atualiza antecipação DUPLICADO
  // Insere relacionamento DUPLICADO
  // Insere fluxo de caixa DUPLICADO
  // Recarrega dados
}
```

Depois:
```typescript
function realizarBaixa() {
  if (!contaParaBaixar || !currentCompany) return;

  const recarregar = async () => {
    try {
      await carregarContasAPagar();
      toast({
        title: "Sucesso",
        description: "Título baixado com sucesso!"
      });
      setModalBaixarAberto(false);
      setContaParaBaixar(null);
    } catch (error) {
      console.error("Erro ao recarregar dados:", error);
    }
  };

  recarregar();
}
```

#### Arquivo 2: `src/components/contas-a-pagar/BaixarContaPagarModal.tsx`

**Adicionar atualização do status da antecipação** ao atualizar `valor_utilizado`:

```typescript
const novoValorUtilizado = (antAtual?.valor_utilizado || 0) + antSel.valor;
const novoStatus = novoValorUtilizado >= (antAtual?.valor_total || 0) ? 'utilizada' : 'ativa';

const { error: antecipacaoError } = await supabase
  .from("antecipacoes")
  .update({
    valor_utilizado: novoValorUtilizado,
    status: novoStatus
  })
  .eq("id", antSel.id);
```

---

### Arquivos a Alterar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/financeiro/contas-a-pagar/index.tsx` | Simplificar `realizarBaixa` removendo lógica duplicada |
| `src/components/contas-a-pagar/BaixarContaPagarModal.tsx` | Adicionar atualização de status ao usar antecipação parcial |

---

### Resultado Esperado

1. Uso parcial de antecipação: `valor_utilizado` incrementa corretamente (uma vez só), status permanece "ativa"
2. Uso total de antecipação: `valor_utilizado` = `valor_total`, status muda para "utilizada"
3. Desfazer baixa: reverte `valor_utilizado` corretamente e restaura status para "ativa" (esta lógica já está implementada corretamente em `handleDesfazerBaixa`)
