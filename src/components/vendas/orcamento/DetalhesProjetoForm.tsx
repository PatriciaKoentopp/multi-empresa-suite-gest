
import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface DetalhesProjetoFormProps {
  codigoProjeto: string;
  onCodigoProjetoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  observacoes: string;
  onObservacoesChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
}

export function DetalhesProjetoForm({
  codigoProjeto,
  onCodigoProjetoChange,
  observacoes,
  onObservacoesChange,
  disabled = false
}: DetalhesProjetoFormProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="w-full md:w-1/2">
        <label className="block text-sm mb-1">Código do Projeto</label>
        <Input
          type="text"
          value={codigoProjeto}
          onChange={onCodigoProjetoChange}
          disabled={disabled}
        />
      </div>
      <div className="w-full md:w-1/2">
        <label className="block text-sm mb-1">Observações</label>
        <Textarea
          value={observacoes}
          onChange={onObservacoesChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
