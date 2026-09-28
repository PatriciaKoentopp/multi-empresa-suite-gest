import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import Balanco from "@/pages/contabil/balanco";

export const Route = createFileRoute("/contabil/balanco")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <Balanco />
      </MainLayout>
    </PrivateRoute>
  ),
});
