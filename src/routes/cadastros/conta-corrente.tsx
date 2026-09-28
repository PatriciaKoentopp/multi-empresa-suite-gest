import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import ContaCorrente from "@/pages/cadastros/conta-corrente";

export const Route = createFileRoute("/cadastros/conta-corrente")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <ContaCorrente />
      </MainLayout>
    </PrivateRoute>
  ),
});
