import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

function OAuthReturn() {
  const [msg, setMsg] = useState("Finalizando conexão...");
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const avisar = (type: "appUserConnectorOAuthComplete" | "appUserConnectorOAuthFailed", code?: string) => {
      window.opener?.postMessage({ type, connectorId: "google_calendar", code: code ?? null }, window.location.origin);
      window.close();
    };
    if (p.get("success") !== "true") { setMsg(p.get("error") ?? "A conexão não foi concluída."); avisar("appUserConnectorOAuthFailed"); return; }
    const code = p.get("code");
    if (!code) {
      if (p.get("offline_access_allowed") === "false") { avisar("appUserConnectorOAuthComplete"); return; }
      setMsg("A conexão terminou sem código."); avisar("appUserConnectorOAuthFailed"); return;
    }
    avisar("appUserConnectorOAuthComplete", code);
  }, []);
  return <p className="p-6 text-sm">{msg}</p>;
}

export const Route = createFileRoute("/oauth/google-calendar/return")({
  head: () => ({ meta: [{ title: "Conectando Google Agenda" }, { name: "robots", content: "noindex" }] }),
  component: OAuthReturn,
});
