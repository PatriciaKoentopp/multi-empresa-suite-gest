
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useFavorecidos } from "@/hooks/useFavorecidos";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  codigo: z.string().min(1, "Código é obrigatório"),
  favorecido_id: z.string().min(1, "Favorecido é obrigatório"),
  tipo: z.enum(["servico", "aluguel"]),
  descricao: z.string().optional(),
  valor_mensal: z.number().min(0, "Valor deve ser maior que 0"),
  data_inicio: z.date({ required_error: "Data de início é obrigatória" }),
  data_fim: z.date({ required_error: "Data de fim é obrigatória" }),
  dia_vencimento: z.number().min(1).max(31),
  periodicidade: z.enum(["mensal", "trimestral", "semestral", "anual"]),
  forma_pagamento: z.string().min(1, "Forma de pagamento é obrigatória"),
  observacoes: z.string().optional(),
  gerar_automatico: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface ContratosFormProps {
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  initialData?: Partial<FormValues>;
  isLoading?: boolean;
}

export function ContratosForm({ onSubmit, onCancel, initialData, isLoading = false }: ContratosFormProps) {
  const { data: favorecidos = [] } = useFavorecidos();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      codigo: "",
      favorecido_id: "",
      tipo: "servico",
      descricao: "",
      valor_mensal: 0,
      dia_vencimento: 5,
      periodicidade: "mensal",
      forma_pagamento: "boleto",
      observacoes: "",
      gerar_automatico: true,
      ...initialData,
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="codigo">Código do Contrato *</Label>
          <Input
            id="codigo"
            {...form.register("codigo")}
            placeholder="Ex: CONT-2025-001"
          />
          {form.formState.errors.codigo && (
            <p className="text-sm text-red-500">{form.formState.errors.codigo.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="favorecido_id">Favorecido *</Label>
          <Select 
            value={form.watch("favorecido_id")} 
            onValueChange={(value) => form.setValue("favorecido_id", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um favorecido" />
            </SelectTrigger>
            <SelectContent>
              {favorecidos.map((favorecido) => (
                <SelectItem key={favorecido.id} value={favorecido.id}>
                  {favorecido.nome} - {favorecido.documento}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.favorecido_id && (
            <p className="text-sm text-red-500">{form.formState.errors.favorecido_id.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo de Contrato *</Label>
          <Select 
            value={form.watch("tipo")} 
            onValueChange={(value) => form.setValue("tipo", value as "servico" | "aluguel")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="servico">Serviço</SelectItem>
              <SelectItem value="aluguel">Aluguel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="valor_mensal">Valor Mensal *</Label>
          <Input
            id="valor_mensal"
            type="number"
            step="0.01"
            {...form.register("valor_mensal", { valueAsNumber: true })}
            placeholder="0,00"
          />
          {form.formState.errors.valor_mensal && (
            <p className="text-sm text-red-500">{form.formState.errors.valor_mensal.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Data de Início *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !form.watch("data_inicio") && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {form.watch("data_inicio") ? (
                  format(form.watch("data_inicio"), "dd/MM/yyyy", { locale: ptBR })
                ) : (
                  "Selecione uma data"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={form.watch("data_inicio")}
                onSelect={(date) => form.setValue("data_inicio", date as Date)}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Data de Fim *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !form.watch("data_fim") && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {form.watch("data_fim") ? (
                  format(form.watch("data_fim"), "dd/MM/yyyy", { locale: ptBR })
                ) : (
                  "Selecione uma data"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={form.watch("data_fim")}
                onSelect={(date) => form.setValue("data_fim", date as Date)}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dia_vencimento">Dia do Vencimento *</Label>
          <Input
            id="dia_vencimento"
            type="number"
            min="1"
            max="31"
            {...form.register("dia_vencimento", { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="periodicidade">Periodicidade *</Label>
          <Select 
            value={form.watch("periodicidade")} 
            onValueChange={(value) => form.setValue("periodicidade", value as "mensal" | "trimestral" | "semestral" | "anual")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mensal">Mensal</SelectItem>
              <SelectItem value="trimestral">Trimestral</SelectItem>
              <SelectItem value="semestral">Semestral</SelectItem>
              <SelectItem value="anual">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="forma_pagamento">Forma de Pagamento *</Label>
          <Select 
            value={form.watch("forma_pagamento")} 
            onValueChange={(value) => form.setValue("forma_pagamento", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="boleto">Boleto</SelectItem>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="transferencia">Transferência</SelectItem>
              <SelectItem value="dinheiro">Dinheiro</SelectItem>
              <SelectItem value="cartao">Cartão</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          {...form.register("descricao")}
          placeholder="Descrição detalhada do contrato"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          {...form.register("observacoes")}
          placeholder="Observações adicionais"
          rows={2}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="gerar_automatico"
          checked={form.watch("gerar_automatico")}
          onCheckedChange={(checked) => form.setValue("gerar_automatico", checked)}
        />
        <Label htmlFor="gerar_automatico">Gerar parcelas automaticamente</Label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
          {isLoading ? "Salvando..." : "Salvar"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
