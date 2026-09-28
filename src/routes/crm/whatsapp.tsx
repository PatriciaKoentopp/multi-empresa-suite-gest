import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import WhatsappPage from "@/pages/crm/whatsapp";

export const Route = createFileRoute("/crm/whatsapp")({
  head: () => ({
    meta: [
      { title: "WhatsApp | CRM" },
      { name: "description", content: "Conversas do WhatsApp Business integradas ao CRM." },
      { property: "og:title", content: "WhatsApp | CRM" },
      { property: "og:description", content: "Conversas do WhatsApp Business integradas ao CRM." },
    ],
  }),
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <WhatsappPage />
      </MainLayout>
    </PrivateRoute>
  ),
});
