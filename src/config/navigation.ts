
import { ModuleNavItem } from "@/types";

// Esta configuração define os itens de navegação do sistema
export const navigationConfig: ModuleNavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: "Grid",
  },
  {
    name: "Administrativo",
    icon: "Settings",
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
    icon: "List",
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
    icon: "DollarSign",
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
    icon: "Calculator",
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
    icon: "ShoppingBag",
    subItems: [
      {
        name: "Painel de Vendas",
        href: "/vendas/painel-vendas",
      },
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
    icon: "Users",
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
    icon: "BarChart",
    href: "/relatorios",
  },
];

export const userNavigation: ModuleNavItem[] = [
  {
    name: "Perfil",
    href: "/perfil",
    icon: "User",
  },
  {
    name: "Configurações",
    href: "/configuracoes",
    icon: "Settings",
  },
  {
    name: "Ajuda",
    href: "/ajuda",
    icon: "HelpCircle",
  }
];
