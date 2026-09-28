import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import ClassificacaoABC from "@/pages/relatorios/classificacao-abc";

export const Route = createFileRoute("/relatorios/classificacao-abc")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <ClassificacaoABC />
      </MainLayout>
    </PrivateRoute>
  ),
});
