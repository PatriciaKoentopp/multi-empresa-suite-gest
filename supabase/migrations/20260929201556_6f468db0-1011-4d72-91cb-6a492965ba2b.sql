CREATE TABLE public.app_user_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connector_id text NOT NULL,
  connection_key_ciphertext text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, connector_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_user_connections TO service_role;
ALTER TABLE public.app_user_connections ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.agenda_google_config (
  user_id uuid PRIMARY KEY,
  calendar_id text NOT NULL DEFAULT 'primary',
  email text,
  ultima_sync timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_google_config TO authenticated;
GRANT ALL ON public.agenda_google_config TO service_role;
ALTER TABLE public.agenda_google_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuario gerencia sua config google" ON public.agenda_google_config
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER agenda_google_config_updated BEFORE UPDATE ON public.agenda_google_config
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.agenda_tarefas ADD COLUMN google_event_id text, ADD COLUMN google_updated_at timestamptz;
CREATE UNIQUE INDEX agenda_tarefas_user_google_uidx ON public.agenda_tarefas(user_id, google_event_id) WHERE google_event_id IS NOT NULL;