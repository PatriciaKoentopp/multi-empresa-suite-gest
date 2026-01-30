
## Plano: Rotina de Backup dos Dados da Empresa

### Objetivo

Criar uma funcionalidade de backup que permita ao usuário baixar todos os dados da empresa logada em formato Excel, com uma aba para cada tabela do sistema.

---

### Estrutura da Solução

#### 1. Nova Página de Backup

Criar uma página dedicada em `/backup` que permitirá:
- Visualizar as tabelas disponíveis para backup
- Selecionar quais tabelas incluir no backup
- Gerar e baixar o arquivo Excel com os dados

#### 2. Adicionar ao Menu Lateral

Adicionar um novo item de navegação após "Relatórios":
- Título: "Backup"
- Ícone: Download ou Database
- Rota: `/backup`

---

### Tabelas a Incluir no Backup

Com base na análise do banco de dados, as seguintes tabelas serão incluídas (filtradas pela empresa logada):

| Tabela | Descrição |
|--------|-----------|
| `empresas` | Dados da empresa |
| `favorecidos` | Clientes e fornecedores |
| `grupo_favorecidos` | Grupos de favorecidos |
| `profissoes` | Profissões cadastradas |
| `origens` | Origens dos leads |
| `motivos_perda` | Motivos de perda de leads |
| `contas_correntes` | Contas bancárias |
| `tipos_titulos` | Tipos de títulos |
| `plano_contas` | Plano de contas |
| `produtos` | Produtos cadastrados |
| `grupo_produtos` | Grupos de produtos |
| `movimentacoes` | Movimentações financeiras |
| `movimentacoes_parcelas` | Parcelas das movimentações |
| `fluxo_caixa` | Fluxo de caixa |
| `antecipacoes` | Antecipações |
| `lancamentos_contabeis` | Lançamentos contábeis |
| `funis` | Funis do CRM |
| `funil_etapas` | Etapas dos funis |
| `leads` | Leads do CRM |
| `leads_interacoes` | Interações dos leads |
| `leads_fechamento` | Fechamentos dos leads |
| `orcamentos` | Orçamentos/Vendas |
| `orcamentos_itens` | Itens dos orçamentos |
| `orcamentos_parcelas` | Parcelas dos orçamentos |
| `contratos` | Contratos |
| `contratos_parcelas` | Parcelas dos contratos |
| `dashboard_cards_config` | Configuração dos cards |
| `modulos_parametros` | Parâmetros dos módulos |

---

### Arquivos a Criar/Alterar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/pages/backup/index.tsx` | Criar | Página principal do backup |
| `src/hooks/useBackup.ts` | Criar | Hook para gerenciar a lógica de backup |
| `src/config/navigation.ts` | Alterar | Adicionar item "Backup" ao menu |
| `src/components/layout/sidebar-nav.tsx` | Alterar | Adicionar ícone "Download" |
| `src/App.tsx` | Alterar | Adicionar rota `/backup` |

---

### Detalhes Técnicos

#### 1. Hook `useBackup.ts`

```typescript
// Estrutura do hook
export function useBackup() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { currentCompany } = useCompany();

  // Lista de tabelas para backup
  const tables = [
    { id: 'empresas', name: 'Empresa', query: () => ... },
    { id: 'favorecidos', name: 'Favorecidos', query: () => ... },
    // ... demais tabelas
  ];

  // Função para gerar backup
  const generateBackup = async (selectedTables: string[]) => {
    // Buscar dados de cada tabela selecionada
    // Criar workbook Excel com uma aba por tabela
    // Baixar arquivo
  };

  return { tables, generateBackup, isGenerating, progress };
}
```

#### 2. Página de Backup

Interface simples com:
- Lista de checkboxes para selecionar tabelas
- Botão "Selecionar Todas" / "Desmarcar Todas"
- Botão "Gerar Backup" com indicador de progresso
- Nome do arquivo: `backup-{nome_empresa}-{data}.xlsx`

#### 3. Navegação

```typescript
// Em navigation.ts, após Relatórios:
{
  title: "Backup",
  href: "/backup",
  icon: "Download",
},
```

#### 4. Ícone no Sidebar

Adicionar mapeamento do ícone `Download` na função `renderIcon`:

```typescript
case "Download": return <Download className="h-4 w-4" />;
```

---

### Interface do Usuário

A página terá um layout simples:

```
┌─────────────────────────────────────────────────┐
│  Backup de Dados                                │
│  Gere um backup completo dos dados da empresa   │
├─────────────────────────────────────────────────┤
│                                                 │
│  ☑ Selecionar Todas    ☐ Desmarcar Todas       │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ ☑ Empresa                               │   │
│  │ ☑ Favorecidos                           │   │
│  │ ☑ Grupos de Favorecidos                 │   │
│  │ ☑ Profissões                            │   │
│  │ ☑ Origens                               │   │
│  │ ... (demais tabelas)                    │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │        [Gerar Backup]                   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Último backup: Nunca realizado                │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### Fluxo Esperado

1. **Usuário acessa a página de Backup** no menu lateral
2. **Seleciona as tabelas** que deseja incluir no backup (todas selecionadas por padrão)
3. **Clica em "Gerar Backup"** → Sistema busca os dados de cada tabela
4. **Progresso é exibido** enquanto o backup é gerado
5. **Arquivo Excel é baixado** automaticamente com todos os dados

---

### Segurança

- O backup inclui **apenas dados da empresa logada** (filtro por `empresa_id`)
- Utiliza as mesmas políticas RLS já existentes no banco de dados
- Não expõe dados de outras empresas

---

### Formato do Arquivo

O arquivo Excel terá:
- **Nome**: `backup-{nome_fantasia}-{YYYY-MM-DD}.xlsx`
- **Abas**: Uma aba para cada tabela selecionada
- **Colunas**: Todas as colunas da tabela com nomes formatados
- **Datas**: Formato DD/MM/YYYY
- **Valores**: Formato monetário brasileiro (R$)
