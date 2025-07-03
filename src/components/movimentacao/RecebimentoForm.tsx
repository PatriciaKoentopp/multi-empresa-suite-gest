import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ContaCorrenteItem } from '@/types/financeiro';
import { Parcela } from '@/types/orcamento';
import { ParcelaForm } from '../parcela/ParcelaForm';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { PlusCircle } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const formSchema = z.object({
  data: z.date(),
  valorTotal: z.string(),
  contaCorrente: z.string(),
  observacoes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface RecebimentoFormProps {
  onSubmit: (data: FormValues) => void;
}

export const RecebimentoForm = ({ onSubmit }: RecebimentoFormProps) => {
  const [parcelas, setParcelas] = useState<Parcela[]>([
    {
      valor: 0,
      dataVencimento: new Date().toISOString().split('T')[0],
      numeroParcela: '1',
    },
  ]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      data: new Date(),
      valorTotal: '0',
      contaCorrente: '',
      observacoes: '',
    },
  });

  const contasCorrente: ContaCorrenteItem[] = [
    {
      id: '1',
      nome: 'Conta Corrente 1',
      banco: 'Banco do Brasil',
      agencia: '1234-5',
      numero: '12345-6',
    },
    {
      id: '2',
      nome: 'Conta Corrente 2',
      banco: 'Caixa Econômica Federal',
      agencia: '4321-5',
      numero: '65432-1',
    },
  ];

  const { toast } = useToast();

  const onSubmitForm = (data: FormValues) => {
    console.log(data);
    toast({
      title: 'Sucesso!',
      description: 'Recebimento cadastrado com sucesso.',
    });
    onSubmit(data);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="data">Data</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={
                  'w-full justify-start text-left font-normal' +
                  (errors.data ? ' border-red-500' : '')
                }
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(new Date(), 'dd/MM/yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                locale={ptBR}
                onSelect={(date) => {
                  setValue('data', date || new Date());
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.data && (
            <p className="text-red-500 text-sm">{errors.data.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="valorTotal">Valor Total</Label>
          <Input
            id="valorTotal"
            type="number"
            {...register('valorTotal')}
            className={errors.valorTotal ? 'border-red-500' : ''}
          />
          {errors.valorTotal && (
            <p className="text-red-500 text-sm">{errors.valorTotal.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="contaCorrente">Conta Corrente</Label>
        <Select>
          <SelectTrigger className={errors.contaCorrente ? 'border-red-500' : ''}>
            <SelectValue placeholder="Selecione a conta corrente" />
          </SelectTrigger>
          <SelectContent>
            {contasCorrente.map((conta) => (
              <SelectItem key={conta.id} value={conta.id}>
                {conta.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.contaCorrente && (
          <p className="text-red-500 text-sm">{errors.contaCorrente.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          {...register('observacoes')}
          className={errors.observacoes ? 'border-red-500' : ''}
        />
        {errors.observacoes && (
          <p className="text-red-500 text-sm">{errors.observacoes.message}</p>
        )}
      </div>
      
      <ParcelasForm 
        parcelas={parcelas} 
        onValorChange={() => {}}
        onDataChange={() => {}}
      />

      <Button onClick={handleSubmit(onSubmitForm)}>Salvar</Button>
    </div>
  );
};
