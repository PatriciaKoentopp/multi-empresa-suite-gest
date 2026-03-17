

## Diagnóstico

O arquivo `src/pages/relatorios/logs/index.tsx` existe, o `.gitignore` já foi corrigido para `/logs`, e o import está correto. Porém o build continua falhando porque o sistema de build do sandbox pode estar com cache ou o diretório `logs` ainda está sendo ignorado internamente.

## Solução: Mover o arquivo para evitar o nome "logs"

A abordagem mais segura é **renomear o diretório** de `logs` para `logs-transacoes`, eliminando qualquer conflito com regras de ignore:

### Alterações

1. **Criar `src/pages/relatorios/logs-transacoes/index.tsx`** — mesmo conteúdo atual do `logs/index.tsx`
2. **Atualizar `src/App.tsx`** — trocar o import:
   - De: `import LogsTransacoes from "./pages/relatorios/logs/index"`
   - Para: `import LogsTransacoes from "./pages/relatorios/logs-transacoes"`
3. **Remover `src/pages/relatorios/logs/index.tsx`** — arquivo antigo

Isso resolve definitivamente o problema sem depender de configurações de `.gitignore`.

