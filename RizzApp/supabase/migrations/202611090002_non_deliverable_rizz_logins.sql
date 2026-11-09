BEGIN;
-- Display IDs keep @rizz.com. Firebase logins use deterministic .invalid aliases,
-- so a third-party domain owner cannot receive a member's password reset mail.
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
       AND auth.jwt()->>'email'=pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(u.rizz_id,'UTF8')),'hex')||'@rizz.invalid')
  )
  AND (u.parent_user_id IS NULL OR EXISTS (
   SELECT 1 FROM public.users p WHERE p.id=u.parent_user_id AND p.is_active AND p.role='owner' AND p.parent_user_id IS NULL
  ))
$$;
CREATE OR REPLACE FUNCTION public.backend_contract_version() RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT CASE WHEN EXISTS (SELECT 1 FROM private.identity_configuration) THEN 5 ELSE 0 END
$$;
NOTIFY pgrst, 'reload schema';
COMMIT;
