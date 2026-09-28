import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import LogsTransacoes from "@/pages/relatorios/logs-transacoes";

export const Route = createFileRoute("/relatorios/logs")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <LogsTransacoes />
      </MainLayout>
    </PrivateRoute>
  ),
});
