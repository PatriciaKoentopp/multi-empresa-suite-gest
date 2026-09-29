# Corrigir a aba Fechamento de leads já fechados

## Problema
Quando você abre um lead já fechado e entra na aba Fechamento, aparece "This page didn't load".

## Causa
A aba guarda uma cópia própria dos dados de fechamento (situação, motivo, data e observações) e fica sincronizando essa cópia com a janela do lead nos dois sentidos, de forma automática:
- Quando a aba abre, a cópia ainda está vazia. Por isso, a aba entende que a situação foi desmarcada e apaga o fechamento que veio do banco.
- Ao ver o fechamento apagado, a janela zera a aba. Logo em seguida, a aba volta a preencher a situação a partir dos dados antigos, e o ciclo recomeça.

Esse vai e volta não termina, e a página trava. Nos leads abertos o problema não acontece, porque eles não têm fechamento.

Conferi o banco: os 5 fechamentos gravados estão completos, com data e sem duplicidade. O problema está só na tela.

## Correção
Na aba Fechamento, a janela do lead passa a ser avisada só quando você altera algo de verdade: marcar Sucesso ou Perda, escolher o motivo, mudar a data ou editar as observações. Ela não recebe mais avisos automáticos a cada atualização da tela.

Quando o lead é carregado, a aba só lê os dados salvos e não devolve nada à janela. Com isso, o ciclo acaba.

A aparência da aba e a forma de gravar o fechamento não mudam.

## Detalhes técnicos
- `src/pages/crm/leads/LeadFechamentoTab.tsx`:
  - remover o `useEffect` que chama `setFechamento` observando `status/motivoPerdaId/descricao/date`;
  - criar a função `atualizarPai(parcial)`, que monta o objeto com os valores atuais e chama `setFechamento`. Ela é chamada nos handlers de status, motivo, data e descrição. Ao desmarcar a situação, envia `null`;
  - manter o `useEffect` de inicialização que lê `fechamento`. Adicionar a proteção `isNaN(data.getTime())`, que usa a data atual quando a data salva é inválida.
- Não há mudanças no banco nem em outros arquivos.
