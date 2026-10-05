-- Only the eleven support/catalog RPCs installed by this repository are moved.
-- Preserve their exact public signatures as invoker wrappers. Do not alter
-- unrelated public functions or tables; each table's own migration enables RLS.
DO $$
DECLARE fn record; call_args text;
BEGIN
 FOR fn IN SELECT p.oid,p.proname,p.pronargs,pg_get_function_identity_arguments(p.oid) identity_args,
  pg_get_function_arguments(p.oid) full_args,oidvectortypes(p.proargtypes) arg_types,pg_get_function_result(p.oid) result_type
  FROM (VALUES
   ('public.admin_get_support_inbox()'::regprocedure),
   ('public.admin_get_support_messages(uuid)'::regprocedure),
   ('public.admin_send_support_message(uuid,text)'::regprocedure),
   ('public.delete_product(uuid)'::regprocedure),
   ('public.ensure_customer_profile()'::regprocedure),
   ('public.get_my_support_conversations()'::regprocedure),
   ('public.get_my_support_messages(uuid)'::regprocedure),
   ('public.get_my_support_replies()'::regprocedure),
   ('public.mark_support_conversation_read(uuid,boolean)'::regprocedure),
   ('public.send_customer_support_message(uuid,text)'::regprocedure),
   ('public.start_customer_support_conversation(text)'::regprocedure)
  ) AS owned_rpc(function_oid)
  JOIN pg_proc p ON p.oid=owned_rpc.function_oid
  WHERE p.prosecdef
 LOOP
  IF to_regprocedure(format('private.%I(%s)',fn.proname,fn.arg_types)) IS NOT NULL THEN
   RAISE EXCEPTION 'Private implementation already exists for %',fn.proname;
  END IF;
  SELECT coalesce(string_agg('$'||i,',' ORDER BY i),'') INTO call_args FROM generate_series(1,fn.pronargs) i;
  EXECUTE format('ALTER FUNCTION public.%I(%s) SET SCHEMA private',fn.proname,fn.identity_args);
  EXECUTE format('REVOKE ALL ON FUNCTION private.%I(%s) FROM PUBLIC,anon',fn.proname,fn.identity_args);
  EXECUTE format('GRANT EXECUTE ON FUNCTION private.%I(%s) TO authenticated',fn.proname,fn.identity_args);
  EXECUTE format('CREATE FUNCTION public.%I(%s) RETURNS %s LANGUAGE sql SECURITY INVOKER SET search_path='''' AS %L',
   fn.proname,fn.full_args,fn.result_type,format('SELECT * FROM private.%I(%s)',fn.proname,call_args));
  EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC,anon',fn.proname,fn.identity_args);
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated',fn.proname,fn.identity_args);
 END LOOP;
END $$;
NOTIFY pgrst,'reload schema';
