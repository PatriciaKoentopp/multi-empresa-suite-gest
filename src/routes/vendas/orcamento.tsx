import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import Orcamento from "@/pages/vendas/orcamento";

export const Route = createFileRoute("/vendas/orcamento")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <Orcamento />
      </MainLayout>
    </PrivateRoute>
  ),
});
