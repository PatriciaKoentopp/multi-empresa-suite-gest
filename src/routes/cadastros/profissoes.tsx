import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import Profissoes from "@/pages/cadastros/profissoes";

export const Route = createFileRoute("/cadastros/profissoes")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <Profissoes />
      </MainLayout>
    </PrivateRoute>
  ),
});
