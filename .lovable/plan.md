Vou corrigir a importação para não tratar todos os projetos do lote como falha quando existir repetição.

Plano:
- Ajustar `useProjetosRelogio.ts` para importar projeto por projeto dentro do lote, em vez de abortar o lote inteiro quando um registro viola a regra de duplicidade.
- Manter a regra atual do banco: pode repetir `codigo`, mas não pode repetir a combinação `codigo + nome` na mesma empresa.
- Quando houver duplicidade real de `codigo + nome`, contabilizar apenas aquela linha como falha e continuar importando as demais.
- Melhorar a mensagem da importação para indicar que falhas podem ser por combinação `código + nome` já existente, sem alterar layout ou outras funcionalidades.