
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateInput } from './DateInput';

interface ContaCorrente {
  id: string;
  nome: string;
}

interface TransferenciaFormProps {
  dataLancamento?: Date;
  onDataLancamentoChange: (data?: Date) => void;
  contaOrigem: string;
  onContaOrigemChange: (conta: string) => void;
  contaDestino: string;
  onContaDestinoChange: (conta: string) => void;
  valor: string;
  onValorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  descricao: string;
  onDescricaoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  contasCorrente: ContaCorrente[];
  onSalvar: () => void;
  onCancel: () => void;
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
  onSalvar,
  onCancel
}: TransferenciaFormProps) {
  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => {
      e.preventDefault();
      onSalvar();
    }}>
      <div className="grid grid-cols-3 gap-4 items-end">
        <div className="flex flex-col gap-1 col-span-3">
          <DateInput 
            label="Data de Lançamento" 
            value={dataLancamento} 
            onChange={onDataLancamentoChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Conta Origem</Label>
          <Select value={contaOrigem} onValueChange={onContaOrigemChange}>
            <SelectTrigger className="bg-white z-10">
              <SelectValue placeholder="Selecione a conta origem" />
            </SelectTrigger>
            <SelectContent className="bg-white z-10">
              {contasCorrente
                .filter(c => c.id !== contaDestino)
                .map(conta =>
                  <SelectItem key={conta.id} value={conta.id}>{conta.nome}</SelectItem>
                )}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Conta Destino</Label>
          <Select value={contaDestino} onValueChange={onContaDestinoChange}>
            <SelectTrigger className="bg-white z-10">
              <SelectValue placeholder="Selecione a conta destino" />
            </SelectTrigger>
            <SelectContent className="bg-white z-10">
              {contasCorrente
                .filter(c => c.id !== contaOrigem)
                .map(conta =>
                  <SelectItem key={conta.id} value={conta.id}>{conta.nome}</SelectItem>
                )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Valor</Label>
          <div className="relative flex items-center">
            <Input
              value={valor}
              onChange={onValorChange}
              placeholder="0,00"
              inputMode="decimal"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium pointer-events-none select-none">
              R$
            </span>
          </div>
        </div>
        <div>
          <Label>Descrição</Label>
          <Input value={descricao} onChange={onDescricaoChange} />
        </div>
      </div>

      <div className="flex gap-2 justify-end mt-2">
        <Button type="submit" variant="blue">
          Salvar
        </Button>
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
