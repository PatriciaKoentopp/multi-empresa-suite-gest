
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateInput } from "./DateInput";

interface TransferenciaFormProps {
  dataLancamento?: Date;
  onDataLancamentoChange: (date?: Date) => void;
  contaOrigem: string;
  onContaOrigemChange: (id: string) => void;
  contaDestino: string;
  onContaDestinoChange: (id: string) => void;
  valor: string;
  onValorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  descricao: string;
  onDescricaoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  contasCorrente: any[];
  readOnly?: boolean;
}

export function TransferenciaForm({
  dataLancamento,
  onDataLancamentoChange,
  contaOrigem,
  onContaOrigemChange,
  contaDestino,
  onContaDestinoChange,
  valor,
  onValorChange,
  descricao,
  onDescricaoChange,
  contasCorrente,
  readOnly = false
}: TransferenciaFormProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
        <div className="flex flex-col gap-2">
          <Label>Data da Transferência</Label>
          <DateInput 
            value={dataLancamento} 
            onChange={onDataLancamentoChange}
            disabled={readOnly}
          />
        </div>
        <div /> {/* Espaço para alinhamento */}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
        <div className="flex flex-col gap-2">
          <Label>Conta Origem</Label>
          <Select 
            value={contaOrigem} 
            onValueChange={onContaOrigemChange}
            disabled={readOnly}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {contasCorrente.map(conta => (
                <SelectItem key={conta.id} value={conta.id}>
                  {conta.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Conta Destino</Label>
          <Select 
            value={contaDestino} 
            onValueChange={onContaDestinoChange}
            disabled={readOnly}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {contasCorrente.map(conta => (
                <SelectItem key={conta.id} value={conta.id}>
                  {conta.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
        <div className="flex flex-col gap-2">
          <Label>Valor (R$)</Label>
          <Input 
            type="text" 
            value={valor} 
            onChange={onValorChange} 
            className="bg-white"
            disabled={readOnly}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Descrição</Label>
          <Input 
            value={descricao} 
            onChange={onDescricaoChange} 
            className="bg-white"
            disabled={readOnly}
          />
        </div>
      </div>
    </div>
  );
}
