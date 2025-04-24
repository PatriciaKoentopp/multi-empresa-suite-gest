
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DateInput } from './DateInput';
import { ParcelasForm } from './ParcelasForm';
import { useParcelasCalculation } from '@/hooks/useParcelasCalculation';
import { Plus } from "lucide-react";

interface PagamentoFormProps {
  numDoc: string;
  onNumDocChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  tipoTituloId: string;
  onTipoTituloChange: (value: string) => void;
  favorecido: string;
  onFavorecidoChange: (value: string) => void;
  categoria: string;
  onCategoriaChange: (value: string) => void;
  formaPagamento: string;
  onFormaPagamentoChange: (value: string) => void;
  descricao: string;
  onDescricaoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  valor: string;
  onValorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  numParcelas: number;
  onNumParcelasChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  dataPrimeiroVenc?: Date;
  onDataPrimeiroVencChange: (date?: Date) => void;
  considerarDRE: boolean;
  onConsiderarDREChange: (value: boolean) => void;
  tiposTitulos: Array<{ id: string; nome: string }>;
  favorecidos: Array<{ id: string; nome: string }>;
  categorias: Array<{ id: string; nome: string }>;
  formasPagamento: Array<{ id: string; nome: string }>;
  onNovoFavorecido: () => void;
  onNovaCategoria: () => void;
}

export function PagamentoForm({
  numDoc,
  onNumDocChange,
  tipoTituloId,
  onTipoTituloChange,
  favorecido,
  onFavorecidoChange,
  categoria,
  onCategoriaChange,
  formaPagamento,
  onFormaPagamentoChange,
  descricao,
  onDescricaoChange,
  valor,
  onValorChange,
  numParcelas,
  onNumParcelasChange,
  dataPrimeiroVenc,
  onDataPrimeiroVencChange,
  considerarDRE,
  onConsiderarDREChange,
  tiposTitulos,
  favorecidos,
  categorias,
  formasPagamento,
  onNovoFavorecido,
  onNovaCategoria
}: PagamentoFormProps) {
  const parcelas = useParcelasCalculation(
    parseFloat(valor.replace(',', '.')) || 0,
    numParcelas,
    dataPrimeiroVenc
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Tipo do Título</Label>
          <Select value={tipoTituloId} onValueChange={onTipoTituloChange}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecione o tipo do título" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {tiposTitulos.map(tipo => (
                <SelectItem key={tipo.id} value={tipo.id}>{tipo.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Favorecido</Label>
          <div className="flex gap-2">
            <Select value={favorecido} onValueChange={onFavorecidoChange}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {favorecidos.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onNovoFavorecido}
              className="border-[#0EA5E9] text-[#0EA5E9] hover:bg-[#0EA5E9]/10"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Número do Documento</Label>
          <Input value={numDoc} onChange={onNumDocChange} />
        </div>
        <div>
          <Label>Categoria Financeira</Label>
          <div className="flex gap-2">
            <Select value={categoria} onValueChange={onCategoriaChange}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {categorias.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onNovaCategoria}
              className="border-[#0EA5E9] text-[#0EA5E9] hover:bg-[#0EA5E9]/10"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Forma de Pagamento</Label>
          <Select value={formaPagamento} onValueChange={onFormaPagamentoChange}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {formasPagamento.map(f => (
                <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Descrição</Label>
        <Input value={descricao} onChange={onDescricaoChange} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Valor</Label>
          <div className="relative">
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
          <Label>Número de Parcelas</Label>
          <Input 
            type="number" 
            min={1} 
            max={36} 
            value={numParcelas} 
            onChange={onNumParcelasChange}
          />
        </div>
        <div>
          <DateInput 
            label="Primeiro Vencimento" 
            value={dataPrimeiroVenc} 
            onChange={onDataPrimeiroVencChange}
          />
        </div>
      </div>

      <ParcelasForm parcelas={parcelas} />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={considerarDRE}
          onChange={(e) => onConsiderarDREChange(e.target.checked)}
          className="rounded border-gray-300"
          id="dre"
        />
        <Label htmlFor="dre">Movimentação aparece no DRE?</Label>
      </div>
    </div>
  );
}
