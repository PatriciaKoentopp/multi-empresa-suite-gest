import { ModuleNavItem } from "@/types";
import React from "react";

// Esta função é usada para converter strings em ícones ao carregar
const stringToIcon = (iconName: string): React.ReactNode => {
  // Esta é apenas uma função auxiliar para compatibilidade
  // Na prática, precisaria mapear strings para componentes reais de ícones
  return iconName as unknown as React.ReactNode;
};

export const navigationConfig: ModuleNavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: stringToIcon("Grid"),
  },
  {
    name: "Administrativo",
    icon: stringToIcon("Settings"),
    subItems: [
      {
        name: "Empresas",
        href: "/admin/empresas",
      },
      {
        name: "Usuários",
        href: "/admin/usuarios",
      },
      {
        name: "Permissões",
        href: "/admin/permissoes",
      },
      {
        name: "Parâmetros",
        href: "/admin/parametros",
      },
    ],
  },
  {
    name: "Cadastros",
    icon: stringToIcon("List"),
    subItems: [
      {
        name: "Grupo de Favorecidos",
        href: "/cadastros/grupo-favorecidos",
      },
      {
        name: "Favorecidos",
        href: "/cadastros/favorecidos",
      },
      {
        name: "Profissões",
        href: "/cadastros/profissoes",
      },
      {
        name: "Origens",
        href: "/cadastros/origens",
      },
      {
        name: "Motivos de Perda",
        href: "/cadastros/motivos-perda",
      },
      {
        name: "Conta Corrente",
        href: "/cadastros/conta-corrente",
      },
      {
        name: "Tipos de Títulos",
        href: "/cadastros/tipos-titulos",
      },
    ],
  },
  {
    name: "Financeiro",
    icon: stringToIcon("DollarSign"),
    subItems: [
      {
        name: "Fluxo de Caixa",
        href: "/financeiro/fluxo-caixa",
      },
      {
        name: "Movimentação",
        href: "/financeiro/movimentacao",
      },
      {
        name: "Contas a Pagar",
        href: "/financeiro/contas-a-pagar",
      },
      {
        name: "Contas a Receber",
        href: "/financeiro/contas-receber",
      },
    ],
  },
  {
    name: "Contábil",
    icon: stringToIcon("Calculator"),
    subItems: [
      {
        name: "Plano de Contas",
        href: "/contabil/plano-contas",
      },
      {
        name: "Lançamentos",
        href: "/contabil/lancamentos",
      },
      {
        name: "DRE",
        href: "/contabil/dre",
      },
      {
        name: "Balanço",
        href: "/contabil/balanco",
      },
    ],
  },
  {
    name: "Vendas",
    icon: stringToIcon("ShoppingBag"),
    subItems: [
      {
        name: "Serviços",
        href: "/vendas/servicos",
      },
      {
        name: "Tabela de Preços",
        href: "/vendas/tabela-precos",
      },
      {
        name: "Orçamentos",
        href: "/vendas/orcamento",
      },
      {
        name: "Faturamento",
        href: "/vendas/faturamento",
      },
    ],
  },
  {
    name: "CRM",
    icon: stringToIcon("Users"),
    subItems: [
      {
        name: "Leads",
        href: "/crm/leads",
      },
      {
        name: "Conf. do Funil",
        href: "/crm/funil-configuracao",
      },
      {
        name: "Marketing",
        href: "/crm/marketing",
      },
    ],
  },
  {
    name: "Relatórios",
    icon: stringToIcon("BarChart"),
    href: "/relatorios",
  },
];

export const userNavigation: ModuleNavItem[] = [
  {
    name: "Perfil",
    href: "/perfil",
    icon: stringToIcon("User"),
  },
  {
    name: "Configurações",
    href: "/configuracoes",
    icon: stringToIcon("Settings"),
  },
  {
    name: "Ajuda",
    href: "/ajuda",
    icon: stringToIcon("HelpCircle"),
  }
];

// Exportar apenas uma vez
export { stringToIcon };
