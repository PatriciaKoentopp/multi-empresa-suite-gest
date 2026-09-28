import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import TiposTitulos from "@/pages/cadastros/tipos-titulos";

export const Route = createFileRoute("/cadastros/tipos-titulos")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <TiposTitulos />
      </MainLayout>
    </PrivateRoute>
  ),
});
