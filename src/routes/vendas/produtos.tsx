import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import Produtos from "@/pages/vendas/produtos";

export const Route = createFileRoute("/vendas/produtos")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <Produtos />
      </MainLayout>
    </PrivateRoute>
  ),
});
