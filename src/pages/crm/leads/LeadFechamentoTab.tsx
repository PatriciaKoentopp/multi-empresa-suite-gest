
import React from "react";
import { Label } from "@/components/ui/label";
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
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export function LeadFechamentoTab({ lead, motivosPerda, handleChange }: LeadFechamentoTabProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="status_fechamento">Status de Fechamento</Label>
        <select
          id="status_fechamento"
          name="status"
          value={lead.status || "ativo"}
          onChange={handleChange}
          className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white"
        >
          <option value="ativo">Ativo</option>
          <option value="fechado">Fechado - Ganho</option>
          <option value="perdido">Fechado - Perdido</option>
        </select>
      </div>

      {lead.status === "perdido" && (
        <div className="space-y-2">
          <Label htmlFor="motivo_perda_id">Motivo da Perda</Label>
          <select
            id="motivo_perda_id"
            name="motivo_perda_id"
            value={lead.motivo_perda_id || ""}
            onChange={handleChange}
            className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white"
          >
            <option value="">Selecione o motivo</option>
            {motivosPerda.map((motivo) => (
              <option key={motivo.id} value={motivo.id}>
                {motivo.nome}
              </option>
            ))}
          </select>
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
