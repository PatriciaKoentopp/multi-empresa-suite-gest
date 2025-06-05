
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { DateInput } from "@/components/movimentacao/DateInput";
import { Usuario } from "@/types";

interface NovaInteracaoFormProps {
  novaInteracao: {
    tipo: "email" | "ligacao" | "reuniao" | "mensagem" | "whatsapp" | "telegram" | "instagram" | "facebook" | "outro";
    descricao: string;
    data: Date;
    responsavelId: string;
  };
  handleInteracaoChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleInteracaoSelectChange: (name: string, value: string) => void;
  handleInteracaoDataChange: (date: Date) => void;
  adicionarInteracao: () => void;
  vendedoresAtivos: Usuario[];
  leadTelefone?: string;
}

export function NovaInteracaoForm({
  novaInteracao,
  handleInteracaoChange,
  handleInteracaoSelectChange,
  handleInteracaoDataChange,
  adicionarInteracao,
  vendedoresAtivos,
  leadTelefone
}: NovaInteracaoFormProps) {
  const handleRegistrarInteracao = () => {
    adicionarInteracao();
  };

  return (
    <div className="border-b pb-6">
      <h3 className="text-lg font-medium mb-4">Nova Interação</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="interacaoTipo">Tipo de Interação</Label>
            <select
              id="interacaoTipo"
              value={novaInteracao.tipo}
              onChange={(e) => handleInteracaoSelectChange("tipo", e.target.value)}
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="">Selecione o tipo</option>
              <option value="email">Email</option>
              <option value="ligacao">Ligação</option>
              <option value="reuniao">Reunião</option>
              <option value="mensagem">Mensagem</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="telegram">Telegram</option>
              <option value="instagram">Direct do Instagram</option>
              <option value="facebook">Messenger do Facebook</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="interacaoResponsavel">Responsável</Label>
            <select
              id="interacaoResponsavel"
              value={novaInteracao.responsavelId}
              onChange={(e) => handleInteracaoSelectChange("responsavelId", e.target.value)}
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="">Selecione o responsável</option>
              {vendedoresAtivos.map((vendedor) => (
                <option key={vendedor.id} value={vendedor.id}>
                  {vendedor.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Data da Interação</Label>
          <DateInput
            value={novaInteracao.data}
            onChange={(date) => date && handleInteracaoDataChange(date)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="interacaoDescricao">Descrição</Label>
          <Textarea
            id="interacaoDescricao"
            name="descricao"
            value={novaInteracao.descricao}
            onChange={handleInteracaoChange}
            placeholder="Descreva a interação..."
            rows={4}
            className="resize-none"
          />
        </div>

        <Button
          type="button"
          onClick={handleRegistrarInteracao}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
          disabled={novaInteracao.descricao.trim() === "" || !novaInteracao.responsavelId}
        >
          <Send className="mr-2 h-4 w-4" />
          Registrar Interação
        </Button>
      </div>
    </div>
  );
}
