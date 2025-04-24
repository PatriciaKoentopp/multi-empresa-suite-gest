
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DateInput } from "./DateInput";
import { ParcelasForm } from "./ParcelasForm";

interface Parcela {
  numero: number;
  valor: number;
  dataVencimento: Date;
}

interface RecebimentoFormProps {
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
  tiposTitulos: any[];
  favorecidos: any[];
  categorias: any[];
  formasPagamento: any[];
  onNovoFavorecido: () => void;
  onNovaCategoria: () => void;
  parcelas: Parcela[];
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
  parcelas
}: RecebimentoFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Nº Documento</Label>
          <Input 
            placeholder="Número do documento" 
            className="bg-white" 
            value={numDoc} 
            onChange={onNumDocChange}
          />
        </div>
        <div>
          <Label>Tipo de Título</Label>
          <Select value={tipoTituloId} onValueChange={onTipoTituloChange}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {tiposTitulos.map(tipo => (
                <SelectItem key={tipo.id} value={tipo.id}>{tipo.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Favorecido</Label>
          <div className="flex gap-2">
            <Select value={favorecido} onValueChange={onFavorecidoChange} className="flex-1">
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {favorecidos.map(fav => (
                  <SelectItem key={fav.id} value={fav.id}>{fav.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" type="button" onClick={onNovoFavorecido}>+</Button>
          </div>
        </div>
        
        <div>
          <Label>Categoria</Label>
          <div className="flex gap-2">
            <Select value={categoria} onValueChange={onCategoriaChange} className="flex-1">
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.descricao}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" type="button" onClick={onNovaCategoria}>+</Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Forma de Pagamento</Label>
          <Select value={formaPagamento} onValueChange={onFormaPagamentoChange}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {formasPagamento.map(forma => (
                <SelectItem key={forma.id} value={forma.id}>{forma.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Descrição</Label>
          <Input 
            placeholder="Descrição" 
            className="bg-white" 
            value={descricao} 
            onChange={onDescricaoChange}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label>Valor</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2">R$</span>
            <Input 
              placeholder="0,00" 
              className="bg-white pl-10" 
              value={valor} 
              onChange={onValorChange}
            />
          </div>
        </div>
        
        <div>
          <Label>Número de Parcelas</Label>
          <Input 
            type="number" 
            min={1}
            className="bg-white" 
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
      
      <div className="flex items-center space-x-2">
        <Switch 
          id="dre" 
          checked={considerarDRE}
          onCheckedChange={onConsiderarDREChange}
        />
        <Label htmlFor="dre">Movimentação aparece no DRE?</Label>
      </div>
      
      {/* Exibição das parcelas calculadas */}
      {valor && numParcelas > 0 && dataPrimeiroVenc && (
        <ParcelasForm parcelas={parcelas} />
      )}
    </div>
  );
}
