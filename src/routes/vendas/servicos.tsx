import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import Servicos from "@/pages/vendas/servicos";

export const Route = createFileRoute("/vendas/servicos")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <Servicos />
      </MainLayout>
    </PrivateRoute>
  ),
});
