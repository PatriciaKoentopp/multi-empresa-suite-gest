
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
}

export function NovaInteracaoForm({
  novaInteracao,
  handleInteracaoChange,
  handleInteracaoSelectChange,
  handleInteracaoDataChange,
  adicionarInteracao,
  vendedoresAtivos
}: NovaInteracaoFormProps) {
  return (
    <div className="border-b pb-6">
      <h3 className="text-lg font-medium mb-4">Nova Interação</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="interacaoTipo">Tipo de Interação</Label>
            <Select
              value={novaInteracao.tipo}
              onValueChange={(value) => handleInteracaoSelectChange("tipo", value)}
            >
              <SelectTrigger id="interacaoTipo" className="bg-white">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="ligacao">Ligação</SelectItem>
                <SelectItem value="reuniao">Reunião</SelectItem>
                <SelectItem value="mensagem">Mensagem</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="telegram">Telegram</SelectItem>
                <SelectItem value="instagram">Direct do Instagram</SelectItem>
                <SelectItem value="facebook">Messenger do Facebook</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="interacaoResponsavel">Responsável</Label>
            <Select
              value={novaInteracao.responsavelId}
              onValueChange={(value) => handleInteracaoSelectChange("responsavelId", value)}
            >
              <SelectTrigger id="interacaoResponsavel" className="bg-white">
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {vendedoresAtivos.map((vendedor) => (
                  <SelectItem key={vendedor.id} value={vendedor.id}>
                    {vendedor.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Campo data interação */}
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
          onClick={adicionarInteracao}
          variant="blue"
          className="w-full sm:w-auto"
          disabled={novaInteracao.descricao.trim() === "" || !novaInteracao.responsavelId}
        >
          <Send className="mr-2 h-4 w-4" />
          Registrar Interação
        </Button>
      </div>
    </div>
  );
}
