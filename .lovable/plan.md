
## Plano: Funil Prioritário ao Abrir Página de Leads

### Objetivo

Permitir que o usuário defina qual funil deve aparecer como padrão ao abrir a página `/crm/leads`, ao invés de usar a ordem alfabética.

---

### Situação Atual

1. Os funis são ordenados por nome (`ORDER BY nome`) na query do banco de dados
2. O primeiro funil da lista ordenada é automaticamente selecionado como padrão
3. Não há nenhuma preferência salva do usuário

---

### Solução Proposta

Usar o **localStorage** para salvar a preferência do usuário, seguindo o mesmo padrão já implementado para os filtros de etapas. Esta é a abordagem mais adequada porque:

1. Não requer alterações no banco de dados
2. A preferência é salva por empresa (cada empresa pode ter um funil prioritário diferente)
3. Segue o padrão já utilizado no projeto

---

### Arquivos a Alterar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/crm/leads/index.tsx` | Adicionar lógica para salvar/carregar funil prioritário e botão para definir prioridade |

---

### Detalhes Técnicos

#### 1. Estrutura de Armazenamento

A chave do localStorage será:
```
crm_leads_funil_prioritario_{empresaId}
```

O valor será o ID do funil prioritário (string).

#### 2. Funções para Salvar e Carregar Funil Prioritário

```typescript
const savePriorityFunilToStorage = (empresaId: string, funilId: string) => {
  if (!empresaId || !funilId) return;
  const key = `crm_leads_funil_prioritario_${empresaId}`;
  localStorage.setItem(key, funilId);
};

const loadPriorityFunilFromStorage = (empresaId: string): string | null => {
  if (!empresaId) return null;
  const key = `crm_leads_funil_prioritario_${empresaId}`;
  return localStorage.getItem(key);
};
```

#### 3. Modificar a Lógica de Seleção do Funil Padrão

Na função `fetchAllData`, após carregar os funis, verificar se há um funil prioritário salvo:

```typescript
// Definir o funil padrão: prioritário ou primeiro da lista
if (funisFormatados.length > 0) {
  const funilPrioritarioId = loadPriorityFunilFromStorage(empresaIdToUse);
  const funilPrioritario = funilPrioritarioId 
    ? funisFormatados.find(f => f.id === funilPrioritarioId)
    : null;
  
  if (funilPrioritario) {
    console.log('Usando funil prioritário:', funilPrioritario.id);
    setSelectedFunilId(funilPrioritario.id);
  } else {
    console.log('Usando primeiro funil da lista:', funisFormatados[0].id);
    setSelectedFunilId(funisFormatados[0].id);
  }
}
```

#### 4. Adicionar Opção para Definir Funil Prioritário

Adicionar um ícone de estrela ao lado do seletor de funil para que o usuário possa definir o funil atual como prioritário:

```tsx
{/* Seletor de Funil com opção de definir prioritário */}
<div className="w-full md:w-[250px] flex gap-2">
  <Select
    value={selectedFunilId || ""}
    onValueChange={handleFunilChange}
  >
    <SelectTrigger className="w-full bg-white">
      <SelectValue placeholder="Selecionar funil" />
    </SelectTrigger>
    <SelectContent className="bg-white">
      {funis.map((funil) => (
        <SelectItem key={funil.id} value={funil.id}>
          {funil.nome}
          {loadPriorityFunilFromStorage(empresaId || '') === funil.id && (
            <Star className="h-3 w-3 ml-1 inline fill-amber-400 text-amber-400" />
          )}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  
  <Button
    variant="ghost"
    size="icon"
    onClick={handleSetPriorityFunil}
    title={isPriorityFunil ? "Remover como funil padrão" : "Definir como funil padrão"}
  >
    <Star className={cn(
      "h-4 w-4",
      isPriorityFunil ? "fill-amber-400 text-amber-400" : "text-gray-400"
    )} />
  </Button>
</div>
```

#### 5. Função para Definir/Remover Funil Prioritário

```typescript
const [priorityFunilId, setPriorityFunilId] = useState<string | null>(null);

const isPriorityFunil = selectedFunilId === priorityFunilId;

const handleSetPriorityFunil = () => {
  if (!empresaId || !selectedFunilId) return;
  
  if (isPriorityFunil) {
    // Remover prioridade
    localStorage.removeItem(`crm_leads_funil_prioritario_${empresaId}`);
    setPriorityFunilId(null);
    toast.success("Funil padrão removido");
  } else {
    // Definir como prioritário
    savePriorityFunilToStorage(empresaId, selectedFunilId);
    setPriorityFunilId(selectedFunilId);
    toast.success("Funil definido como padrão", {
      description: "Este funil será aberto automaticamente ao acessar a página."
    });
  }
};
```

#### 6. Carregar Funil Prioritário na Inicialização

Adicionar um `useEffect` para carregar o funil prioritário salvo quando o empresaId for definido:

```typescript
useEffect(() => {
  if (empresaId) {
    const savedPriorityFunil = loadPriorityFunilFromStorage(empresaId);
    setPriorityFunilId(savedPriorityFunil);
  }
}, [empresaId]);
```

---

### Interface do Usuário

O botão de estrela ficará ao lado do seletor de funil:
- **Estrela vazia (cinza)**: Clique para definir o funil atual como padrão
- **Estrela preenchida (amarela)**: O funil atual é o padrão; clique para remover

Os itens no dropdown também mostrarão uma pequena estrela ao lado do funil que está definido como padrão.

---

### Fluxo Esperado

1. **Usuário acessa a página** → Sistema verifica se há funil prioritário salvo → Seleciona o funil prioritário ou o primeiro da lista
2. **Usuário clica na estrela** → Funil atual é definido como prioritário → Toast de confirmação
3. **Usuário atualiza a página (F5)** → Sistema carrega o funil prioritário automaticamente
4. **Usuário clica na estrela novamente** → Prioridade é removida → Volta ao comportamento padrão (primeiro da lista)

---

### Resultado Esperado

- O usuário pode definir qual funil abre por padrão
- A preferência é mantida após atualizar a página
- Visual intuitivo com ícone de estrela
- Cada empresa pode ter sua própria configuração de funil prioritário
