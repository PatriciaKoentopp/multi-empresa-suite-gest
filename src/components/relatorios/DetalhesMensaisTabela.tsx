
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DetalhesMensaisConta } from '@/types/financeiro';

interface DetalhesMensaisTabelaProps {
  dados: DetalhesMensaisConta;
}

export function DetalhesMensaisTabela({ dados }: DetalhesMensaisTabelaProps) {
  // Função para formatação de valores monetários
  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <div className="border rounded-md">
      <h3 className="text-lg font-medium p-4 border-b">
        Detalhes Mensais: {dados.nome_conta}
      </h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mês/Ano</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dados.valores_mensais.map((valorMensal) => (
              <TableRow key={`${valorMensal.ano}-${valorMensal.mes}`}>
                <TableCell>
                  {valorMensal.mes_nome}
                </TableCell>
                <TableCell className="text-right">
                  {formatarMoeda(valorMensal.valor)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/50 font-medium">
              <TableCell>Média</TableCell>
              <TableCell className="text-right">{formatarMoeda(dados.media)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
