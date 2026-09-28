import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import RelatorioVendas from "@/pages/relatorios/vendas";

export const Route = createFileRoute("/relatorios/vendas")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <RelatorioVendas />
      </MainLayout>
    </PrivateRoute>
  ),
});
