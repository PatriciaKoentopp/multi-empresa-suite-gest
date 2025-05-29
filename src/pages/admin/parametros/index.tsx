
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings, Grid, List, DollarSign, Calculator, ShoppingBag, Users, BarChart } from "lucide-react";
import { useModulosParametros } from "@/hooks/useModulosParametros";
import { navigationConfig } from "@/config/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const getIconForModule = (title: string) => {
  switch (title) {
    case "Dashboard": return <Grid className="h-5 w-5" />;
    case "Administrativo": return <Settings className="h-5 w-5" />;
    case "Cadastros": return <List className="h-5 w-5" />;
    case "Financeiro": return <DollarSign className="h-5 w-5" />;
    case "Contábil": return <Calculator className="h-5 w-5" />;
    case "Vendas": return <ShoppingBag className="h-5 w-5" />;
    case "CRM": return <Users className="h-5 w-5" />;
    case "Relatórios": return <BarChart className="h-5 w-5" />;
    default: return <Settings className="h-5 w-5" />;
  }
};

export default function Parametros() {
  const { parametros, isLoading, updateParametro, isModuloAtivo, refetch } = useModulosParametros();

  const handleModuloChange = async (moduloKey: string, ativo: boolean) => {
    console.log('Alterando módulo:', moduloKey, 'para:', ativo);
    await updateParametro(moduloKey, ativo);
  };

  const handleSubItemChange = async (subItemKey: string, ativo: boolean) => {
    console.log('Alterando subitem:', subItemKey, 'para:', ativo);
    await updateParametro(subItemKey, ativo);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parâmetros do Sistema</h1>
          <p className="text-muted-foreground">
            Configure quais módulos e rotinas devem aparecer no menu do sistema
          </p>
        </div>
        
        <div className="grid gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parâmetros do Sistema</h1>
          <p className="text-muted-foreground">
            Configure quais módulos e rotinas devem aparecer no menu do sistema
          </p>
        </div>
        <Button onClick={refetch} variant="outline">
          Recarregar
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Total de parâmetros carregados: {parametros.length}
        </div>
      </div>
      
      <div className="grid gap-6">
        {navigationConfig.map((modulo, index) => {
          const moduloKey = modulo.href ? modulo.href.replace('/', '') : modulo.title.toLowerCase().replace(/\s+/g, '-');
          const moduloAtivo = isModuloAtivo(moduloKey);
          
          return (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getIconForModule(modulo.title)}
                    <div>
                      <CardTitle className="text-lg">{modulo.title}</CardTitle>
                      <CardDescription>
                        Chave: {moduloKey} | {modulo.subItems ? `${modulo.subItems.length} rotinas disponíveis` : 'Módulo principal'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`modulo-${moduloKey}`}
                      checked={moduloAtivo}
                      onCheckedChange={(checked) => handleModuloChange(moduloKey, checked)}
                    />
                    <Label htmlFor={`modulo-${moduloKey}`} className="text-sm font-medium">
                      {moduloAtivo ? 'Ativo' : 'Inativo'}
                    </Label>
                  </div>
                </div>
              </CardHeader>
              
              {modulo.subItems && modulo.subItems.length > 0 && (
                <CardContent>
                  <Separator className="mb-4" />
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Rotinas do Módulo</h4>
                    <div className="grid gap-3">
                      {modulo.subItems.map((subItem, subIndex) => {
                        const subItemKey = subItem.href.replace('/', '');
                        const subItemAtivo = isModuloAtivo(subItemKey);
                        
                        return (
                          <div key={subIndex} className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                            <div>
                              <Label htmlFor={`subitem-${subItemKey}`} className="text-sm font-medium cursor-pointer">
                                {subItem.title}
                              </Label>
                              <p className="text-xs text-muted-foreground mt-1">
                                Chave: {subItemKey} | Rota: {subItem.href}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`subitem-${subItemKey}`}
                                checked={subItemAtivo && moduloAtivo}
                                disabled={!moduloAtivo}
                                onCheckedChange={(checked) => handleSubItemChange(subItemKey, checked)}
                              />
                              <Label htmlFor={`subitem-${subItemKey}`} className="text-xs">
                                {subItemAtivo && moduloAtivo ? 'Ativo' : 'Inativo'}
                              </Label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
