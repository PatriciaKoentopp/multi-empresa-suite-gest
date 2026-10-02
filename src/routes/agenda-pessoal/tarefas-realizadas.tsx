import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import Page from "@/pages/agenda-pessoal/tarefas-realizadas";

export const Route = createFileRoute("/agenda-pessoal/tarefas-realizadas")({
  head: () => ({ meta: [
    { title: "Tarefas Realizadas - Agenda Pessoal" },
    { name: "description", content: "Listagem das tarefas realizadas da sua Agenda Pessoal, com filtragem por data e papel." },
    { property: "og:title", content: "Tarefas Realizadas - Agenda Pessoal" },
    { property: "og:description", content: "Listagem das tarefas realizadas da sua Agenda Pessoal, com filtragem por data e papel." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <Page />
      </MainLayout>
    </PrivateRoute>
  ),
});
