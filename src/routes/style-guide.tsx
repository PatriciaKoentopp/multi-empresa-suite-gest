import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import StyleGuide from "@/pages/style-guide";

export const Route = createFileRoute("/style-guide")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <StyleGuide />
      </MainLayout>
    </PrivateRoute>
  ),
});
