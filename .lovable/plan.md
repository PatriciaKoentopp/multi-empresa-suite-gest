# Plano: Novo módulo "Relógio"

Nesta primeira etapa, criar apenas a estrutura de navegação e a página inicial do módulo, sem alterar nenhuma funcionalidade existente. Funcionalidades de timer, projetos, tarefas e relatórios serão adicionadas em etapas seguintes.

## Escopo desta etapa

1. **Adicionar item "Relógio" no menu lateral**
   - Inserir em `src/config/navigation.ts`, logo após o bloco do CRM e antes de Relatórios.
   - Usar ícone `Clock` (Lucide), seguindo o mesmo padrão dos demais itens.
   - Inicialmente sem subitens (link direto para `/relogio`), mantendo o padrão visual e cores atuais da sidebar.

2. **Registrar ícone `Clock` no renderizador da sidebar**
   - Em `src/components/layout/sidebar-nav.tsx`, adicionar o case `"Clock"` em `renderIcon` para suportar o novo ícone via string.

3. **Criar página inicial do módulo**
   - Novo arquivo `src/pages/relogio/index.tsx` com layout padrão (título, descrição e área de conteúdo vazia), usando os mesmos tokens de design e estilos das demais páginas.
   - Conteúdo: um cabeçalho "Relógio" + texto curto indicando que as funcionalidades serão adicionadas em breve.

4. **Registrar a rota no `App.tsx`**
   - Adicionar `<Route path="/relogio" element={<Relogio />} />` dentro do layout autenticado, seguindo o mesmo padrão das demais rotas.

5. **Habilitar visibilidade pelo controle de módulos**
   - O hook `useModulosParametros` gera automaticamente as chaves de módulo a partir de `navigationConfig`, então o novo item aparecerá como ativo por padrão para empresas existentes (fallback `true` em `isModuloAtivo` quando não há registro). Não é necessária migração.

## Detalhes técnicos

- Arquivos alterados:
  - `src/config/navigation.ts` — novo item entre CRM e Relatórios.
  - `src/components/layout/sidebar-nav.tsx` — case `"Clock"` em `renderIcon`.
  - `src/App.tsx` — nova rota `/relogio`.
- Arquivo criado:
  - `src/pages/relogio/index.tsx` — página placeholder.
- Sem alterações em banco de dados, hooks de negócio ou outras páginas.

## Próximas etapas (não fazem parte desta)

Após confirmar a estrutura, definiremos juntos:
- Entidades (projetos/tarefas/entradas de tempo) e tabelas no Supabase.
- Timer ao vivo (start/stop), entradas manuais, edição.
- Listagem por dia/semana e relatórios.
