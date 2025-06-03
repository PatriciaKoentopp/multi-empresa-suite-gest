
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { ParcelasForm } from './ParcelasForm';

interface RecebimentoFormValues {
  cliente: string;
  valor: string;
  dataVencimento: Date;
  categoria: string;
  conta: string;
  descricao?: string;
}

interface RecebimentoFormProps {
  onSubmit: (data: RecebimentoFormValues) => void;
  isLoading: boolean;
}

export function RecebimentoForm({ onSubmit, isLoading }: RecebimentoFormProps) {
  const [formData, setFormData] = useState<RecebimentoFormValues>({
    cliente: '',
    valor: '',
    dataVencimento: new Date(),
    categoria: '',
    conta: '',
    descricao: '',
  });

  const [parcelas, setParcelas] = useState([{ id: 1, valor: '', data: new Date() }]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cliente || !formData.valor) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (field: keyof RecebimentoFormValues, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cliente">Cliente</Label>
          <Input 
            id="cliente" 
            type="text" 
            placeholder="Nome do cliente" 
            value={formData.cliente}
            onChange={(e) => handleInputChange('cliente', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="valor">Valor</Label>
          <Input 
            id="valor" 
            type="number" 
            placeholder="0.00" 
            value={formData.valor}
            onChange={(e) => handleInputChange('valor', e.target.value)}
          />
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
                !formData.dataVencimento && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.dataVencimento ? (
                format(formData.dataVencimento, "dd/MM/yyyy")
              ) : (
                <span>Selecione uma data</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={formData.dataVencimento}
              onSelect={(date) => handleInputChange('dataVencimento', date!)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="categoria">Categoria</Label>
          <Input 
            id="categoria" 
            type="text" 
            placeholder="Categoria" 
            value={formData.categoria}
            onChange={(e) => handleInputChange('categoria', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="conta">Conta</Label>
          <Input 
            id="conta" 
            type="text" 
            placeholder="Conta" 
            value={formData.conta}
            onChange={(e) => handleInputChange('conta', e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea 
          id="descricao" 
          placeholder="Descrição" 
          value={formData.descricao}
          onChange={(e) => handleInputChange('descricao', e.target.value)}
        />
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
