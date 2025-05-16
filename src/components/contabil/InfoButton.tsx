
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { DetalhesValoresMensaisModal } from './DetalhesValoresMensaisModal';
import { DetalhesMensaisConta } from '@/types/financeiro';

interface InfoButtonProps {
  detalhes: DetalhesMensaisConta | undefined;
  periodoInicio?: string;
  periodoFim?: string;
}

export function InfoButton({ detalhes, periodoInicio, periodoFim }: InfoButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!detalhes || !detalhes.valores_mensais || detalhes.valores_mensais.length === 0) {
    return null;
  }

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 rounded-full border"
        onClick={() => setIsModalOpen(true)}
      >
        <Info className="h-4 w-4" />
        <span className="sr-only">Detalhes</span>
      </Button>

      <DetalhesValoresMensaisModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        titulo={`Detalhes Mensais: ${detalhes.nome_conta}`}
        valores={detalhes.valores_mensais}
        media={detalhes.media}
        periodoInicio={periodoInicio}
        periodoFim={periodoFim}
      />
    </>
  );
}
