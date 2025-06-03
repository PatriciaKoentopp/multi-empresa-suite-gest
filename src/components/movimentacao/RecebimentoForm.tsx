import React, { useState } from 'react';

interface Parcela {
  numero: number;
  valor: number;
  data_vencimento: string;
}

interface RecebimentoFormProps {
  parcelas: Parcela[];
  onValorTotalChange: (valor: number) => void;
  onPrimeiroVencimentoChange: (data: Date) => void;
}

interface ParcelasFormProps {
  parcelas: any[];
  onValorChange: (valor: number) => void;
  onDataChange: (data: Date) => void;
}

const ParcelasForm: React.FC<ParcelasFormProps> = ({ parcelas, onValorChange, onDataChange }) => {
  return (
    <div className="space-y-4">
      {parcelas.map((parcela, index) => (
        <div key={index} className="border p-4 rounded">
          <p>Parcela {parcela.numero}: R$ {parcela.valor}</p>
          <p>Vencimento: {parcela.data_vencimento}</p>
        </div>
      ))}
    </div>
  );
};

export function RecebimentoForm({
  parcelas,
  onValorTotalChange,
  onPrimeiroVencimentoChange,
}: RecebimentoFormProps) {
  const [valorTotal, setValorTotal] = useState<number>(0);
  const [primeiroVencimento, setPrimeiroVencimento] = useState<Date>(new Date());

  return (
    <div>
      <h2>Formulário de Recebimento</h2>
      <p>Valor Total: R$ {valorTotal}</p>
      <p>Primeiro Vencimento: {primeiroVencimento.toLocaleDateString()}</p>

        <ParcelasForm 
          parcelas={parcelas}
          onValorChange={(valor) => setValorTotal(valor)}
          onDataChange={(data) => setPrimeiroVencimento(data)}
        />
    </div>
  );
}
