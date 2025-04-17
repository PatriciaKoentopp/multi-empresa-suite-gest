
import React from "react";
import { 
  Save, 
  Plus, 
  Trash2, 
  Pencil, 
  Eye, 
  ArrowLeft, 
  Search, 
  Download, 
  Upload, 
  Settings, 
  Check, 
  X, 
  FileText,
  Filter,
  RefreshCcw,
  SlidersHorizontal
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableHead, 
  TableHeader, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

export default function StyleGuidePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Guia de Estilos</h1>
        <p className="text-muted-foreground">
          Este guia mostra os padrões de componentes, cores e ícones do sistema.
        </p>
      </div>

      <Tabs defaultValue="buttons">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="buttons">Botões</TabsTrigger>
          <TabsTrigger value="status">Status e Badges</TabsTrigger>
          <TabsTrigger value="icons">Ícones</TabsTrigger>
          <TabsTrigger value="colors">Cores</TabsTrigger>
        </TabsList>

        {/* Seção de Botões */}
        <TabsContent value="buttons" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Variantes de Botões</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-2 items-center">
                  <Button variant="default">Padrão</Button>
                  <span className="text-xs text-muted-foreground">Default</span>
                </div>
                <div className="flex flex-col gap-2 items-center">
                  <Button variant="destructive">Excluir</Button>
                  <span className="text-xs text-muted-foreground">Destructive</span>
                </div>
                <div className="flex flex-col gap-2 items-center">
                  <Button variant="outline">Contorno</Button>
                  <span className="text-xs text-muted-foreground">Outline</span>
                </div>
                <div className="flex flex-col gap-2 items-center">
                  <Button variant="secondary">Secundário</Button>
                  <span className="text-xs text-muted-foreground">Secondary</span>
                </div>
                <div className="flex flex-col gap-2 items-center">
                  <Button variant="ghost">Fantasma</Button>
                  <span className="text-xs text-muted-foreground">Ghost</span>
                </div>
                <div className="flex flex-col gap-2 items-center">
                  <Button variant="link">Link</Button>
                  <span className="text-xs text-muted-foreground">Link</span>
                </div>
                <div className="flex flex-col gap-2 items-center">
                  <Button variant="blue">Azul</Button>
                  <span className="text-xs text-muted-foreground">Blue</span>
                </div>
                <div className="flex flex-col gap-2 items-center">
                  <Button variant="success">Sucesso</Button>
                  <span className="text-xs text-muted-foreground">Success</span>
                </div>
                <div className="flex flex-col gap-2 items-center">
                  <Button variant="warning">Alerta</Button>
                  <span className="text-xs text-muted-foreground">Warning</span>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-4">Botões de Ação Padrão</h3>
                <div className="flex flex-wrap gap-4">
                  <Button><Plus className="mr-1" /> Novo</Button>
                  <Button variant="blue"><Save className="mr-1" /> Salvar</Button>
                  <Button variant="outline"><ArrowLeft className="mr-1" /> Voltar</Button>
                  <Button variant="destructive"><Trash2 className="mr-1" /> Excluir</Button>
                  <Button variant="outline"><RefreshCcw className="mr-1" /> Atualizar</Button>
                  <Button variant="secondary"><Filter className="mr-1" /> Filtrar</Button>
                  <Button variant="secondary"><SlidersHorizontal className="mr-1" /> Configurar</Button>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-4">Botões de Ação em Tabelas</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-100 hover:text-blue-700">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-100 hover:text-blue-700">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-100 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Seção de Status */}
        <TabsContent value="status" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Badges e Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-2 items-center">
                  <Badge>Padrão</Badge>
                  <span className="text-xs text-muted-foreground">Default</span>
                </div>
                <div className="flex flex-col gap-2 items-center">
                  <Badge variant="secondary">Secundário</Badge>
                  <span className="text-xs text-muted-foreground">Secondary</span>
                </div>
                <div className="flex flex-col gap-2 items-center">
                  <Badge variant="destructive">Destrutivo</Badge>
                  <span className="text-xs text-muted-foreground">Destructive</span>
                </div>
                <div className="flex flex-col gap-2 items-center">
                  <Badge variant="outline">Contorno</Badge>
                  <span className="text-xs text-muted-foreground">Outline</span>
                </div>
              </div>

              <Separator />
              
              <div>
                <h3 className="font-medium mb-4">Status em Tabelas</h3>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-4 items-center">
                    <span
                      className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
                      bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                    >
                      Ativo
                    </span>
                    <span className="text-sm text-muted-foreground">Status Ativo</span>
                  </div>
                  
                  <div className="flex gap-4 items-center">
                    <span
                      className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
                      bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                    >
                      Inativo
                    </span>
                    <span className="text-sm text-muted-foreground">Status Inativo</span>
                  </div>
                  
                  <div className="flex gap-4 items-center">
                    <span
                      className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
                      bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20"
                    >
                      Pendente
                    </span>
                    <span className="text-sm text-muted-foreground">Status Pendente</span>
                  </div>
                  
                  <div className="flex gap-4 items-center">
                    <span
                      className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
                      bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20"
                    >
                      Em análise
                    </span>
                    <span className="text-sm text-muted-foreground">Status Em Análise</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Seção de Ícones */}
        <TabsContent value="icons" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Ícones Mais Utilizados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-full bg-muted">
                    <Plus className="h-6 w-6" />
                  </div>
                  <span className="text-sm">Plus</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-full bg-muted">
                    <Save className="h-6 w-6" />
                  </div>
                  <span className="text-sm">Save</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-full bg-muted">
                    <Trash2 className="h-6 w-6" />
                  </div>
                  <span className="text-sm">Trash</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-full bg-muted">
                    <Pencil className="h-6 w-6" />
                  </div>
                  <span className="text-sm">Pencil</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-full bg-muted">
                    <Eye className="h-6 w-6" />
                  </div>
                  <span className="text-sm">Eye</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-full bg-muted">
                    <Search className="h-6 w-6" />
                  </div>
                  <span className="text-sm">Search</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-full bg-muted">
                    <Download className="h-6 w-6" />
                  </div>
                  <span className="text-sm">Download</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-full bg-muted">
                    <Upload className="h-6 w-6" />
                  </div>
                  <span className="text-sm">Upload</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-full bg-muted">
                    <Settings className="h-6 w-6" />
                  </div>
                  <span className="text-sm">Settings</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-full bg-muted">
                    <Filter className="h-6 w-6" />
                  </div>
                  <span className="text-sm">Filter</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-full bg-muted">
                    <Check className="h-6 w-6" />
                  </div>
                  <span className="text-sm">Check</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-full bg-muted">
                    <X className="h-6 w-6" />
                  </div>
                  <span className="text-sm">X</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-full bg-muted">
                    <FileText className="h-6 w-6" />
                  </div>
                  <span className="text-sm">FileText</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-full bg-muted">
                    <ArrowLeft className="h-6 w-6" />
                  </div>
                  <span className="text-sm">ArrowLeft</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-full bg-muted">
                    <RefreshCcw className="h-6 w-6" />
                  </div>
                  <span className="text-sm">RefreshCcw</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Seção de Cores */}
        <TabsContent value="colors" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Paleta de Cores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div>
                  <h3 className="font-medium mb-4">Cores Primárias</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="h-16 w-full bg-primary rounded-md"></div>
                      <span className="text-sm">Primary</span>
                      <span className="text-xs text-muted-foreground">hsl(217 10% 35%)</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="h-16 w-full bg-secondary rounded-md"></div>
                      <span className="text-sm">Secondary</span>
                      <span className="text-xs text-muted-foreground">hsl(220 10% 96%)</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="h-16 w-full bg-accent rounded-md"></div>
                      <span className="text-sm">Accent</span>
                      <span className="text-xs text-muted-foreground">hsl(220 15% 92%)</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="h-16 w-full bg-muted rounded-md"></div>
                      <span className="text-sm">Muted</span>
                      <span className="text-xs text-muted-foreground">hsl(220 10% 96%)</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-4">Cores de Status</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="h-16 w-full bg-[#0EA5E9] rounded-md"></div>
                      <span className="text-sm">Blue</span>
                      <span className="text-xs text-muted-foreground">#0EA5E9</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="h-16 w-full bg-[#10B981] rounded-md"></div>
                      <span className="text-sm">Green (Success)</span>
                      <span className="text-xs text-muted-foreground">#10B981</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="h-16 w-full bg-[#F59E0B] rounded-md"></div>
                      <span className="text-sm">Yellow (Warning)</span>
                      <span className="text-xs text-muted-foreground">#F59E0B</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="h-16 w-full bg-destructive rounded-md"></div>
                      <span className="text-sm">Red (Destructive)</span>
                      <span className="text-xs text-muted-foreground">hsl(0 70% 50%)</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-4">Fundo e Texto</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="h-16 w-full bg-background rounded-md border"></div>
                      <span className="text-sm">Background</span>
                      <span className="text-xs text-muted-foreground">hsl(220 15% 98%)</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="h-16 w-full bg-foreground rounded-md"></div>
                      <span className="text-sm">Foreground</span>
                      <span className="text-xs text-muted-foreground">hsl(220 15% 20%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>Exemplo de Tabela</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>001</TableCell>
                <TableCell>Item de exemplo</TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                    Ativo
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-blue-500 hover:bg-blue-100 hover:text-blue-700"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:bg-red-100 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>002</TableCell>
                <TableCell>Outro item de exemplo</TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20">
                    Inativo
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-blue-500 hover:bg-blue-100 hover:text-blue-700"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:bg-red-100 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
