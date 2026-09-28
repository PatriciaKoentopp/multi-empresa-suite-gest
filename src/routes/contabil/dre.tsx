import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import DRE from "@/pages/contabil/dre";

export const Route = createFileRoute("/contabil/dre")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <DRE />
      </MainLayout>
    </PrivateRoute>
  ),
});
