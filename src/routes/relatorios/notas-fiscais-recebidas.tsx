import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import RelatorioNotasFiscaisRecebidas from "@/pages/relatorios/notas-fiscais-recebidas";

export const Route = createFileRoute("/relatorios/notas-fiscais-recebidas")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <RelatorioNotasFiscaisRecebidas />
      </MainLayout>
    </PrivateRoute>
  ),
});
