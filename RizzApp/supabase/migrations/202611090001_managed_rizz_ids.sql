BEGIN;
ALTER TABLE public.users ADD COLUMN rizz_id text;
ALTER TABLE public.users ADD COLUMN managed_login boolean NOT NULL DEFAULT false;
ALTER TABLE public.users ADD COLUMN managed_auth_version integer NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX users_rizz_id_unique ON public.users(lower(rizz_id)) WHERE rizz_id IS NOT NULL;
ALTER TABLE public.users ADD CONSTRAINT users_managed_identity CHECK (
  (NOT managed_login AND rizz_id IS NULL AND managed_auth_version=0)
  OR (managed_login AND role='member' AND parent_user_id IS NOT NULL AND firebase_user_id IS NOT NULL
      AND managed_auth_version>=1 AND rizz_id IS NOT NULL AND rizz_id=email
      AND rizz_id=lower(rizz_id) AND rizz_id ~ '^[a-z0-9][a-z0-9._-]{1,38}[a-z0-9]@rizz[.]com$'
      AND rizz_id NOT LIKE '%..%')
);
GRANT SELECT(rizz_id,managed_login,managed_auth_version) ON public.users TO authenticated;
CREATE OR REPLACE FUNCTION private.current_profile_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT u.id FROM public.users u CROSS JOIN private.identity_configuration c
 WHERE u.firebase_user_id=auth.jwt()->>'sub' AND u.is_active
  AND auth.jwt()->>'iss'='https://securetoken.google.com/'||c.firebase_project_id
  AND auth.jwt()->>'aud'=c.firebase_project_id
  AND (
   (NOT u.managed_login AND auth.jwt()->'email_verified'='true'::jsonb)
   OR (u.managed_login AND u.role='member' AND u.parent_user_id IS NOT NULL
       AND auth.jwt()->'rizz_managed'='true'::jsonb
       AND auth.jwt()->'rizz_auth_version'=to_jsonb(u.managed_auth_version)
       AND auth.jwt()->>'email'=u.rizz_id)
  )
  AND (u.parent_user_id IS NULL OR EXISTS (
   SELECT 1 FROM public.users p WHERE p.id=u.parent_user_id AND p.is_active AND p.role='owner' AND p.parent_user_id IS NULL
  ))
$$;
CREATE OR REPLACE FUNCTION public.backend_contract_version() RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT CASE WHEN EXISTS (SELECT 1 FROM private.identity_configuration) THEN 4 ELSE 0 END
$$;
NOTIFY pgrst, 'reload schema';
COMMIT;
