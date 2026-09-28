import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import PainelVendas from "@/pages/vendas/painel-vendas";

export const Route = createFileRoute("/vendas/painel-vendas")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <PainelVendas />
      </MainLayout>
    </PrivateRoute>
  ),
});
