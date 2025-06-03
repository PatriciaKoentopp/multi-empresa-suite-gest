import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";

interface RelatorioFavorecido {
  id: string;
  nome: string;
  cpf_cnpj: string;
  tipo: string;
  data_cadastro: string;
  data_aniversario: string;
  telefone: string;
  email: string;
  endereco: string;
  observacoes: string;
}

export function FavorecidoCadastroTab() {
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [dataAniversarioInicio, setDataAniversarioInicio] = useState('');
  const [dataAniversarioFim, setDataAniversarioFim] = useState('');
  const { currentCompany } = useCompany();

  const { data: relatorioFavorecidos, isLoading } = useQuery({
    queryKey: ['relatorio-favorecidos', dataInicio, dataFim, dataAniversarioInicio, dataAniversarioFim, currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      let query = supabase
        .from('favorecidos')
        .select('*')
        .eq('empresa_id', currentCompany.id);

      if (dataInicio) {
        query = query.gte('data_cadastro', dataInicio);
      }
      if (dataFim) {
        query = query.lte('data_cadastro', dataFim);
      }
      if (dataAniversarioInicio) {
        query = query.gte('data_aniversario', dataAniversarioInicio);
      }
      if (dataAniversarioFim) {
        query = query.lte('data_aniversario', dataAniversarioFim);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao buscar relatório de favorecidos:", error);
        return [];
      }

      return data as RelatorioFavorecido[];
    },
  });

  const handleDataInicioChange = (date: Date | undefined) => {
    setDataInicio(date ? format(date, 'yyyy-MM-dd') : '');
  };

  const handleDataFimChange = (date: Date | undefined) => {
    setDataFim(date ? format(date, 'yyyy-MM-dd') : '');
  };

  const handleDataAniversarioInicioChange = (date: Date | undefined) => {
    setDataAniversarioInicio(date ? format(date, 'yyyy-MM-dd') : '');
  };

  const handleDataAniversarioFimChange = (date: Date | undefined) => {
    setDataAniversarioFim(date ? format(date, 'yyyy-MM-dd') : '');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatório de Cadastro de Favorecidos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex gap-2">
            <div className="grid gap-2">
              <Label htmlFor="dataInicio">Data de Cadastro (Início)</Label>
              <div className="relative">
                <Input
                  type="date"
                  id="dataInicio"
                  value={dataInicio}
                  onChange={(e) => handleDataInicioChange(e.target.value ? new Date(e.target.value) : undefined)}
                />
                <Calendar className="absolute top-2 right-2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dataFim">Data de Cadastro (Fim)</Label>
              <div className="relative">
                <Input
                  type="date"
                  id="dataFim"
                  value={dataFim}
                  onChange={(e) => handleDataFimChange(e.target.value ? new Date(e.target.value) : undefined)}
                />
                <Calendar className="absolute top-2 right-2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="grid gap-2">
              <Label htmlFor="dataAniversarioInicio">Data de Aniversário (Início)</Label>
              <div className="relative">
                <Input
                  type="date"
                  id="dataAniversarioInicio"
                  value={dataAniversarioInicio}
                  onChange={(e) => handleDataAniversarioInicioChange(e.target.value ? new Date(e.target.value) : undefined)}
                />
                <Calendar className="absolute top-2 right-2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dataAniversarioFim">Data de Aniversário (Fim)</Label>
              <div className="relative">
                <Input
                  type="date"
                  id="dataAniversarioFim"
                  value={dataAniversarioFim}
                  onChange={(e) => handleDataAniversarioFimChange(e.target.value ? new Date(e.target.value) : undefined)}
                />
                <Calendar className="absolute top-2 right-2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
          <Button variant="outline">Gerar Relatório</Button>
        </div>

        <div className="mt-4">
          {isLoading ? (
            <div>Carregando dados...</div>
          ) : (
            <Table>
              <TableCaption>Lista de Favorecidos Cadastrados</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead>Data de Aniversário</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatorioFavorecidos?.map((favorecido) => (
                  <TableRow key={favorecido.id}>
                    <TableCell>{favorecido.nome}</TableCell>
                    <TableCell>{favorecido.cpf_cnpj}</TableCell>
                    <TableCell>{favorecido.tipo}</TableCell>
                    <TableCell>{favorecido.data_cadastro}</TableCell>
                    <TableCell>{favorecido.data_aniversario}</TableCell>
                    <TableCell>{favorecido.telefone}</TableCell>
                    <TableCell>{favorecido.email}</TableCell>
                    <TableCell>{favorecido.endereco}</TableCell>
                    <TableCell>{favorecido.observacoes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
