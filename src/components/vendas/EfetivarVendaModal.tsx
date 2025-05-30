
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Orcamento {
  id: string;
  codigo: string;
  favorecido_id: string;
  data: string;
  tipo: string;
  status: string;
  observacoes: string | null;
  empresa_id: string;
  data_venda: string | null;
  numero_nota_fiscal: string | null;
  data_nota_fiscal: string | null;
}

interface EfetivarVendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  orcamento: Orcamento | null;
  onSuccess: () => void;
}

export const EfetivarVendaModal = ({ isOpen, onClose, orcamento, onSuccess }: EfetivarVendaModalProps) => {
  const [dataVenda, setDataVenda] = useState<Date | undefined>(new Date());
  const [dataNotaFiscal, setDataNotaFiscal] = useState<Date | undefined>();
  const [numeroNotaFiscal, setNumeroNotaFiscal] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setDataVenda(new Date());
    setDataNotaFiscal(undefined);
    setNumeroNotaFiscal("");
    setObservacoes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orcamento || !dataVenda || !numeroNotaFiscal.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha todos os campos obrigatórios"
      });
      return;
    }

    try {
      setIsLoading(true);

      // Atualizar o orçamento para venda
      const { error: updateError } = await supabase
        .from('orcamentos')
        .update({
          tipo: 'venda',
          data_venda: format(dataVenda, 'yyyy-MM-dd'),
          numero_nota_fiscal: numeroNotaFiscal,
          data_nota_fiscal: dataNotaFiscal ? format(dataNotaFiscal, 'yyyy-MM-dd') : null,
          observacoes: observacoes || null
        })
        .eq('id', orcamento.id);

      if (updateError) throw updateError;

      toast({
        title: "Sucesso",
        description: "Venda efetivada com sucesso!"
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Erro ao efetivar venda:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível efetivar a venda"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Efetivar Venda</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para confirmar a venda.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="dataVenda">Data da Venda</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !dataVenda && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataVenda ? format(dataVenda, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione a data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataVenda}
                  onSelect={setDataVenda}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="numeroNotaFiscal">Número da Nota Fiscal</Label>
            <Input
              id="numeroNotaFiscal"
              value={numeroNotaFiscal}
              onChange={(e) => setNumeroNotaFiscal(e.target.value)}
              placeholder="Digite o número da nota fiscal"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dataNotaFiscal">Data da Nota Fiscal (opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !dataNotaFiscal && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataNotaFiscal ? format(dataNotaFiscal, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione a data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataNotaFiscal}
                  onSelect={setDataNotaFiscal}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              placeholder="Observações sobre a venda"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Efetivando..." : "Efetivar Venda"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
