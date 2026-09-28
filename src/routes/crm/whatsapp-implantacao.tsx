import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import WhatsappImplantacaoPage from "@/pages/crm/whatsapp-implantacao";

export const Route = createFileRoute("/crm/whatsapp-implantacao")({
  head: () => ({
    meta: [
      { title: "Implantação do WhatsApp | CRM" },
      { name: "description", content: "Vincule o número de WhatsApp Business de cada empresa." },
      { property: "og:title", content: "Implantação do WhatsApp | CRM" },
      { property: "og:description", content: "Vincule o número de WhatsApp Business de cada empresa." },
    ],
  }),
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <WhatsappImplantacaoPage />
      </MainLayout>
    </PrivateRoute>
  ),
});
