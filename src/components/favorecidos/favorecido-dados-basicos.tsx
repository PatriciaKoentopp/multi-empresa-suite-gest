import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GrupoFavorecido, Profissao } from "@/types";
import { FormValues } from "./favorecidos-form.schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useState } from "react";
import { GrupoFavorecidosForm } from "@/components/grupo-favorecidos/grupo-favorecidos-form";
import { ProfissoesForm } from "@/components/profissoes/profissoes-form";
import { toast } from "sonner";

interface FavorecidoDadosBasicosProps {
  form: UseFormReturn<FormValues>;
  grupos: GrupoFavorecido[];
  profissoes: Profissao[];
  readOnly?: boolean;
}

export function FavorecidoDadosBasicos({ 
  form, 
  grupos, 
  profissoes,
  readOnly 
}: FavorecidoDadosBasicosProps) {
  const [isGrupoModalOpen, setIsGrupoModalOpen] = useState(false);
  const [isProfissaoModalOpen, setIsProfissaoModalOpen] = useState(false);

  const handleGrupoSubmit = (data: { nome: string; status: "ativo" | "inativo" }) => {
    const newGrupo: GrupoFavorecido = {
      id: `temp-${Date.now()}`,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Em um ambiente real, isso seria uma chamada à API
    grupos.push(newGrupo);
    toast.success("Grupo criado com sucesso!");
    setIsGrupoModalOpen(false);
  };

  const handleProfissaoSubmit = (data: { nome: string; status: "ativo" | "inativo" }) => {
    const newProfissao: Profissao = {
      id: `temp-${Date.now()}`,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Em um ambiente real, isso seria uma chamada à API
    profissoes.push(newProfissao);
    toast.success("Profissão criada com sucesso!");
    setIsProfissaoModalOpen(false);
  };

  return (
    <div className="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-medium mb-4">Dados Básicos</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="grupoId"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Grupo</FormLabel>
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={readOnly}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                        <SelectValue placeholder="Selecione um grupo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white dark:bg-gray-800">
                      {grupos.map((grupo) => (
                        <SelectItem 
                          key={grupo.id} 
                          value={grupo.id}
                          className="hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {grupo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {!readOnly && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsGrupoModalOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="profissaoId"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Profissão</FormLabel>
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={readOnly}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                        <SelectValue placeholder="Selecione uma profissão" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white dark:bg-gray-800">
                      {profissoes.map((profissao) => (
                        <SelectItem 
                          key={profissao.id} 
                          value={profissao.id}
                          className="hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {profissao.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {!readOnly && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsProfissaoModalOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="nome"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome/Razão Social</FormLabel>
            <FormControl>
              <Input {...field} disabled={readOnly} className="bg-white dark:bg-gray-900" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="nomeFantasia"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome Fantasia</FormLabel>
            <FormControl>
              <Input {...field} disabled={readOnly} className="bg-white dark:bg-gray-900" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} disabled={readOnly} className="bg-white dark:bg-gray-900" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="telefone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input {...field} disabled={readOnly} className="bg-white dark:bg-gray-900" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Modal de Cadastro de Grupo */}
      <Dialog open={isGrupoModalOpen} onOpenChange={setIsGrupoModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Grupo de Favorecidos</DialogTitle>
          </DialogHeader>
          <GrupoFavorecidosForm
            onSubmit={handleGrupoSubmit}
            onCancel={() => setIsGrupoModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Cadastro de Profissão */}
      <Dialog open={isProfissaoModalOpen} onOpenChange={setIsProfissaoModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Profissão</DialogTitle>
          </DialogHeader>
          <ProfissoesForm
            onSubmit={handleProfissaoSubmit}
            onCancel={() => setIsProfissaoModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
