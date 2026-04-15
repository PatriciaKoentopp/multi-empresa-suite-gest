
CREATE TABLE public.impostos_retidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  nome TEXT NOT NULL,
  tipo_titulo_id UUID NOT NULL REFERENCES public.tipos_titulos(id),
  status CHARACTER VARYING NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.impostos_retidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view impostos_retidos from their company"
ON public.impostos_retidos FOR SELECT
USING (empresa_id = get_user_company_id());

CREATE POLICY "Users can insert impostos_retidos for their company"
ON public.impostos_retidos FOR INSERT
WITH CHECK (empresa_id = get_user_company_id());

CREATE POLICY "Users can update impostos_retidos from their company"
ON public.impostos_retidos FOR UPDATE
USING (empresa_id = get_user_company_id());

CREATE POLICY "Users can delete impostos_retidos from their company"
ON public.impostos_retidos FOR DELETE
USING (empresa_id = get_user_company_id());

CREATE TRIGGER update_impostos_retidos_updated_at
BEFORE UPDATE ON public.impostos_retidos
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
