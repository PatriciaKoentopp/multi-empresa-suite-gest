import { ModuleNavItem } from "@/types";
import * as Icons from "lucide-react";
// Make sure we have all the Lucide icons for the sidebar
// These will be dynamically accessed by the sidebar component
const {
  LayoutDashboard, 
  Settings, 
  Users, 
  ShoppingCart, 
  Banknote,
  Calculator, 
  BarChart,
  HeartHandshake
} = Icons;

export const mainNavigation: ModuleNavItem[] = [
  {
    name: "Dashboard",
    icon: "layout-dashboard",
    href: "/dashboard",
    description: "Visão geral do sistema"
  },
  {
    name: "Administração",
    icon: "settings",
    href: "/admin",
    description: "Gerenciamento e configurações do sistema",
    subItems: [
      {
        name: "Empresas",
        href: "/admin/empresas",
        description: "Gerenciamento de empresas"
      },
      {
        name: "Usuários",
        href: "/admin/usuarios",
        description: "Gerenciamento de usuários"
      },
      {
        name: "Permissões",
        href: "/admin/permissoes",
        description: "Controle de acesso e permissões"
      },
      {
        name: "Parâmetros",
        href: "/admin/parametros",
        description: "Configurações gerais do sistema"
      }
    ]
  },
  {
    name: "Cadastros",
    icon: "users",
    href: "/cadastros",
    description: "Cadastros gerais do sistema",
    subItems: [
      {
        name: "Grupo de Favorecidos",
        href: "/cadastros/grupo-favorecidos",
        description: "Gerenciamento de grupos de favorecidos"
      },
      {
        name: "Favorecidos",
        href: "/cadastros/favorecidos",
        description: "Gerenciamento de favorecidos"
      },
      {
        name: "Profissões",
        href: "/cadastros/profissoes",
        description: "Gerenciamento de profissões"
      },
      {
        name: "Conta Corrente",
        href: "/cadastros/conta-corrente",
        description: "Gerenciamento de contas correntes"
      }
    ]
  },
  {
    name: "Vendas",
    icon: "shopping-cart",
    href: "/vendas",
    description: "Gestão de vendas e faturamento",
    subItems: [
      {
        name: "Produtos",
        href: "/vendas/produtos",
        description: "Gerenciamento de produtos"
      },
      {
        name: "Serviços",
        href: "/vendas/servicos",
        description: "Gerenciamento de serviços"
      },
      {
        name: "Orçamento",
        href: "/vendas/orcamento", // Corrigido para o caminho certo
        description: "Gerenciamento de pedidos"
      },
      {
        name: "Faturamento",
        href: "/vendas/faturamento",
        description: "Lista de orçamentos implantados"
      },
      {
        name: "Dashboard",
        href: "/vendas/dashboard",
        description: "Estatísticas de vendas"
      }
    ]
  },
  {
    name: "Financeiro",
    icon: "banknote",
    href: "/financeiro",
    description: "Gestão financeira",
    subItems: [
      {
        name: "Contas a Receber",
        href: "/financeiro/contas-receber",
        description: "Gerenciamento de recebimentos"
      },
      {
        name: "Contas a Pagar",
        href: "/financeiro/contas-a-pagar",
        description: "Gerenciamento de pagamentos"
      },
      {
        name: "Fluxo de Caixa",
        href: "/financeiro/fluxo-caixa",
        description: "Controle de entradas e saídas"
      },
      {
        name: "Conciliação",
        href: "/financeiro/conciliacao",
        description: "Conciliação bancária"
      },
      {
        name: "Incluir Movimentação",
        href: "/financeiro/incluir-movimentacao",
        description: "Lançar nota de despesa/receita"
      }
    ]
  },
  {
    name: "CRM",
    icon: "heart-handshake",
    href: "/crm",
    description: "Gestão de relacionamento com clientes",
    subItems: [
      {
        name: "Leads",
        href: "/crm/leads",
        description: "Gerenciamento de leads"
      },
      {
        name: "Oportunidades",
        href: "/crm/oportunidades",
        description: "Funil de vendas"
      },
      {
        name: "Atendimento",
        href: "/crm/atendimento",
        description: "Gestão de chamados"
      },
      {
        name: "Marketing",
        href: "/crm/marketing",
        description: "Campanhas e automações"
      }
    ]
  },
  {
    name: "Contábil",
    icon: "calculator",
    href: "/contabil",
    description: "Gestão contábil",
    subItems: [
      {
        name: "Plano de Contas",
        href: "/contabil/plano-contas",
        description: "Gerenciamento de contas contábeis"
      },
      {
        name: "Lançamentos",
        href: "/contabil/lancamentos",
        description: "Lançamentos contábeis"
      },
      {
        name: "DRE",
        href: "/contabil/dre",
        description: "Demonstrativo de resultados"
      },
      {
        name: "Balanço",
        href: "/contabil/balanco",
        description: "Balanço patrimonial"
      }
    ]
  },
  {
    name: "Relatórios",
    icon: "bar-chart",
    href: "/relatorios",
    description: "Relatórios e análises",
    subItems: [
      {
        name: "Operacionais",
        href: "/relatorios/operacionais",
        description: "Relatórios operacionais"
      },
      {
        name: "Dashboards",
        href: "/relatorios/dashboards",
        description: "Painéis analíticos"
      },
      {
        name: "BI",
        href: "/relatorios/bi",
        description: "Business Intelligence"
      }
    ]
  }
];

export const userNavigation = [
  { name: "Perfil", href: "/perfil" },
  { name: "Configurações", href: "/configuracoes" },
  { name: "Ajuda", href: "/ajuda" }
];
