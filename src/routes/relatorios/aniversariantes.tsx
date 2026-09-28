import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import RelatorioAniversariantes from "@/pages/relatorios/aniversariantes";

export const Route = createFileRoute("/relatorios/aniversariantes")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <RelatorioAniversariantes />
      </MainLayout>
    </PrivateRoute>
  ),
});
