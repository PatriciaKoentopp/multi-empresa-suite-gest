import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateInput } from "./DateInput";
import { Trash2, Plus } from "lucide-react";

export interface ImpostoRetidoSelecionado {
  imposto_retido_id: string;
  nome: string;
  valor: string;
  data_vencimento?: Date;
}

interface ImpostoRetidoDisponivel {
  id: string;
  nome: string;
  tipo_titulo_id: string;
  conta_despesa_id?: string;
  favorecido_id?: string;
}

interface ImpostosRetidosMovFormProps {
  impostosDisponiveis: ImpostoRetidoDisponivel[];
  impostosRetidosSelecionados: ImpostoRetidoSelecionado[];
  onAdicionarImposto: (impostoId: string) => void;
  onRemoverImposto: (index: number) => void;
  onValorChange: (index: number, valor: string) => void;
  onDataVencimentoChange: (index: number, data?: Date) => void;
  readOnly?: boolean;
}

export function ImpostosRetidosMovForm({
  impostosDisponiveis,
  impostosRetidosSelecionados,
  onAdicionarImposto,
  onRemoverImposto,
  onValorChange,
  onDataVencimentoChange,
  readOnly = false
}: ImpostosRetidosMovFormProps) {
  const [impostoSelecionadoId, setImpostoSelecionadoId] = useState("");

  // Filtrar impostos que já foram adicionados
  const impostosNaoAdicionados = impostosDisponiveis.filter(
    imp => !impostosRetidosSelecionados.some(sel => sel.imposto_retido_id === imp.id)
  );

  const handleAdicionar = () => {
    if (!impostoSelecionadoId) return;
    onAdicionarImposto(impostoSelecionadoId);
    setImpostoSelecionadoId("");
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Impostos Retidos</h3>

      {!readOnly && impostosNaoAdicionados.length > 0 && (
        <div className="flex gap-2 items-end">
          <div className="flex-grow flex flex-col gap-2">
            <Label>Imposto</Label>
            <Select value={impostoSelecionadoId} onValueChange={setImpostoSelecionadoId}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione um imposto" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {impostosNaoAdicionados.map(imp => (
                  <SelectItem key={imp.id} value={imp.id}>
                    {imp.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="blue"
            onClick={handleAdicionar}
            disabled={!impostoSelecionadoId}
            className="flex items-center gap-1"
          >
            <Plus size={16} />
            Adicionar
          </Button>
        </div>
      )}

      {impostosRetidosSelecionados.length > 0 && (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imposto</TableHead>
                <TableHead className="w-[180px]">Valor (R$)</TableHead>
                <TableHead className="w-[180px]">Data Vencimento</TableHead>
                {!readOnly && <TableHead className="w-[60px]">Ação</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {impostosRetidosSelecionados.map((imp, index) => (
                <TableRow key={index}>
                  <TableCell>{imp.nome}</TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      value={imp.valor}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9,.]/g, '');
                        onValorChange(index, value);
                      }}
                      className="bg-white"
                      disabled={readOnly}
                    />
                  </TableCell>
                  <TableCell>
                    <DateInput
                      value={imp.data_vencimento}
                      onChange={(date) => onDataVencimentoChange(index, date)}
                      disabled={readOnly}
                    />
                  </TableCell>
                  {!readOnly && (
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoverImposto(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {impostosRetidosSelecionados.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum imposto retido adicionado.</p>
      )}
    </div>
  );
}
