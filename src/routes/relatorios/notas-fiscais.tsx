import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import RelatorioNotasFiscais from "@/pages/relatorios/notas-fiscais";

export const Route = createFileRoute("/relatorios/notas-fiscais")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <RelatorioNotasFiscais />
      </MainLayout>
    </PrivateRoute>
  ),
});
