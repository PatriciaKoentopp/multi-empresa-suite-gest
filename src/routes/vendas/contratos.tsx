import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import Contratos from "@/pages/vendas/contratos";

export const Route = createFileRoute("/vendas/contratos")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <Contratos />
      </MainLayout>
    </PrivateRoute>
  ),
});
