
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
}

export function LeadFechamentoTab({
  fechamento,
  setFechamento,
  motivosPerda
}: LeadFechamentoTabProps) {
  const [status, setStatus] = useState<"sucesso" | "perda" | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [descricao, setDescricao] = useState("");
  const [motivoPerdaId, setMotivoPerdaId] = useState<string | undefined>(undefined);

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
      setFechamento({
        status,
        motivoPerdaId: status === "perda" ? motivoPerdaId : undefined,
        descricao,
        data: date || new Date(),
      });
    } else if (fechamento) {
      setFechamento(null);
    }
  }, [status, motivoPerdaId, descricao, date]);

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
