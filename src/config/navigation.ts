
import { ModuleNavItem } from "@/types";

export const getNavigation = (): ModuleNavItem[] => [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: "Grid",
  },
  {
    title: "Cadastros",
    icon: "List",
    subItems: [
      {
        title: "Favorecidos",
        href: "/cadastros/favorecidos",
      },
      {
        title: "Grupo de Favorecidos",
        href: "/cadastros/grupo-favorecidos",
      },
      {
        title: "Profissões",
        href: "/cadastros/profissoes",
      },
      {
        title: "Origens",
        href: "/cadastros/origens",
      },
      {
        title: "Motivos de Perda",
        href: "/cadastros/motivos-perda",
      },
      {
        title: "Contas Correntes",
        href: "/cadastros/conta-corrente",
      },
      {
        title: "Tipos de Títulos",
        href: "/cadastros/tipos-titulos",
      },
      {
        title: "Grupo de Produtos",
        href: "/cadastros/grupo-produtos",
      },
    ],
  },
  {
    title: "Financeiro",
    icon: "DollarSign",
    subItems: [
      {
        title: "Painel Financeiro",
        href: "/financeiro/painel-financeiro",
      },
      {
        title: "Fluxo de Caixa",
        href: "/financeiro/fluxo-caixa",
      },
      {
        title: "Contas a Pagar",
        href: "/financeiro/contas-a-pagar",
      },
      {
        title: "Contas a Receber",
        href: "/financeiro/contas-receber",
      },
      {
        title: "Movimentação",
        href: "/financeiro/movimentacao",
      },
    ],
  },
  {
    title: "Contábil",
    icon: "Calculator",
    subItems: [
      {
        title: "Plano de Contas",
        href: "/contabil/plano-contas",
      },
      {
        title: "Lançamentos Contábeis",
        href: "/contabil/lancamentos",
      },
      {
        title: "DRE",
        href: "/contabil/dre",
      },
      {
        title: "Balanço Patrimonial",
        href: "/contabil/balanco",
      },
    ],
  },
  {
    title: "Vendas",
    icon: "ShoppingBag",
    subItems: [
      {
        title: "Painel de Vendas",
        href: "/vendas/painel-vendas",
      },
      {
        title: "Serviços",
        href: "/vendas/servicos",
      },
      {
        title: "Produtos",
        href: "/vendas/produtos",
      },
      {
        title: "Tabela de Preços",
        href: "/vendas/tabela-precos",
      },
      {
        title: "Orçamento",
        href: "/vendas/orcamento",
      },
      {
        title: "Orçamento 2.0",
        href: "/vendas/orcamento2",
      },
      {
        title: "Faturamento",
        href: "/vendas/faturamento",
      },
    ],
  },
  {
    title: "CRM",
    icon: "Users",
    subItems: [
      {
        title: "Painel CRM",
        href: "/crm/painel",
      },
      {
        title: "Funil de Vendas",
        href: "/crm/funil-configuracao",
      },
      {
        title: "Leads",
        href: "/crm/leads",
      },
    ],
  },
  {
    title: "Relatórios",
    href: "/relatorios",
    icon: "BarChart",
  },
  {
    title: "Usuários",
    href: "/admin/usuarios",
    icon: "User",
  },
  {
    title: "Empresas",
    href: "/admin/empresas",
    icon: "Settings",
  },
];
