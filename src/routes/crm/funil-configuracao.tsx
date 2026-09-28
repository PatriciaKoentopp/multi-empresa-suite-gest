import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import FunilConfiguracao from "@/pages/crm/funil-configuracao";

export const Route = createFileRoute("/crm/funil-configuracao")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <FunilConfiguracao />
      </MainLayout>
    </PrivateRoute>
  ),
});
