
import React from 'react';
import { AnaliseVariacao } from '@/types/financeiro';
import { VariationDisplay } from '@/components/vendas/VariationDisplay';
import { formatCurrency } from '@/lib/utils';
import { TableCell, TableRow } from '@/components/ui/table';
import { InfoButton } from './InfoButton';

interface AnaliseVariacaoRowProps {
  analise: AnaliseVariacao;
  periodoInicio?: string;
  periodoFim?: string;
}

export function AnaliseVariacaoRow({ analise, periodoInicio, periodoFim }: AnaliseVariacaoRowProps) {
  return (
    <TableRow 
      className={
        analise.nivel === 'principal' 
          ? 'font-medium' 
          : 'text-sm bg-muted/10 hover:bg-muted/20'
      }
    >
      <TableCell className={analise.nivel === 'subconta' ? 'pl-8' : ''}>
        {analise.nome}
      </TableCell>
      <TableCell className="text-right">
        {formatCurrency(analise.valor_atual)}
      </TableCell>
      <TableCell className="text-right">
        {formatCurrency(analise.valor_comparacao)}
      </TableCell>
      <TableCell className="text-right">
        {formatCurrency(analise.variacao_valor)}
      </TableCell>
      <TableCell className="text-right">
        <VariationDisplay value={analise.variacao_percentual} />
      </TableCell>
      <TableCell className="text-center">
        <InfoButton 
          detalhes={analise.detalhes_mensais} 
          periodoInicio={periodoInicio}
          periodoFim={periodoFim}
        />
      </TableCell>
    </TableRow>
  );
}
