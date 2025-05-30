
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DateInput } from "./DateInput";
import { ParcelasForm } from './ParcelasForm';

// Mesma interface do PagamentoForm, com parâmetro readOnly adicionado
interface RecebimentoFormProps {
  numDoc: string;
  onNumDocChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  tipoTituloId: string;
  onTipoTituloChange: (id: string) => void;
  favorecido: string;
  onFavorecidoChange: (id: string) => void;
  categoria: string;
  onCategoriaChange: (id: string) => void;
  formaPagamento: string;
  onFormaPagamentoChange: (id: string) => void;
  descricao: string;
  onDescricaoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  valor: string;
  onValorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  numParcelas: number;
  onNumParcelasChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  dataPrimeiroVenc?: Date;
  onDataPrimeiroVencChange: (date?: Date) => void;
  considerarDRE: boolean;
  onConsiderarDREChange: (checked: boolean) => void;
  tiposTitulos: any[];
  favorecidos: any[];
  categorias: any[];
  formasPagamento: any[];
  onNovoFavorecido: () => void;
  onNovaCategoria: () => void;
  parcelas: any[];
  readOnly?: boolean;
}

export function RecebimentoForm({
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
  onNovaCategoria,
  parcelas,
  readOnly = false
}: RecebimentoFormProps) {
  // Implementação similar ao PagamentoForm, mas com campos adaptados para recebimentos
  
  const handleValorChange = (index: number, valor: number) => {
    // Função vazia para compatibilidade
  };

  const handleDataChange = (index: number, data: Date) => {
    // Função vazia para compatibilidade
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Número do Documento</Label>
          <Input 
            value={numDoc} 
            onChange={onNumDocChange}
            className="bg-white"
            disabled={readOnly}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Tipo de Título</Label>
          <Select 
            value={tipoTituloId} 
            onValueChange={onTipoTituloChange}
            disabled={readOnly}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {tiposTitulos.map(tipo => (
                <SelectItem key={tipo.id} value={tipo.id}>
                  {tipo.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <Label>Favorecido</Label>
            {!readOnly && (
              <button
                type="button"
                onClick={onNovoFavorecido}
                className="text-blue-500 text-sm"
              >
                + Novo
              </button>
            )}
          </div>
          <Select 
            value={favorecido} 
            onValueChange={onFavorecidoChange}
            disabled={readOnly}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {favorecidos.map(fav => (
                <SelectItem key={fav.id} value={fav.id}>
                  {fav.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <Label>Categoria</Label>
            {!readOnly && (
              <button
                type="button"
                onClick={onNovaCategoria}
                className="text-blue-500 text-sm"
              >
                + Nova
              </button>
            )}
          </div>
          <Select 
            value={categoria} 
            onValueChange={onCategoriaChange}
            disabled={readOnly}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {categorias.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.descricao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Forma Pagamento</Label>
          <Select 
            value={formaPagamento} 
            onValueChange={onFormaPagamentoChange}
            disabled={readOnly}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {formasPagamento.map(forma => (
                <SelectItem key={forma.id} value={forma.id}>
                  {forma.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col col-span-2 gap-2">
          <Label>Descrição</Label>
          <Input 
            value={descricao} 
            onChange={onDescricaoChange} 
            className="bg-white"
            disabled={readOnly}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Valor Total (R$)</Label>
          <Input 
            type="text" 
            value={valor} 
            onChange={onValorChange} 
            className="bg-white"
            disabled={readOnly}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Número de Parcelas</Label>
          <Input 
            type="number" 
            min={1} 
            value={numParcelas} 
            onChange={onNumParcelasChange} 
            className="bg-white"
            disabled={readOnly}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Data Primeiro Vencimento</Label>
          <DateInput 
            value={dataPrimeiroVenc} 
            onChange={onDataPrimeiroVencChange}
            disabled={readOnly}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch 
          id="consider-dre" 
          checked={considerarDRE} 
          onCheckedChange={onConsiderarDREChange}
          disabled={readOnly}
        />
        <Label htmlFor="consider-dre">Considerar para DRE</Label>
      </div>

      {/* Tabela de parcelas */}
      {parcelas.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Parcelas</h3>
          <ParcelasForm 
            parcelas={parcelas} 
            readOnly={readOnly}
            onValorChange={handleValorChange}
            onDataChange={handleDataChange}
          />
        </div>
      )}
    </div>
  );
}
