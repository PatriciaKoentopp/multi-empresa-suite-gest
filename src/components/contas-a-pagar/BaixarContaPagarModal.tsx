import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useContasCorrente } from "@/hooks/useContasCorrente"
import { useAntecipacoes } from "@/hooks/useAntecipacoes"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"

interface BaixarContaPagarModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conta: any
  onConfirm: () => void
}

export function BaixarContaPagarModal({ open, onOpenChange, conta, onConfirm }: BaixarContaPagarModalProps) {
  const [valorPago, setValorPago] = useState<number>(conta?.valor)
  const [dataPagamento, setDataPagamento] = useState<Date>(new Date())
  const [contaCorrenteId, setContaCorrenteId] = useState<string>("")
  const [observacoes, setObservacoes] = useState<string>("")
  const [antecipacoesSelecionadas, setAntecipacoesSelecionadas] = useState<any[]>([])
  const [valorTotalAntecipacoes, setValorTotalAntecipacoes] = useState<number>(0)
  const [usarTodasAntecipacoes, setUsarTodasAntecipacoes] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { toast } = useToast()

  const { contasCorrente } = useContasCorrente()
  const { antecipacoes } = useAntecipacoes()

  useEffect(() => {
    setValorPago(conta?.valor)
  }, [conta])

  useEffect(() => {
    let total = 0
    antecipacoesSelecionadas.forEach(item => {
      total += item.valor
    })
    setValorTotalAntecipacoes(total)
  }, [antecipacoesSelecionadas])

  const handleValorPagoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    if (!isNaN(value)) {
      setValorPago(value)
    }
  }

  const handleDataPagamentoChange = (date: Date | undefined) => {
    if (date) {
      setDataPagamento(date)
    }
  }

  const handleContaCorrenteChange = (value: string) => {
    setContaCorrenteId(value)
  }

  const handleObservacoesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setObservacoes(e.target.value)
  }

  const handleAntecipacaoChange = (antecipacao: any, checked: boolean) => {
    if (checked) {
      adicionarAntecipacao(antecipacao)
    } else {
      removerAntecipacao(antecipacao.id)
    }
  }

  const adicionarAntecipacao = (antecipacao: { id: string; valor: number }) => {
    setAntecipacoesSelecionadas(prev => {
      const existe = prev.find(item => item.id === antecipacao.id);
      if (existe) return prev;
      
      return [...prev, {
        id: antecipacao.id,
        valor: antecipacao.valor,
        valor_utilizado: 0
      }];
    });
  };

  const removerAntecipacao = (id: string) => {
    setAntecipacoesSelecionadas(prev => prev.filter(item => item.id !== id))
  }

  const handleUsarTodasAntecipacoesChange = (checked: boolean) => {
    setUsarTodasAntecipacoes(checked)
    if (checked) {
      setAntecipacoesSelecionadas(antecipacoes)
    } else {
      setAntecipacoesSelecionadas([])
    }
  }

  const handleConfirmarPagamento = () => {
    if (!valorPago || valorPago <= 0) {
      toast({
        title: "Erro",
        description: "O valor pago deve ser maior que zero.",
        variant: "destructive",
      })
      return
    }

    if (!dataPagamento) {
      toast({
        title: "Erro",
        description: "A data de pagamento é obrigatória.",
        variant: "destructive",
      })
      return
    }

    if (!contaCorrenteId) {
      toast({
        title: "Erro",
        description: "A conta corrente é obrigatória.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Sucesso",
        description: "Conta paga com sucesso!",
      })
      onConfirm()
      onOpenChange(false)
    }, 2000)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Baixar Conta a Pagar</SheetTitle>
          <SheetDescription>
            Informe os dados para baixar a conta a pagar.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valorPago">Valor Pago</Label>
              <Input
                id="valorPago"
                type="number"
                placeholder="Valor Pago"
                value={valorPago}
                onChange={handleValorPagoChange}
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Pagamento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataPagamento && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataPagamento ? (
                      format(dataPagamento, "dd 'de' MMMM 'de' yyyy", {
                        locale: ptBR,
                      })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataPagamento}
                    onSelect={handleDataPagamentoChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contaCorrente">Conta Corrente</Label>
              <Select onValueChange={handleContaCorrenteChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a conta corrente" />
                </SelectTrigger>
                <SelectContent>
                  {contasCorrente?.map((conta) => (
                    <SelectItem key={conta.id} value={conta.id}>
                      {conta.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Input
                id="observacoes"
                placeholder="Observações"
                value={observacoes}
                onChange={handleObservacoesChange}
              />
            </div>
          </div>
          <div>
            <Label>
              <Checkbox
                checked={usarTodasAntecipacoes}
                onCheckedChange={handleUsarTodasAntecipacoesChange}
              />
              Usar todas as antecipações
            </Label>
          </div>
          <Separator className="my-2" />
          <div className="grid grid-cols-1 gap-2">
            {antecipacoes?.map((antecipacao) => (
              <div key={antecipacao.id} className="flex items-center space-x-2">
                <Checkbox
                  id={antecipacao.id}
                  checked={antecipacoesSelecionadas.some(item => item.id === antecipacao.id)}
                  onCheckedChange={(checked) => handleAntecipacaoChange(antecipacao, checked as boolean)}
                />
                <div className="text-sm font-medium leading-none">
                  {antecipacao.descricao} - {formatCurrency(antecipacao.valor)}
                </div>
              </div>
            ))}
          </div>
          <Separator className="my-2" />
          <div className="grid grid-cols-1 gap-2">
            <div className="text-sm font-medium leading-none">
              Total de antecipações: {formatCurrency(valorTotalAntecipacoes)}
            </div>
          </div>
        </div>
        <Button
          onClick={handleConfirmarPagamento}
          disabled={isLoading}
        >
          {isLoading ? "Baixando..." : "Confirmar Pagamento"}
        </Button>
      </SheetContent>
    </Sheet>
  )
}
