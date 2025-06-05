
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LeadFormData } from "./types";

interface MotivoPerda {
  id: string;
  nome: string;
  status: string;
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

interface LeadFechamentoTabProps {
  lead: LeadFormData;
  motivosPerda: MotivoPerda[];
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export function LeadFechamentoTab({ lead, motivosPerda, handleChange }: LeadFechamentoTabProps) {
  const handleSelectChange = (name: string, value: string) => {
    const event = {
      target: { name, value }
    } as React.ChangeEvent<HTMLInputElement>;
    handleChange(event);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="status_fechamento">Status de Fechamento</Label>
        <Select 
          value={lead.status || "ativo"} 
          onValueChange={(value) => handleSelectChange("status", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="fechado">Fechado - Ganho</SelectItem>
            <SelectItem value="perdido">Fechado - Perdido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {lead.status === "perdido" && (
        <div className="space-y-2">
          <Label htmlFor="motivo_perda_id">Motivo da Perda</Label>
          <Select 
            value={lead.motivo_perda_id || ""} 
            onValueChange={(value) => handleSelectChange("motivo_perda_id", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o motivo" />
            </SelectTrigger>
            <SelectContent>
              {motivosPerda.map((motivo) => (
                <SelectItem key={motivo.id} value={motivo.id}>
                  {motivo.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="observacoes_fechamento">Observações de Fechamento</Label>
        <Textarea
          id="observacoes_fechamento"
          name="observacoes"
          value={lead.observacoes || ""}
          onChange={handleChange}
          placeholder="Adicione observações sobre o fechamento..."
          rows={4}
        />
      </div>
    </div>
  );
}
