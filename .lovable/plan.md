

## Correção: Edição de Interações Não Salvando

### Problema Identificado

A função `confirmarEdicaoInteracao` existe no arquivo `lead-form-modal.tsx` (linha 408), mas **não está sendo passada como prop** para o componente `InteracoesTab` (linhas 588-599).

No `InteracoesTab`, a prop `confirmarEdicaoInteracao` é opcional (`?`), então quando ela é `undefined`, a condição na linha 94 falha silenciosamente:

```typescript
// InteracoesTab.tsx - linha 93-96
const handleSalvarEdicao = () => {
  if (interacaoParaEditar && confirmarEdicaoInteracao) { // confirmarEdicaoInteracao é undefined!
    confirmarEdicaoInteracao(interacaoParaEditar);       // nunca executa
    setOpenEditarDialog(false);
  }
};
```

### Arquivo a Alterar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/crm/leads/lead-form-modal.tsx` | Adicionar as props `confirmarEdicaoInteracao` e `excluirInteracao` ao componente `InteracoesTab` |

### Correção

Adicionar as duas props faltantes na renderização do `InteracoesTab` (linha 588-599):

```tsx
<InteracoesTab
  lead={lead}
  interacoes={interacoes}
  carregandoInteracoes={carregandoInteracoes}
  novaInteracao={novaInteracao}
  handleInteracaoChange={handleInteracaoChange}
  handleInteracaoSelectChange={handleInteracaoSelectChange}
  handleInteracaoDataChange={handleInteracaoDataChange}
  adicionarInteracao={adicionarInteracao}
  excluirInteracao={excluirInteracao}                   // ADICIONAR
  confirmarEdicaoInteracao={confirmarEdicaoInteracao}   // ADICIONAR
  vendedoresAtivos={vendedoresAtivos}
  getNomeResponsavel={getNomeResponsavel}
/>
```

### Resultado

Ao clicar em "Salvar Alteracoes" no dialog de edicao, a funcao `confirmarEdicaoInteracao` sera chamada corretamente, atualizando os dados no banco de dados e na lista local de interacoes.
