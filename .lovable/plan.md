

## Plano: Persistir Filtro de Etapas na Página de Leads

### Objetivo

Manter gravada a escolha do usuário para o filtro de etapas na página `/crm/leads`, para que ao atualizar a página ou acessá-la novamente, as etapas selecionadas sejam mantidas.

---

### Solução Proposta

Utilizar o **localStorage** do navegador para salvar a preferência do usuário. Esta é a abordagem mais adequada porque:

1. Não requer alterações no banco de dados
2. A escolha é salva por funil (cada funil pode ter uma configuração diferente)
3. Os dados persistem mesmo após recarregar a página
4. Segue o padrão já utilizado no projeto (veja `auth-context.tsx` e `company-context.tsx`)

---

### Arquivos a Alterar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/crm/leads/index.tsx` | Adicionar lógica para salvar e recuperar filtros de etapas do localStorage |

---

### Detalhes Técnicos

#### 1. Estrutura de Armazenamento

A chave do localStorage será dinâmica por funil:
```
crm_leads_etapas_filter_{funilId}
```

O valor armazenado será um objeto JSON:
```typescript
{
  allStagesSelected: boolean,
  selectedEtapas: string[]
}
```

#### 2. Função para Salvar Filtros

```typescript
const saveStageFiltersToStorage = (funilId: string, allSelected: boolean, etapas: string[]) => {
  if (!funilId) return;
  
  const key = `crm_leads_etapas_filter_${funilId}`;
  const value = JSON.stringify({
    allStagesSelected: allSelected,
    selectedEtapas: etapas
  });
  localStorage.setItem(key, value);
};
```

#### 3. Função para Carregar Filtros

```typescript
const loadStageFiltersFromStorage = (funilId: string): { allStagesSelected: boolean; selectedEtapas: string[] } | null => {
  if (!funilId) return null;
  
  const key = `crm_leads_etapas_filter_${funilId}`;
  const stored = localStorage.getItem(key);
  
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};
```

#### 4. Alterações Necessárias

**a) Carregar filtros ao mudar de funil (`handleFunilChange`):**

Ao invés de sempre resetar para "todas as etapas", verificar se existe filtro salvo:

```typescript
const handleFunilChange = (funilId: string) => {
  console.log('Alterando funil para:', funilId);
  setSelectedFunilId(funilId);
  
  // Tentar carregar filtros salvos para este funil
  const savedFilters = loadStageFiltersFromStorage(funilId);
  
  if (savedFilters) {
    setAllStagesSelected(savedFilters.allStagesSelected);
    setSelectedEtapas(savedFilters.selectedEtapas);
  } else {
    // Se não há filtros salvos, usar padrão (todas selecionadas)
    setAllStagesSelected(true);
    setSelectedEtapas([]);
  }
};
```

**b) Salvar ao alterar seleção de "Todas as etapas" (`handleAllStagesToggle`):**

```typescript
const handleAllStagesToggle = (checked: boolean) => {
  console.log('Alterando seleção "todas as etapas" para:', checked);
  setAllStagesSelected(checked);
  if (checked) {
    setSelectedEtapas([]);
  }
  // Salvar no localStorage
  saveStageFiltersToStorage(selectedFunilId, checked, checked ? [] : selectedEtapas);
};
```

**c) Salvar ao alterar seleção de etapa individual (`handleStageToggle`):**

```typescript
const handleStageToggle = (etapaId: string, checked: boolean) => {
  console.log('Alterando seleção da etapa', etapaId, 'para:', checked);
  
  let newSelectedEtapas: string[];
  let newAllStagesSelected: boolean;
  
  if (checked) {
    newSelectedEtapas = [...selectedEtapas, etapaId];
    newAllStagesSelected = false;
  } else {
    newSelectedEtapas = selectedEtapas.filter(id => id !== etapaId);
    newAllStagesSelected = newSelectedEtapas.length === 0;
  }
  
  setSelectedEtapas(newSelectedEtapas);
  setAllStagesSelected(newAllStagesSelected);
  
  // Salvar no localStorage
  saveStageFiltersToStorage(selectedFunilId, newAllStagesSelected, newSelectedEtapas);
};
```

**d) Carregar filtros na inicialização:**

Adicionar um `useEffect` para carregar os filtros quando o funil for definido pela primeira vez:

```typescript
useEffect(() => {
  if (selectedFunilId) {
    const savedFilters = loadStageFiltersFromStorage(selectedFunilId);
    
    if (savedFilters) {
      setAllStagesSelected(savedFilters.allStagesSelected);
      setSelectedEtapas(savedFilters.selectedEtapas);
    }
  }
}, [selectedFunilId]);
```

---

### Fluxo Esperado

1. **Usuário acessa a página** → Sistema carrega os filtros salvos do localStorage (se existirem)
2. **Usuário altera filtro de etapa** → Sistema salva a nova configuração no localStorage
3. **Usuário atualiza a página (F5)** → Sistema restaura os filtros salvos
4. **Usuário muda de funil** → Sistema carrega os filtros específicos daquele funil (ou padrão se não existir)

---

### Resultado Esperado

- A escolha do usuário será mantida após atualizar a página
- Cada funil terá sua própria configuração de filtros
- O comportamento padrão (todas as etapas selecionadas) continua funcionando para novos funis
- Não há impacto no banco de dados ou performance

