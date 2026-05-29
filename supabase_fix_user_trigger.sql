-- =============================================================================
-- CORREÇÃO: Trigger de criação de usuário
-- Execute este SQL no Supabase > SQL Editor
-- =============================================================================

-- Remove o trigger antigo (se existir) que causava "Database error creating new user"
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recria a função com tratamento correto para o campo `nome` (NOT NULL)
-- Usa full_name do metadata se disponível, senão usa o e-mail como fallback
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users_crm (id, email, nome, perfil, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'Usuário',
    'Ativo'
  )
  ON CONFLICT (id) DO UPDATE
    SET nome   = COALESCE(EXCLUDED.nome, public.users_crm.nome),
        email  = EXCLUDED.email;
  RETURN NEW;
END;
$$;

-- Recria o trigger vinculado à tabela auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- =============================================================================
-- ATENÇÃO: confirme que o RLS está desabilitado nas tabelas do CRM,
-- caso contrário os inserts do app vão falhar silenciosamente.
-- =============================================================================
ALTER TABLE public.contacts    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_crm   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_sources DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.segments    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.loss_reasons DISABLE ROW LEVEL SECURITY;
