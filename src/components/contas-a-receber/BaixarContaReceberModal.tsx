import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Antecipacao, AntecipacaoSelecionada } from '@/types/financeiro';
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from '@/lib/utils';

interface BaixarContaReceberModalProps {
  isOpen: boolean;
  onClose: () => void;
  parcela: any;
  onBaixar: (data: any) => void;
}

const BaixarContaReceberModal = ({ isOpen, onClose, parcela, onBaixar }: BaixarContaReceberModalProps) => {
  const [dataPagamento, setDataPagamento] = useState<Date>(new Date());
  const [valorPago, setValorPago] = useState<number>(parcela?.valor || 0);
  const [observacoes, setObservacoes] = useState<string>('');
  const [antecipacoesDisponiveis, setAntecipacoesDisponiveis] = useState<Antecipacao[]>([]);
  const [antecipacoesUtilizadas, setAntecipacoesUtilizadas] = useState<AntecipacaoSelecionada[]>([]);

  useEffect(() => {
    // Simulação de busca de antecipações disponíveis
    const mockAntecipacoes: Antecipacao[] = [
      {
        id: '1',
        descricao: 'Antecipação 1',
        valor_total: 1000,
        valor_utilizado: 200,
        valor_disponivel: 800,
        data_lancamento: new Date().toISOString(),
        status: 'ativa',
        favorecido: { nome: 'Teste' }
      },
      {
        id: '2',
        descricao: 'Antecipação 2',
        valor_total: 500,
        valor_utilizado: 100,
        valor_disponivel: 400,
        data_lancamento: new Date().toISOString(),
        status: 'ativa',
        favorecido: { nome: 'Teste' }
      },
    ];
    setAntecipacoesDisponiveis(mockAntecipacoes);
  }, []);

  const handleAntecipacaoChange = (antecipacaoId: string, checked: boolean) => {
    if (checked) {
      setAntecipacoesUtilizadas((prev) => [
        ...prev,
        { id: antecipacaoId, valor_utilizado: 0 }
      ]);
    } else {
      setAntecipacoesUtilizadas((prev) => prev.filter((ant) => ant.id !== antecipacaoId));
    }
  };

  const handleSubmit = () => {
    const data = {
      dataPagamento,
      valorPago,
      observacoes,
      antecipacoesUtilizadas,
    };
    onBaixar(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Baixar Conta a Receber</DialogTitle>
          <DialogDescription>
            Informe os dados para baixar a conta a receber.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dataPagamento" className="text-right">
              Data do Pagamento
            </Label>
            <Input
              type="date"
              id="dataPagamento"
              defaultValue={format(dataPagamento, 'yyyy-MM-dd')}
              className="col-span-3"
              onChange={(e) => setDataPagamento(new Date(e.target.value))}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="valorPago" className="text-right">
              Valor Pago
            </Label>
            <Input
              type="number"
              id="valorPago"
              defaultValue={valorPago}
              className="col-span-3"
              onChange={(e) => setValorPago(Number(e.target.value))}
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="observacoes" className="text-right mt-2">
              Observações
            </Label>
            <Textarea
              id="observacoes"
              className="col-span-3"
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium">
              Antecipações Disponíveis
            </h4>
            {antecipacoesDisponiveis.map((antecipacao) => (
              <div key={antecipacao.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`antecipacao-${antecipacao.id}`}
                  onCheckedChange={(checked) => handleAntecipacaoChange(antecipacao.id, !!checked)}
                />
                <Label htmlFor={`antecipacao-${antecipacao.id}`}>
                  {antecipacao.descricao} - {formatCurrency(antecipacao.valor_disponivel)}
                </Label>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" onClick={handleSubmit}>Baixar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BaixarContaReceberModal;
