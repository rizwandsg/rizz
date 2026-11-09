BEGIN;
-- Preserve legacy IDs and ledger relationships. Identity mappings are reviewed
-- separately and installed by the operator; email alone never attaches an account.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS firebase_user_id text;
CREATE UNIQUE INDEX IF NOT EXISTS users_firebase_identity ON public.users(firebase_user_id) WHERE firebase_user_id IS NOT NULL;
ALTER TABLE public.users ADD CONSTRAINT users_firebase_uid_length CHECK (firebase_user_id IS NULL OR length(firebase_user_id) BETWEEN 1 AND 128);
GRANT SELECT(firebase_user_id) ON public.users TO authenticated;

CREATE TABLE private.identity_configuration (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  firebase_project_id text NOT NULL CHECK (firebase_project_id ~ '^[a-z][a-z0-9-]{4,28}[a-z0-9]$')
);
REVOKE ALL ON private.identity_configuration FROM PUBLIC, anon, authenticated;
GRANT ALL ON private.identity_configuration TO service_role;

CREATE OR REPLACE FUNCTION private.current_profile_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT u.id FROM public.users u CROSS JOIN private.identity_configuration c
  WHERE u.firebase_user_id = (auth.jwt()->>'sub') AND u.is_active
    AND auth.jwt()->>'iss' = 'https://securetoken.google.com/' || c.firebase_project_id
    AND auth.jwt()->>'aud' = c.firebase_project_id
    AND auth.jwt()->'email_verified' = 'true'::jsonb
    AND (u.parent_user_id IS NULL OR EXISTS (
      SELECT 1 FROM public.users p WHERE p.id=u.parent_user_id AND p.is_active AND p.role='owner' AND p.parent_user_id IS NULL
    ))
$$;

CREATE OR REPLACE FUNCTION public.backend_contract_version() RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT CASE WHEN EXISTS (SELECT 1 FROM private.identity_configuration) THEN 3 ELSE 0 END
$$;
CREATE OR REPLACE FUNCTION public.backend_auth_configuration() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT jsonb_build_object('provider','firebase','project_id',firebase_project_id) FROM private.identity_configuration
$$;
REVOKE ALL ON FUNCTION public.backend_auth_configuration() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.backend_auth_configuration() TO anon,authenticated;
COMMIT;
