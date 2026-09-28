import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import RazaoContabil from "@/pages/relatorios/razao-contabil";

export const Route = createFileRoute("/relatorios/razao-contabil")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <RazaoContabil />
      </MainLayout>
    </PrivateRoute>
  ),
});
