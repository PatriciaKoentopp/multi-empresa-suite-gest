
import { ModuleNavItem } from "@/types";

// Esta configuração define os itens de navegação do sistema
export const navigationConfig: ModuleNavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: "Grid",
  },
  {
    title: "Administrativo",
    icon: "Settings",
    subItems: [
      {
        title: "Empresas",
        href: "/admin/empresas",
      },
      {
        title: "Usuários",
        href: "/admin/usuarios",
      },
      {
        title: "Permissões",
        href: "/admin/permissoes",
      },
      {
        title: "Parâmetros",
        href: "/admin/parametros",
      },
    ],
  },
  {
    title: "Cadastros",
    icon: "List",
    subItems: [
      {
        title: "Grupo de Favorecidos",
        href: "/cadastros/grupo-favorecidos",
      },
      {
        title: "Favorecidos",
        href: "/cadastros/favorecidos",
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
        title: "Conta Corrente",
        href: "/cadastros/conta-corrente",
      },
      {
        title: "Tipos de Títulos",
        href: "/cadastros/tipos-titulos",
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
        title: "Movimentação",
        href: "/financeiro/movimentacao",
      },
      {
        title: "Contas a Pagar",
        href: "/financeiro/contas-a-pagar",
      },
      {
        title: "Contas a Receber",
        href: "/financeiro/contas-receber",
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
        title: "Lançamentos",
        href: "/contabil/lancamentos",
      },
      {
        title: "DRE",
        href: "/contabil/dre",
      },
      {
        title: "Balanço",
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
        title: "Tabela de Preços",
        href: "/vendas/tabela-precos",
      },
      {
        title: "Orçamentos",
        href: "/vendas/orcamento",
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
        title: "Painel do CRM",
        href: "/crm/painel",
      },
      {
        title: "Leads",
        href: "/crm/leads",
      },
      {
        title: "Conf. do Funil",
        href: "/crm/funil-configuracao",
      },
      {
        title: "Marketing",
        href: "/crm/marketing",
      },
    ],
  },
  {
    title: "Relatórios",
    icon: "BarChart",
    href: "/relatorios",
  },
];

export const userNavigation: ModuleNavItem[] = [
  {
    title: "Perfil",
    href: "/perfil",
    icon: "User",
  },
  {
    title: "Configurações",
    href: "/configuracoes",
    icon: "Settings",
  },
  {
    title: "Ajuda",
    href: "/ajuda",
    icon: "HelpCircle",
  }
];

