import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import CrmPainelPage from "@/pages/crm/painel";

export const Route = createFileRoute("/crm/painel")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <CrmPainelPage />
      </MainLayout>
    </PrivateRoute>
  ),
});
