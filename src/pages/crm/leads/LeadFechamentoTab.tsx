
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface LeadFechamentoTabProps {
  fechamento: {
    status: "sucesso" | "perda";
    motivoPerdaId?: string;
    descricao: string;
    data: Date;
  } | null;
  setFechamento: (fechamento: {
    status: "sucesso" | "perda";
    motivoPerdaId?: string;
    descricao: string;
    data: Date;
  } | null) => void;
  motivosPerda: any[];
  leadId?: string;
}

export function LeadFechamentoTab({
  fechamento,
  setFechamento,
  motivosPerda,
  leadId
}: LeadFechamentoTabProps) {
  const [status, setStatus] = useState<"sucesso" | "perda" | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [descricao, setDescricao] = useState("");
  const [motivoPerdaId, setMotivoPerdaId] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  // Inicializar estados com base no fechamento recebido
  useEffect(() => {
    if (fechamento) {
      setStatus(fechamento.status);
      setDate(fechamento.data);
      setDescricao(fechamento.descricao);
      setMotivoPerdaId(fechamento.motivoPerdaId);
    } else {
      setStatus(null);
      setDate(undefined);
      setDescricao("");
      setMotivoPerdaId(undefined);
    }
  }, [fechamento]);

  // Atualizar o objeto de fechamento quando os valores mudarem
  useEffect(() => {
    if (status) {
      console.log("Atualizando objeto de fechamento:", { status, date, descricao });
      setFechamento({
        status,
        motivoPerdaId: status === "perda" ? motivoPerdaId : undefined,
        descricao,
        data: date || new Date(),
      });
    } else if (fechamento) {
      console.log("Limpando objeto de fechamento");
      setFechamento(null);
    }
  }, [status, motivoPerdaId, descricao, date, setFechamento]);

  // Função para salvar diretamente o fechamento
  const salvarFechamento = async () => {
    if (!leadId || !status) {
      toast.error("Não é possível salvar o fechamento", {
        description: "Lead não identificado ou status não selecionado"
      });
      return;
    }

    setIsSaving(true);
    try {
      // Formatar a data para o formato do banco
      const dataFormatada = format(date || new Date(), 'yyyy-MM-dd');

      // Verificar se já existe um fechamento para este lead
      const { data: fechamentoExistente, error: errorCheck } = await supabase
        .from('leads_fechamento')
        .select('id')
        .eq('lead_id', leadId)
        .maybeSingle();

      if (errorCheck) {
        throw errorCheck;
      }

      console.log('Fechamento existente:', fechamentoExistente);

      if (fechamentoExistente) {
        // Atualizar fechamento existente
        const { error } = await supabase
          .from('leads_fechamento')
          .update({
            status: status,
            motivo_perda_id: motivoPerdaId,
            descricao: descricao,
            data: dataFormatada
          })
          .eq('id', fechamentoExistente.id);

        if (error) {
          throw error;
        }

        toast.success("Fechamento atualizado com sucesso!");
      } else {
        // Criar novo fechamento
        const { error } = await supabase
          .from('leads_fechamento')
          .insert([{
            lead_id: leadId,
            status: status,
            motivo_perda_id: motivoPerdaId,
            descricao: descricao,
            data: dataFormatada
          }]);

        if (error) {
          throw error;
        }

        toast.success("Fechamento registrado com sucesso!");
      }
      
    } catch (error) {
      console.error('Erro ao salvar fechamento:', error);
      toast.error("Erro ao salvar fechamento", {
        description: "Verifique o console para mais detalhes."
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Status de Fechamento</Label>
        <RadioGroup
          value={status || ""}
          onValueChange={(value) => setStatus(value as "sucesso" | "perda")}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sucesso" id="sucesso" />
            <Label htmlFor="sucesso" className="cursor-pointer">
              <span className="text-green-600 font-medium">Venda Realizada</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="perda" id="perda" />
            <Label htmlFor="perda" className="cursor-pointer">
              <span className="text-red-600 font-medium">Oportunidade Perdida</span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {status === "perda" && (
        <div className="space-y-2">
          <Label>Motivo da Perda</Label>
          <Select
            value={motivoPerdaId}
            onValueChange={setMotivoPerdaId}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecione o motivo" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {motivosPerda.map((motivo) => (
                <SelectItem key={motivo.id} value={motivo.id}>
                  {motivo.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {status && (
        <>
          <div className="space-y-2">
            <Label>Data do Fechamento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? (
                    format(date, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder={
                status === "sucesso"
                  ? "Adicione informações sobre a venda..."
                  : "Descreva o motivo da perda em detalhes..."
              }
              rows={4}
            />
          </div>
          
          {leadId && (
            <div className="pt-2">
              <Button 
                type="button" 
                variant="blue"
                className="w-full"
                disabled={isSaving}
                onClick={salvarFechamento}
              >
                {isSaving ? "Salvando..." : "Salvar Fechamento"}
              </Button>
            </div>
          )}
        </>
      )}

      {!status && (
        <div className="text-center py-8 text-muted-foreground">
          Selecione um status para registrar o fechamento deste lead.
        </div>
      )}
    </div>
  );
}
