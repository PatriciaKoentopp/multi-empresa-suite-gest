

## Plano: Corrigir Configuração de Relatórios

### Problemas Identificados

1. **Relatórios faltando no `defaultCards`**: O hook `useDashboardCards.ts` não inclui os relatórios `contasPagar`, `contasReceber` e `antecipacoes` na configuração padrão de relatórios.

2. **Registros ausentes no banco de dados**: Os relatórios `tempo`, `fotos`, `projetos`, `aniversariantes`, `contasPagar`, `contasReceber` e `antecipacoes` não foram criados no banco para as empresas existentes.

3. **Botão desmarcar não funciona**: Quando o código tenta atualizar a visibilidade de um relatório que não existe no banco, o update não afeta nenhum registro (não há registro para atualizar).

---

### Solução

#### 1. Atualizar o hook `useDashboardCards.ts`

Adicionar os relatórios que estão faltando no objeto `defaultCards` para a página `relatorios`:

**Relatórios a adicionar:**
- `contasPagar` - Relatório de Contas a Pagar
- `contasReceber` - Relatório de Contas a Receber  
- `antecipacoes` - Relatório de Antecipações

#### 2. Adicionar lógica para criar registros faltantes

Modificar a função `fetchCardsConfig` para verificar se há relatórios novos que não existem no banco e criá-los automaticamente. Isso garantirá que:
- Relatórios novos sejam adicionados ao banco automaticamente
- O switch funcionará para todos os relatórios

---

### Arquivos a Alterar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useDashboardCards.ts` | Adicionar os 3 relatórios faltantes no `defaultCards` e implementar lógica para sincronizar registros faltantes |

---

### Detalhes Técnicos

#### Alteração no defaultCards (linhas 61-72)

**Código Atual:**
```typescript
'relatorios': [
  { card_id: 'favorecido', name: 'Relatório de Favorecido', order_position: 1, is_visible: true },
  { card_id: 'vendas', name: 'Relatório de Vendas', order_position: 2, is_visible: true },
  { card_id: 'classificacaoABC', name: 'Classificação ABC de Clientes', order_position: 3, is_visible: true },
  { card_id: 'analiseDRE', name: 'Análise do DRE', order_position: 4, is_visible: true },
  { card_id: 'tempo', name: 'Relatório de Tempo', order_position: 5, is_visible: true },
  { card_id: 'fotos', name: 'Relatório de Fotos', order_position: 6, is_visible: true },
  { card_id: 'projetos', name: 'Relatório de Projetos', order_position: 7, is_visible: true },
  { card_id: 'aniversariantes', name: 'Relatório de Aniversariantes', order_position: 8, is_visible: true },
  { card_id: 'financeiro', name: 'Relatório Financeiro', order_position: 9, is_visible: true },
  { card_id: 'geral', name: 'Relatório Geral', order_position: 10, is_visible: true },
]
```

**Novo Código:**
```typescript
'relatorios': [
  { card_id: 'favorecido', name: 'Relatório de Favorecido', order_position: 1, is_visible: true },
  { card_id: 'vendas', name: 'Relatório de Vendas', order_position: 2, is_visible: true },
  { card_id: 'classificacaoABC', name: 'Classificação ABC de Clientes', order_position: 3, is_visible: true },
  { card_id: 'analiseDRE', name: 'Análise do DRE', order_position: 4, is_visible: true },
  { card_id: 'tempo', name: 'Relatório de Tempo', order_position: 5, is_visible: true },
  { card_id: 'fotos', name: 'Relatório de Fotos', order_position: 6, is_visible: true },
  { card_id: 'projetos', name: 'Relatório de Projetos', order_position: 7, is_visible: true },
  { card_id: 'aniversariantes', name: 'Relatório de Aniversariantes', order_position: 8, is_visible: true },
  { card_id: 'financeiro', name: 'Relatório Financeiro', order_position: 9, is_visible: true },
  { card_id: 'contasPagar', name: 'Relatório de Contas a Pagar', order_position: 10, is_visible: true },
  { card_id: 'contasReceber', name: 'Relatório de Contas a Receber', order_position: 11, is_visible: true },
  { card_id: 'antecipacoes', name: 'Relatório de Antecipações', order_position: 12, is_visible: true },
  { card_id: 'geral', name: 'Relatório Geral', order_position: 13, is_visible: true },
]
```

#### Nova função para sincronizar registros faltantes

Adicionar uma função `syncMissingCards` que será chamada após buscar a configuração existente:

```typescript
const syncMissingCards = async (existingCards: DashboardCardConfig[]) => {
  if (!currentCompany?.id) return existingCards;

  const cards = defaultCards[pageId as keyof typeof defaultCards] || [];
  const existingCardIds = existingCards.map(c => c.card_id);
  
  // Encontrar cards que não existem no banco
  const missingCards = cards.filter(card => !existingCardIds.includes(card.card_id));
  
  if (missingCards.length === 0) {
    return existingCards;
  }

  // Inserir cards faltantes
  const configsToInsert = missingCards.map(card => ({
    empresa_id: currentCompany.id,
    page_id: pageId,
    card_id: card.card_id,
    is_visible: card.is_visible,
    order_position: card.order_position
  }));

  const { data: insertedCards, error } = await supabase
    .from('dashboard_cards_config')
    .insert(configsToInsert)
    .select();

  if (error) {
    console.error('Erro ao sincronizar cards faltantes:', error);
    return existingCards;
  }

  // Retornar todos os cards (existentes + novos)
  return [...existingCards, ...(insertedCards || [])];
};
```

#### Modificar fetchCardsConfig para usar a nova função

```typescript
const fetchCardsConfig = async () => {
  if (!currentCompany?.id) return;

  try {
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('dashboard_cards_config')
      .select('*')
      .eq('empresa_id', currentCompany.id)
      .eq('page_id', pageId)
      .order('order_position');

    if (error) throw error;

    // Se não há configuração salva, criar configurações padrão
    if (!data || data.length === 0) {
      await createDefaultConfig();
      return;
    }

    // Sincronizar cards faltantes (novos relatórios adicionados)
    const allCards = await syncMissingCards(data);
    setCardsConfig(allCards);
  } catch (error: any) {
    console.error('Erro ao buscar configuração dos cards:', error);
    toast({
      variant: "destructive",
      title: "Erro",
      description: "Não foi possível carregar a configuração dos cards"
    });
  } finally {
    setIsLoading(false);
  }
};
```

---

### Resultado Esperado

Após a implementação:

1. **Todos os 13 relatórios aparecerão** na lista de configuração
2. **O switch funcionará** para todos os relatórios, incluindo tempo, fotos, projetos e aniversariantes
3. **Relatórios novos** (contasPagar, contasReceber, antecipacoes) serão criados automaticamente no banco
4. **Empresas existentes** terão os registros faltantes criados na próxima vez que acessarem a página

