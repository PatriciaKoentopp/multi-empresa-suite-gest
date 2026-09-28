import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import RelatorioFavorecido from "@/pages/relatorios/favorecido";

export const Route = createFileRoute("/relatorios/favorecido")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <RelatorioFavorecido />
      </MainLayout>
    </PrivateRoute>
  ),
});
