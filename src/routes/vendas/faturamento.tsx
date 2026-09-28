import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import Faturamento from "@/pages/vendas/faturamento";

export const Route = createFileRoute("/vendas/faturamento")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <Faturamento />
      </MainLayout>
    </PrivateRoute>
  ),
});
