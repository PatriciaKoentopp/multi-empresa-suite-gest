import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import Page from "@/pages/agenda-pessoal/agenda-unificada";

export const Route = createFileRoute("/agenda-pessoal/agenda-unificada")({
  head: () => ({ meta: [{ title: "Agenda Unificada - Agenda Pessoal" }] }),
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <Page />
      </MainLayout>
    </PrivateRoute>
  ),
});
