import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import TabelaPrecos from "@/pages/vendas/tabela-precos";

export const Route = createFileRoute("/vendas/tabela-precos")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <TabelaPrecos />
      </MainLayout>
    </PrivateRoute>
  ),
});
