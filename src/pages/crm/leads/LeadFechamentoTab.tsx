
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { DateInput } from "@/components/movimentacao/DateInput";
import { format } from "date-fns";

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
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [descricao, setDescricao] = useState("");
  const [motivoPerdaId, setMotivoPerdaId] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  // Inicializar estados com base no fechamento recebido
  useEffect(() => {
    if (fechamento) {
      console.log("Inicializando com fechamento:", fechamento);
      setStatus(fechamento.status);
      setDate(fechamento.data);
      setDescricao(fechamento.descricao);
      setMotivoPerdaId(fechamento.motivoPerdaId);
    } else {
      console.log("Sem dados de fechamento, resetando estados");
      setStatus(null);
      setDate(new Date());
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
  }, [status, motivoPerdaId, descricao, date, setFechamento, fechamento]);

  // Função para lidar com mudanças na data
  const handleDateChange = (newDate?: Date | null) => {
    if (newDate) {
      setDate(newDate);
    }
  };

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
      console.log("Iniciando salvamento do fechamento:", { 
        leadId, 
        status, 
        motivoPerdaId, 
        descricao, 
        data: date || new Date() 
      });
      
      // Formatar a data para o formato do banco
      const dataFormatada = format(date || new Date(), 'yyyy-MM-dd');

      // Verificar se já existe um fechamento para este lead
      const { data: fechamentoExistente, error: errorCheck } = await supabase
        .from('leads_fechamento')
        .select('id')
        .eq('lead_id', leadId)
        .maybeSingle();

      if (errorCheck) {
        console.error("Erro ao verificar fechamento existente:", errorCheck);
        throw errorCheck;
      }

      console.log('Fechamento existente:', fechamentoExistente);

      let resultado;
      
      if (fechamentoExistente) {
        // Atualizar fechamento existente
        resultado = await supabase
          .from('leads_fechamento')
          .update({
            status: status,
            motivo_perda_id: motivoPerdaId,
            descricao: descricao,
            data: dataFormatada
          })
          .eq('id', fechamentoExistente.id);

        if (resultado.error) {
          console.error("Erro ao atualizar fechamento:", resultado.error);
          throw resultado.error;
        }
        
        console.log("Fechamento atualizado com sucesso:", resultado.data);
        toast.success("Fechamento atualizado com sucesso!");
      } else {
        // Criar novo fechamento
        resultado = await supabase
          .from('leads_fechamento')
          .insert([{
            lead_id: leadId,
            status: status,
            motivo_perda_id: motivoPerdaId,
            descricao: descricao,
            data: dataFormatada
          }]);

        if (resultado.error) {
          console.error("Erro ao inserir fechamento:", resultado.error);
          throw resultado.error;
        }
        
        console.log("Fechamento registrado com sucesso:", resultado.data);
        toast.success("Fechamento registrado com sucesso!");
      }
      
      // Atualizar o status do lead
      const { error: leadUpdateError } = await supabase
        .from('leads')
        .update({ status: 'fechado' })
        .eq('id', leadId);
      
      if (leadUpdateError) {
        console.error("Erro ao atualizar status do lead:", leadUpdateError);
      } else {
        console.log("Status do lead atualizado para 'fechado'");
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
    <div className="space-y-4">
      <div className="space-y-2 pt-0">
        <Label className="text-base font-medium">Status de Fechamento</Label>
        <RadioGroup
          value={status || ""}
          onValueChange={(value) => setStatus(value as "sucesso" | "perda")}
          className="flex flex-wrap gap-6 mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sucesso" id="sucesso" className="border-2" />
            <Label htmlFor="sucesso" className="cursor-pointer text-base">
              <span className="text-green-600 font-medium">Venda Realizada</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="perda" id="perda" className="border-2" />
            <Label htmlFor="perda" className="cursor-pointer text-base">
              <span className="text-red-600 font-medium">Oportunidade Perdida</span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {status === "perda" && (
        <div className="space-y-2 mt-6">
          <Label className="text-base font-medium">Motivo da Perda</Label>
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
          <div className="space-y-2 mt-6">
            <Label className="text-base font-medium">Data do Fechamento</Label>
            <DateInput
              value={date}
              onChange={handleDateChange}
            />
          </div>

          <div className="space-y-2 mt-6">
            <Label className="text-base font-medium">Observações</Label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder={
                status === "sucesso"
                  ? "Adicione informações sobre a venda..."
                  : "Descreva o motivo da perda em detalhes..."
              }
              rows={4}
              className="resize-none"
            />
          </div>
          
          {leadId && (
            <div className="pt-4">
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
