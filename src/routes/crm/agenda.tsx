import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import CrmAgenda from "@/pages/crm/agenda";

export const Route = createFileRoute("/crm/agenda")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <CrmAgenda />
      </MainLayout>
    </PrivateRoute>
  ),
});
