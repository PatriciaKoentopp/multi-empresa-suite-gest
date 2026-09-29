import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import Page from "@/pages/agenda-pessoal/planejamento";

export const Route = createFileRoute("/agenda-pessoal/planejamento")({
  head: () => ({ meta: [{ title: "Planejamento - Agenda Pessoal" }] }),
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <Page />
      </MainLayout>
    </PrivateRoute>
  ),
});
