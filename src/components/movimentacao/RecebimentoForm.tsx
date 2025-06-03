import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ParcelasForm } from './ParcelasForm';

const RecebimentoFormSchema = z.object({
  cliente: z.string().min(3, {
    message: 'O nome do cliente deve ter pelo menos 3 caracteres.',
  }),
  valor: z.string().refine(value => {
    const parsedValue = parseFloat(value);
    return !isNaN(parsedValue) && parsedValue > 0;
  }, {
    message: 'O valor deve ser um número maior que zero.',
  }),
  dataVencimento: z.date(),
  categoria: z.string().min(3, {
    message: 'A categoria deve ter pelo menos 3 caracteres.',
  }),
  conta: z.string().min(3, {
    message: 'A conta deve ter pelo menos 3 caracteres.',
  }),
  descricao: z.string().optional(),
});

type RecebimentoFormValues = z.infer<typeof RecebimentoFormSchema>;

interface RecebimentoFormProps {
  onSubmit: (data: RecebimentoFormValues) => void;
  isLoading: boolean;
}

export function RecebimentoForm({ onSubmit, isLoading }: RecebimentoFormProps) {
  const [parcelas, setParcelas] = useState([{ id: 1, valor: '', data: new Date() }]);

  const form = useForm<RecebimentoFormValues>({
    resolver: zodResolver(RecebimentoFormSchema),
    defaultValues: {
      cliente: '',
      valor: '',
      dataVencimento: new Date(),
      categoria: '',
      conta: '',
      descricao: '',
    },
  });

  const { handleSubmit } = form;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cliente">Cliente</Label>
          <Input id="cliente" type="text" placeholder="Nome do cliente" {...form.register('cliente')} />
          {form.formState.errors.cliente && (
            <p className="text-sm text-red-500">{form.formState.errors.cliente.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="valor">Valor</Label>
          <Input id="valor" type="number" placeholder="0.00" {...form.register('valor')} />
          {form.formState.errors.valor && (
            <p className="text-sm text-red-500">{form.formState.errors.valor.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label>Data de Vencimento</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !form.getValues("dataVencimento") && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {form.getValues("dataVencimento") ? (
                format(form.getValues("dataVencimento"), "dd/MM/yyyy")
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={form.getValues("dataVencimento")}
              onSelect={(date) => {
                form.setValue("dataVencimento", date!)
              }}
              disabled={(date) =>
                date > new Date()
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {form.formState.errors.dataVencimento && (
          <p className="text-sm text-red-500">{form.formState.errors.dataVencimento.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="categoria">Categoria</Label>
          <Input id="categoria" type="text" placeholder="Categoria" {...form.register('categoria')} />
          {form.formState.errors.categoria && (
            <p className="text-sm text-red-500">{form.formState.errors.categoria.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="conta">Conta</Label>
          <Input id="conta" type="text" placeholder="Conta" {...form.register('conta')} />
          {form.formState.errors.conta && (
            <p className="text-sm text-red-500">{form.formState.errors.conta.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea id="descricao" placeholder="Descrição" {...form.register('descricao')} />
        {form.formState.errors.descricao && (
          <p className="text-sm text-red-500">{form.formState.errors.descricao.message}</p>
        )}
      </div>
      
      <ParcelasForm 
        parcelas={parcelas} 
        onValorChange={() => {}}
        onDataChange={() => {}}
      />

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Cadastrando...' : 'Cadastrar Recebimento'}
      </Button>
    </form>
  );
}
