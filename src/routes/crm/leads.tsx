import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import Leads from "@/pages/crm/leads";

export const Route = createFileRoute("/crm/leads")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <Leads />
      </MainLayout>
    </PrivateRoute>
  ),
});
