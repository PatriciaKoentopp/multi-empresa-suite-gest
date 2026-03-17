

## Plano: Corrigir erro de build - arquivo de logs não encontrado

### Diagnóstico

O erro `Could not resolve "./pages/relatorios/logs"` indica que o arquivo `src/pages/relatorios/logs/index.tsx` não está sendo reconhecido no build. Embora o arquivo exista localmente, ele pode ter sido corrompido ou não salvo corretamente em iterações anteriores.

### Solução

Reescrever o arquivo `src/pages/relatorios/logs/index.tsx` para garantir que ele esteja íntegro, com o `export default` correto e sem caracteres invisíveis ou problemas de encoding. O conteúdo atual será preservado — apenas será feita uma reescrita limpa do arquivo.

### Arquivo a reescrever

| Arquivo | Ação |
|---------|------|
| `src/pages/relatorios/logs/index.tsx` | Reescrever (mesmo conteúdo, arquivo limpo) |

