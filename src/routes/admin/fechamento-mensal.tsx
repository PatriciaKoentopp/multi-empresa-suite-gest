import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import FechamentoMensal from "@/pages/admin/fechamento-mensal";

export const Route = createFileRoute("/admin/fechamento-mensal")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <FechamentoMensal />
      </MainLayout>
    </PrivateRoute>
  ),
});
