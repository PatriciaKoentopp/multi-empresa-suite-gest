import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Trash2, Edit } from "lucide-react";
import { MotivoPerda } from "@/types";

export interface FechamentoLead {
  status: "sucesso" | "perda";
  motivoPerdaId?: string;
  descricao: string;
  data: Date;
}

interface LeadFechamentoTabProps {
  fechamento: FechamentoLead | null;
  setFechamento: (f: FechamentoLead | null) => void;
  motivosPerda: MotivoPerda[];
}

export function LeadFechamentoTab({ fechamento, setFechamento, motivosPerda }: LeadFechamentoTabProps) {
  const [edicaoModo, setEdicaoModo] = useState(false);
  const [status, setStatus] = useState<"sucesso" | "perda" | "">(
    fechamento?.status || ""
  );
  const [motivoPerdaId, setMotivoPerdaId] = useState(fechamento?.motivoPerdaId ?? "");
  const [descricao, setDescricao] = useState(fechamento?.descricao ?? "");
  const [data, setData] = useState<Date>(fechamento?.data || new Date());

  // Limpa motivo ao trocar status para sucesso
  const handleStatusChange = (novoStatus: "sucesso" | "perda") => {
    setStatus(novoStatus);
    if (novoStatus !== "perda") setMotivoPerdaId("");
  };

  // Limpa tudo para iniciar novo fechamento
  const handleNovo = () => {
    setEdicaoModo(true);
    setStatus("");
    setMotivoPerdaId("");
    setDescricao("");
    setData(new Date());
  };

  // Salva fechamento
  const handleSalvar = () => {
    if (!status) return;
    setFechamento({
      status,
      motivoPerdaId: status === "perda" ? motivoPerdaId : undefined,
      descricao,
      data,
    });
    setEdicaoModo(false);
  };

  const handleEditar = () => {
    setEdicaoModo(true);
  };

  const handleExcluir = () => {
    setFechamento(null);
    setStatus("");
    setMotivoPerdaId("");
    setDescricao("");
    setData(new Date());
    setEdicaoModo(false);
  };

  // Exibe modo de edição novo fechamento ou alteração
  if (edicaoModo || !fechamento) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <span className="font-semibold">Situação do fechamento:</span>
          <div className="flex items-center gap-4 mt-2">
            <Button
              type="button"
              variant={status === "sucesso" ? "blue" : "outline"}
              className="px-4"
              onClick={() => handleStatusChange("sucesso")}
            >
              Sucesso
            </Button>
            <Button
              type="button"
              variant={status === "perda" ? "destructive" : "outline"}
              className="px-4"
              onClick={() => handleStatusChange("perda")}
            >
              Perda
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Data de Fechamento</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal w-full">
                <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                {data ? format(data, "dd/MM/yyyy") : <span>Selecione uma data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white z-50" align="start">
              <Calendar
                mode="single"
                selected={data}
                onSelect={d => d && setData(d)}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        {status === "perda" && (
          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="motivoPerda">Motivo da Perda</Label>
              <Select
                value={motivoPerdaId}
                onValueChange={setMotivoPerdaId}
              >
                <SelectTrigger id="motivoPerda" className="bg-white">
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {motivosPerda
                    .filter((m) => m.status === "ativo")
                    .map((motivo) => (
                      <SelectItem key={motivo.id} value={motivo.id}>
                        {motivo.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="descricaoFechamento">
            {status === "sucesso" ? "Descrição (opcional)" : "Descrição"}
          </Label>
          <Textarea
            id="descricaoFechamento"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            placeholder={
              status === "sucesso"
                ? "Descreva detalhes do sucesso, se desejar..."
                : "Descreva o motivo da perda, se desejar..."
            }
          />
        </div>
        <div className="flex gap-2">
          <Button variant="blue" type="button" onClick={handleSalvar} disabled={!status}>
            Salvar Fechamento
          </Button>
          {fechamento && (
            <Button variant="outline" type="button" onClick={() => setEdicaoModo(false)}>
              Cancelar
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Exibição do fechamento já gravado
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-semibold">Situação do fechamento:</span>
        <span className={`text-sm px-2 py-1 rounded 
          ${fechamento.status === "sucesso"
            ? "bg-blue-100 text-blue-700"
            : "bg-red-100 text-red-700"}`}>
          {fechamento.status === "sucesso" ? "Sucesso" : "Perda"}
        </span>
        <Button size="icon" variant="ghost" onClick={handleEditar}>
          <Edit className="h-4 w-4 text-blue-500" />
        </Button>
        <Button size="icon" variant="ghost" onClick={handleExcluir}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
      <div className="space-y-2">
        <Label>Data de Fechamento</Label>
        <div>{format(fechamento.data, "dd/MM/yyyy")}</div>
      </div>
      {fechamento.status === "perda" && (
        <div className="space-y-1">
          <Label>Motivo</Label>
          <div>
            {(motivosPerda.find((m) => m.id === fechamento.motivoPerdaId)?.nome) || "--"}
          </div>
        </div>
      )}
      <div className="space-y-1">
        <Label>Descrição</Label>
        <div className="min-h-[48px] border rounded p-2 bg-gray-50">
          {fechamento.descricao || "--"}
        </div>
      </div>
    </div>
  );
}
