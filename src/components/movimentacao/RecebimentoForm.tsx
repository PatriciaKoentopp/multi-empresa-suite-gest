
import React from 'react';
import { PagamentoForm } from './PagamentoForm';
import { TipoTitulo } from '@/types/tipos-titulos';

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
  tiposTitulos: TipoTitulo[];
  favorecidos: Array<{ id: string; nome: string }>;
  categorias: Array<{ id: string; nome: string }>;
  formasPagamento: Array<{ id: string; nome: string }>;
  onNovoFavorecido: () => void;
  onNovaCategoria: () => void;
}

export function RecebimentoForm(props: RecebimentoFormProps) {
  // Filtra apenas tipos de título de recebimento
  const tiposTitulosRecebimento = props.tiposTitulos
    .filter(tipo => tipo.tipo === "receber")
    .map(({ id, nome }) => ({ id, nome }));

  return (
    <PagamentoForm
      {...props}
      tiposTitulos={tiposTitulosRecebimento}
    />
  );
}
