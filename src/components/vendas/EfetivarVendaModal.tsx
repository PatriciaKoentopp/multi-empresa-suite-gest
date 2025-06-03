import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { useCompany } from "@/contexts/company-context";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

interface Orcamento {
  id: string;
  favorecido_id: string;
  // ... outras propriedades do orçamento
}

interface EfetivarVendaModalProps {
  orcamento?: Orcamento | null;
  open: boolean;
  onClose: () => void;
  onEfetivar: (vendaData: {
    data_venda: string;
    numero_nota_fiscal: string;
    data_nota_fiscal: string | null;
    nota_fiscal_pdf: string | null;
  }) => Promise<void>;
}

export function EfetivarVendaModal({ orcamento, open, onClose, onEfetivar }: EfetivarVendaModalProps) {
  const { currentCompany } = useCompany();
  const [dataVenda, setDataVenda] = useState<Date | null>(new Date());
  const [numeroNotaFiscal, setNumeroNotaFiscal] = useState<string>("");
  const [dataNotaFiscal, setDataNotaFiscal] = useState<Date | null>(new Date());
  const [notaFiscalPdf, setNotaFiscalPdf] = useState<string | null>(null);

  const { data: favorecidos = [] } = useQuery({
    queryKey: ["favorecidos", currentCompany?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorecidos")
        .select("*")
        .eq("empresa_id", currentCompany?.id);

      if (error) {
        console.error("Erro ao buscar favorecidos:", error);
        return [];
      }

      return data;
    },
    enabled: !!currentCompany?.id,
  });

  useEffect(() => {
    if (open) {
      setDataVenda(new Date());
      setNumeroNotaFiscal("");
      setDataNotaFiscal(new Date());
      setNotaFiscalPdf(null);
    }
  }, [orcamento, open]);

  const favorecidoData = favorecidos?.find(f => f.id === orcamento?.favorecido_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dataVenda || !numeroNotaFiscal) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const vendaData = {
      data_venda: format(dataVenda, "yyyy-MM-dd"),
      numero_nota_fiscal: numeroNotaFiscal,
      data_nota_fiscal: dataNotaFiscal ? format(dataNotaFiscal, "yyyy-MM-dd") : null,
      nota_fiscal_pdf: notaFiscalPdf
    };

    await onEfetivar(vendaData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Efetivar Venda</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          <div>
            <label className="block text-sm font-medium mb-1">Data da Venda *</label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                className="w-full"
                value={dataVenda ? format(dataVenda, "yyyy-MM-dd") : ""}
                onChange={e => setDataVenda(e.target.value ? new Date(e.target.value + "T00:00:00") : null)}
              />
              <Calendar className="text-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Número da Nota Fiscal *</label>
            <Input
              type="text"
              value={numeroNotaFiscal}
              onChange={e => setNumeroNotaFiscal(e.target.value)}
              placeholder="Digite o número da nota fiscal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Data da Nota Fiscal</label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                className="w-full"
                value={dataNotaFiscal ? format(dataNotaFiscal, "yyyy-MM-dd") : ""}
                onChange={e => setDataNotaFiscal(e.target.value ? new Date(e.target.value + "T00:00:00") : null)}
              />
              <Calendar className="text-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nota Fiscal (PDF)</label>
            <Input
              type="text"
              value={notaFiscalPdf || ""}
              onChange={e => setNotaFiscalPdf(e.target.value)}
              placeholder="Link para o PDF da nota fiscal"
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" variant="blue">
              Efetivar Venda
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
