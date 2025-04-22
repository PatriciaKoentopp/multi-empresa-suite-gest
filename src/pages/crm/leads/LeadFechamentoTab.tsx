
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MotivoPerda } from "@/types";

interface LeadFechamentoTabProps {
  fechamentoStatus: "sucesso" | "perda" | null;
  setFechamentoStatus: (status: "sucesso" | "perda" | null) => void;
  motivoPerdaSelecionado: string;
  setMotivoPerdaSelecionado: (id: string) => void;
  descricaoPerda: string;
  setDescricaoPerda: (valor: string) => void;
  motivosPerda: MotivoPerda[];
}

export function LeadFechamentoTab({
  fechamentoStatus,
  setFechamentoStatus,
  motivoPerdaSelecionado,
  setMotivoPerdaSelecionado,
  descricaoPerda,
  setDescricaoPerda,
  motivosPerda,
}: LeadFechamentoTabProps) {
  // Limpa motivo e descrição ao trocar status para sucesso
  useEffect(() => {
    if (fechamentoStatus !== "perda") {
      setMotivoPerdaSelecionado("");
      setDescricaoPerda("");
    }
  }, [fechamentoStatus, setMotivoPerdaSelecionado, setDescricaoPerda]);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <span className="font-semibold">Situação do fechamento:</span>
        <div className="flex items-center gap-4 mt-2">
          <Button
            type="button"
            variant={fechamentoStatus === "sucesso" ? "blue" : "outline"}
            className="px-4"
            onClick={() => setFechamentoStatus("sucesso")}
          >
            Sucesso
          </Button>
          <Button
            type="button"
            variant={fechamentoStatus === "perda" ? "destructive" : "outline"}
            className="px-4"
            onClick={() => setFechamentoStatus("perda")}
          >
            Perda
          </Button>
        </div>
      </div>
      {fechamentoStatus === "perda" && (
        <div className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="motivoPerda">Motivo da Perda</Label>
            <Select
              value={motivoPerdaSelecionado}
              onValueChange={setMotivoPerdaSelecionado}
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
          <div className="space-y-2">
            <Label htmlFor="descricaoPerda">Descrição</Label>
            <Textarea
              id="descricaoPerda"
              value={descricaoPerda}
              onChange={(e) => setDescricaoPerda(e.target.value)}
              rows={3}
              placeholder="Descreva o motivo da perda, se desejar..."
            />
          </div>
        </div>
      )}
      {fechamentoStatus === "sucesso" && (
        <div className="bg-green-50 border border-green-200 rounded p-3 text-green-900 text-sm">
          Parabéns! Este lead foi fechado com sucesso.
        </div>
      )}
    </div>
  );
}
