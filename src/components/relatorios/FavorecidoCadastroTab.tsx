
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, File, Printer } from "lucide-react";
import { DateRange } from "react-day-picker";
import { ExportCSV } from "@/components/relatorios/ExportCSV";
import { useReactToPrint } from 'react-to-print';
import { useRef } from 'react';
import { Favorecido } from "@/types";

const filterSchema = z.object({
  dataInicio: z.date().optional(),
  dataFim: z.date().optional(),
});

type FilterValues = z.infer<typeof filterSchema>;

interface FavorecidoCadastroTabProps {
  favorecido?: Favorecido;
}

export function FavorecidoCadastroTab({ favorecido }: FavorecidoCadastroTabProps) {
  const [data, setData] = useState<Favorecido[]>(favorecido ? [favorecido] : []);
  const form = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      dataInicio: undefined,
      dataFim: undefined,
    },
  });

  const filters = form.watch();
  const componentRef = useRef<HTMLDivElement>(null);

  const handleExport = () => {
    const dataInicio = filters.dataInicio ? 
      (typeof filters.dataInicio === 'string' ? filters.dataInicio : format(filters.dataInicio, "dd/MM/yyyy")) : 
      "";
    const dataFim = filters.dataFim ? 
      (typeof filters.dataFim === 'string' ? filters.dataFim : format(filters.dataFim, "dd/MM/yyyy")) : 
      "";

    const csvData = data.map(item => ({
      ID: item.id,
      Nome: item.nome,
      Tipo: item.tipo,
      Documento: item.documento,
      Email: item.email || '',
      Telefone: item.telefone || '',
      Status: item.status,
      DataAniversario: item.data_aniversario || '',
      DataCriacao: item.created_at,
    }));

    return {
      filename: `favorecidos_${dataInicio}_${dataFim}.csv`,
      data: csvData,
      headers: [
        { label: "ID", key: "ID" },
        { label: "Nome", key: "Nome" },
        { label: "Tipo", key: "Tipo" },
        { label: "Documento", key: "Documento" },
        { label: "Email", key: "Email" },
        { label: "Telefone", key: "Telefone" },
        { label: "Status", key: "Status" },
        { label: "Data de Aniversário", key: "DataAniversario" },
        { label: "Data de Criação", key: "DataCriacao" },
      ]
    };
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'Relatório de Cadastro de Favorecidos',
  });

  const handlePrintReport = () => {
    handlePrint();
  };

  return (
    <div className="w-full">
      <Form {...form}>
        <form className="flex items-center space-x-4">
          <FormField
            control={form.control}
            name="dataInicio"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data Início</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[200px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "dd/MM/yyyy")
                      ) : (
                        <span>Selecione a data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("2020-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dataFim"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data Fim</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[200px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "dd/MM/yyyy")
                      ) : (
                        <span>Selecione a data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("2020-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>

      <div className="md:flex justify-end space-x-2 mt-4">
        <ExportCSV {...handleExport()}>
          <Button variant="blue">
            <File className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </ExportCSV>
        <Button variant="blue" onClick={handlePrintReport}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
      </div>

      <div ref={componentRef} className="p-4">
        <h1 className="text-2xl font-bold mb-4">Relatório de Cadastro de Favorecidos</h1>
        {data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b text-left">ID</th>
                  <th className="py-2 px-4 border-b text-left">Nome</th>
                  <th className="py-2 px-4 border-b text-left">Tipo</th>
                  <th className="py-2 px-4 border-b text-left">Documento</th>
                  <th className="py-2 px-4 border-b text-left">Email</th>
                  <th className="py-2 px-4 border-b text-left">Telefone</th>
                  <th className="py-2 px-4 border-b text-left">Status</th>
                  <th className="py-2 px-4 border-b text-left">Data de Aniversário</th>
                  <th className="py-2 px-4 border-b text-left">Data de Criação</th>
                </tr>
              </thead>
              <tbody>
                {data.map(item => (
                  <tr key={item.id}>
                    <td className="py-2 px-4 border-b">{item.id}</td>
                    <td className="py-2 px-4 border-b">{item.nome}</td>
                    <td className="py-2 px-4 border-b">{item.tipo}</td>
                    <td className="py-2 px-4 border-b">{item.documento}</td>
                    <td className="py-2 px-4 border-b">{item.email || '-'}</td>
                    <td className="py-2 px-4 border-b">{item.telefone || '-'}</td>
                    <td className="py-2 px-4 border-b">{item.status}</td>
                    <td className="py-2 px-4 border-b">{item.data_aniversario ? format(new Date(item.data_aniversario), "dd/MM/yyyy") : '-'}</td>
                    <td className="py-2 px-4 border-b">{format(new Date(item.created_at), "dd/MM/yyyy")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>Nenhum dado disponível para o período selecionado.</p>
        )}
      </div>
    </div>
  );
}
