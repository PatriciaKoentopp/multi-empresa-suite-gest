import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import GrupoProdutos from "@/pages/cadastros/grupo-produtos";

export const Route = createFileRoute("/cadastros/grupo-produtos")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <GrupoProdutos />
      </MainLayout>
    </PrivateRoute>
  ),
});
