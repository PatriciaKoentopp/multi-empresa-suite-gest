import { useState } from "react";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FiltroFluxoCaixa {
  dataInicio: Date;
  dataFim: Date;
  conta_corrente_id: string;
  situacao: string;
}

interface FluxoCaixaFilterProps {
  onFilter: (filtros: FiltroFluxoCaixa) => void;
  contas: any[];
}

export function FluxoCaixaFilter({ onFilter, contas }: FluxoCaixaFilterProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [dataInicio, setDataInicio] = useState<Date>(new Date());
  const [dataFim, setDataFim] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);
  const [contaId, setContaId] = useState("");
  const [situacao, setSituacao] = useState("todas");

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
    if (newDate?.from) {
      setDataInicio(newDate.from);
    }
    if (newDate?.to) {
      setDataFim(newDate.to);
    }
  };

  const handleFilter = () => {
    onFilter({
      dataInicio,
      dataFim,
      conta_corrente_id: contaId,
      situacao
    });
  };

  const handleReset = () => {
    setDate({
      from: new Date(),
      to: new Date(),
    });
    setDataInicio(new Date());
    setDataFim(new Date());
    setContaId("");
    setSituacao("todas");
    
    onFilter({
      dataInicio: new Date(),
      dataFim: new Date(),
      conta_corrente_id: "",
      situacao: "todas"
    });
  };

  return (
    <div className="border rounded-md p-4 space-y-4">
      <h2 className="text-lg font-semibold">Filtros</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Seletor de Data */}
        <div>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date?.from && "text-muted-foreground"
                )}
              >
                {date?.from ? (
                  date.to ? (
                    `${date.from?.toLocaleDateString()} - ${date.to?.toLocaleDateString()}`
                  ) : (
                    date.from?.toLocaleDateString()
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={handleDateChange}
                numberOfMonths={2}
                pagedNavigation
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Seletor de Conta Corrente */}
        <div>
          <Select value={contaId} onValueChange={setContaId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione a Conta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              {contas.map((conta) => (
                <SelectItem key={conta.id} value={conta.id}>
                  {conta.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Seletor de Situação */}
        <div>
          <Select value={situacao} onValueChange={setSituacao}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione a Situação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="pendentes">Pendentes</SelectItem>
              <SelectItem value="pagas">Pagas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={handleReset}>
          Limpar
        </Button>
        <Button type="button" onClick={handleFilter}>
          Filtrar
        </Button>
      </div>
    </div>
  );
}
