import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import FluxoCaixa from "@/pages/financeiro/fluxo-caixa";

export const Route = createFileRoute("/financeiro/fluxo-caixa")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <FluxoCaixa />
      </MainLayout>
    </PrivateRoute>
  ),
});
