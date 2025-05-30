
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { Favorecido, PlanoContas, TipoTitulo } from "@/types";
import { ParcelasForm } from "./ParcelasForm";
import { DateInput } from "./DateInput";

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
  onDescricaoChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  valor: number;
  onValorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  numParcelas: number;
  onNumParcelasChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  dataPrimeiroVenc: Date | undefined;
  onDataPrimeiroVencChange: (date: Date | undefined) => void;
  considerarDRE: boolean;
  onConsiderarDREChange: (checked: boolean) => void;
  tiposTitulos: TipoTitulo[];
  favorecidos: Favorecido[];
  categorias: PlanoContas[];
  formasPagamento: { id: string; nome: string; }[];
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
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <Label>Nº Documento</Label>
          <Input
            value={numDoc}
            onChange={onNumDocChange}
            placeholder="Número do documento"
            className="bg-white"
            disabled={readOnly}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label>Tipo de Título</Label>
          <Select value={tipoTituloId} onValueChange={onTipoTituloChange} disabled={readOnly}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {tiposTitulos.map((tipo) => (
                <SelectItem key={tipo.id} value={tipo.id}>
                  {tipo.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label>Favorecido</Label>
          <div className="flex gap-2">
            <Select value={favorecido} onValueChange={onFavorecidoChange} disabled={readOnly}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione o favorecido" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {favorecidos.map((fav) => (
                  <SelectItem key={fav.id} value={fav.id}>
                    {fav.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!readOnly && (
              <Button type="button" variant="outline" size="sm" onClick={onNovoFavorecido}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label>Categoria Financeira</Label>
          <div className="flex gap-2">
            <Select value={categoria} onValueChange={onCategoriaChange} disabled={readOnly}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!readOnly && (
              <Button type="button" variant="outline" size="sm" onClick={onNovaCategoria}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Label>Forma de Pagamento</Label>
          <Select value={formaPagamento} onValueChange={onFormaPagamentoChange} disabled={readOnly}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecione a forma" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {formasPagamento.map((forma) => (
                <SelectItem key={forma.id} value={forma.id}>
                  {forma.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label>Descrição</Label>
        <textarea
          value={descricao}
          onChange={onDescricaoChange}
          placeholder="Descrição da movimentação"
          className="min-h-[100px] flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={readOnly}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <Label>Valor Total</Label>
          <Input
            type="number"
            step="0.01"
            value={valor}
            onChange={onValorChange}
            placeholder="0,00"
            className="bg-white"
            disabled={readOnly}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label>Número de Parcelas</Label>
          <select
            value={numParcelas}
            onChange={onNumParcelasChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={readOnly}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>

        <div>
          <DateInput
            label="Data do 1º Vencimento"
            value={dataPrimeiroVenc}
            onChange={onDataPrimeiroVencChange}
            disabled={readOnly}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="considerar-dre"
          checked={considerarDRE}
          onCheckedChange={onConsiderarDREChange}
          disabled={readOnly}
        />
        <Label htmlFor="considerar-dre">Considerar no DRE</Label>
      </div>

      {parcelas && parcelas.length > 0 && (
        <ParcelasForm 
          parcelas={parcelas}
          onValorChange={() => {}}
          onDataChange={() => {}}
        />
      )}
    </div>
  );
}
