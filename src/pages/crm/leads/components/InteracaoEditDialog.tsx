
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadInteracao } from "../types";
import { Usuario } from "@/types";
import { DateInput } from "@/components/movimentacao/DateInput";

interface InteracaoEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interacao: LeadInteracao | null;
  onInteracaoChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onInteracaoSelectChange: (name: string, value: string) => void;
  onInteracaoDateChange?: (date: Date) => void;
  onSave: () => void;
  vendedoresAtivos: Usuario[];
}

export function InteracaoEditDialog({
  open,
  onOpenChange,
  interacao,
  onInteracaoChange,
  onInteracaoSelectChange,
  onInteracaoDateChange,
  onSave,
  vendedoresAtivos
}: InteracaoEditDialogProps) {
  if (!interacao) return null;

  // Converter a data da string para objeto Date se necessário
  const handleDateChange = (date?: Date | null) => {
    if (date && onInteracaoDateChange) {
      onInteracaoDateChange(date);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Interação</DialogTitle>
          <DialogDescription>
            Atualize os detalhes da interação com o lead.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editTipo">Tipo de Interação</Label>
              <Select
                value={interacao.tipo}
                onValueChange={(value) => onInteracaoSelectChange("tipo", value)}
              >
                <SelectTrigger id="editTipo" className="bg-white">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="bg-white">
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
              <Label htmlFor="editResponsavel">Responsável</Label>
              <Select
                value={interacao.responsavelId}
                onValueChange={(value) => onInteracaoSelectChange("responsavelId", value)}
              >
                <SelectTrigger id="editResponsavel" className="bg-white">
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {vendedoresAtivos.map((vendedor) => (
                    <SelectItem key={vendedor.id} value={vendedor.id}>
                      {vendedor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editData">Data</Label>
              <DateInput
                value={typeof interacao.data === 'string' ? new Date(interacao.data) : interacao.data}
                onChange={handleDateChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editStatus">Status</Label>
              <Select
                value={interacao.status || "Aberto"}
                onValueChange={(value) => onInteracaoSelectChange("status", value)}
              >
                <SelectTrigger id="editStatus" className="bg-white">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="Aberto">Aberto</SelectItem>
                  <SelectItem value="Realizado">Realizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="editDescricao">Descrição</Label>
            <Textarea
              id="editDescricao"
              name="descricao"
              value={interacao.descricao}
              onChange={onInteracaoChange}
              placeholder="Descreva a interação..."
              rows={4}
              className="resize-none bg-white"
            />
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          <Button 
            type="button"
            onClick={onSave}
          >
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
