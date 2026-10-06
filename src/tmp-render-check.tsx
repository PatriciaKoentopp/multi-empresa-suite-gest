import React from "react";
import { createRoot } from "react-dom/client";
import { LeadFechamentoTab } from "@/pages/crm/leads/LeadFechamentoTab";

export function mount() {
  const host = document.createElement("div");
  host.id = "tmp-render-check";
  host.style.position = "fixed";
  host.style.inset = "0";
  host.style.background = "#fff";
  host.style.padding = "24px";
  host.style.zIndex = "99999";
  document.body.appendChild(host);
  const root = createRoot(host);
  root.render(
    <LeadFechamentoTab
      fechamento={null}
      setFechamento={() => {}}
      motivosPerda={[]}
      leadId="00000000-0000-0000-0000-000000000000"
    />
  );
  return true;
}
