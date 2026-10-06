import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import MetaImplantacaoPage from "@/pages/crm/meta-implantacao";

export const Route = createFileRoute("/crm/meta-implantacao")({
  head: () => ({
    meta: [
      { title: "Implantação Instagram/Facebook | CRM" },
      { name: "description", content: "Vincule as contas de Instagram e Facebook de cada empresa ao funil do CRM." },
      { property: "og:title", content: "Implantação Instagram/Facebook | CRM" },
      { property: "og:description", content: "Vincule as contas de Instagram e Facebook de cada empresa ao funil do CRM." },
    ],
  }),
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <MetaImplantacaoPage />
      </MainLayout>
    </PrivateRoute>
  ),
});
