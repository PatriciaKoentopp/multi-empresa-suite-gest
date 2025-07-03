import { ModuleNavItem } from "@/types";
import {
  BarChart,
  Calculator,
  DollarSign,
  Grid,
  HelpCircle,
  List,
  Settings,
  ShoppingBag,
  User,
  Users
} from "lucide-react";

export const navigationItems: ModuleNavItem[] = [
  {
    key: "dashboard",
    title: "Dashboard",
    icon: Grid,
    href: "/dashboard",
  },
  {
    key: "cadastros",
    title: "Cadastros",
    icon: List,
    items: [
      {
        title: "Favorecidos",
        href: "/cadastros/favorecidos",
        description: "Gerenciar clientes e fornecedores"
      },
      {
        title: "Produtos",
        href: "/cadastros/produtos",
        description: "Gerenciar produtos"
      },
      {
        title: "Serviços",
        href: "/cadastros/servicos",
        description: "Gerenciar serviços"
      },
      {
        title: "Usuários",
        href: "/cadastros/usuarios",
        description: "Gerenciar usuários do sistema"
      },
    ],
  },
  {
    key: "financeiro",
    title: "Financeiro",
    icon: DollarSign,
    items: [
      {
        title: "Fluxo de Caixa",
        href: "/financeiro/fluxo-caixa",
        description: "Acompanhar movimentações financeiras"
      },
      {
        title: "Contas a Pagar",
        href: "/financeiro/contas-pagar",
        description: "Gerenciar contas a pagar"
      },
      {
        title: "Contas a Receber",
        href: "/financeiro/contas-receber",
        description: "Gerenciar contas a receber"
      },
      {
        title: "Conciliação Bancária",
        href: "/financeiro/conciliacao-bancaria",
        description: "Conciliar extratos bancários"
      },
    ],
  },
  {
    key: "vendas",
    title: "Vendas",
    icon: ShoppingBag,
    items: [
      {
        title: "Orçamentos",
        href: "/vendas/orcamentos",
        description: "Gerenciar orçamentos de vendas"
      },
    ],
  },
  {
    key: "crm",
    title: "CRM",
    icon: Users,
    items: [
      {
        title: "Leads",
        href: "/crm/leads",
        description: "Gerenciar leads e oportunidades"
      },
    ],
  },
  {
    key: "contabil",
    title: "Contábil",
    icon: Calculator,
    items: [
      {
        title: "Plano de Contas",
        href: "/contabilidade/plano-contas",
        description: "Gerenciar plano de contas"
      },
      {
        title: "Lançamentos Contábeis",
        href: "/contabilidade/lancamentos-contabeis",
        description: "Gerenciar lançamentos contábeis"
      },
      {
        title: "Balanço Patrimonial",
        href: "/contabilidade/balanco-patrimonial",
        description: "Visualizar balanço patrimonial"
      },
    ],
  },
  {
    key: "relatorios",
    title: "Relatórios",
    icon: BarChart,
    items: [
      {
        title: "Relatório de Vendas",
        href: "/relatorios/vendas",
        description: "Análise detalhada das vendas"
      },
      {
        title: "Relatório de Fluxo de Caixa",
        href: "/relatorios/fluxo-caixa",
        description: "Acompanhamento do fluxo de caixa"
      },
      {
        title: "Relatório de Clientes",
        href: "/relatorios/clientes",
        description: "Informações detalhadas sobre clientes"
      },
    ],
  },
  {
    key: "admin",
    title: "Administração",
    icon: Settings,
    items: [
      {
        title: "Empresa",
        href: "/admin/empresa",
        description: "Configurações da empresa"
      },
      {
        title: "Módulos e Parâmetros",
        href: "/admin/modulos-parametros",
        description: "Configurações dos módulos"
      },
    ],
  },
  {
    key: "ajuda",
    title: "Ajuda",
    icon: HelpCircle,
    href: "/style-guide",
  }
];
