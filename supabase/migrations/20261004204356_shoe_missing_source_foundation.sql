-- Compatibility fields present in the connected source store but omitted
-- from its ZIP's migration history. No original customer data is copied.
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_accessory boolean NOT NULL DEFAULT false;
ALTER TABLE public.reviews
 ADD COLUMN IF NOT EXISTS customer_name text NOT NULL DEFAULT '' CHECK(length(customer_name)<=150),
 ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' CHECK(status IN('pending','approved','rejected','spam')),
 ADD COLUMN IF NOT EXISTS is_spam boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
UPDATE public.reviews SET status=CASE WHEN approved THEN 'approved' ELSE 'pending' END;
REVOKE ALL ON public.reviews FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.reviews TO anon,authenticated;
GRANT INSERT,DELETE ON public.reviews TO authenticated;
GRANT UPDATE(status) ON public.reviews TO authenticated;

CREATE FUNCTION private.guard_shoe_review() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE verified_name text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000'; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Review ownership mismatch' USING ERRCODE='42501'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.orders o JOIN public.order_items oi ON oi.order_id=o.id JOIN public.product_variants v ON v.id=oi.variant_id
    WHERE o.user_id=auth.uid() AND o.status='delivered' AND v.product_id=NEW.product_id) THEN
   RAISE EXCEPTION 'Only delivered purchases can be reviewed' USING ERRCODE='42501';
  END IF;
  SELECT p.full_name INTO verified_name FROM public.profiles p WHERE p.id=auth.uid();
  NEW.customer_name:=coalesce(verified_name,'Customer');NEW.approved:=false;NEW.status:='pending';NEW.is_spam:=false;
 ELSE
  IF NOT private.is_admin() THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE='42501'; END IF;
  NEW.approved:=NEW.status='approved';NEW.is_spam:=NEW.status='spam';
 END IF;
 NEW.updated_at:=now();
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.guard_shoe_review() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER shoe_review_guard BEFORE INSERT OR UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION private.guard_shoe_review();

CREATE VIEW public.product_review_stats WITH(security_invoker=true) AS
 SELECT product_id,avg(rating)::numeric(3,2) average_rating,count(*)::integer review_count
 FROM public.reviews WHERE approved AND status='approved' AND NOT is_spam GROUP BY product_id;
GRANT SELECT ON public.product_review_stats TO anon,authenticated;
CREATE FUNCTION public.submit_review(p_product_id uuid,p_rating integer,p_comment text) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE rid uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000'; END IF;
 INSERT INTO public.reviews(product_id,user_id,rating,comment) VALUES(p_product_id,auth.uid(),p_rating,p_comment) RETURNING id INTO rid;
 RETURN rid;
END $$;
REVOKE ALL ON FUNCTION public.submit_review(uuid,integer,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_review(uuid,integer,text) TO authenticated;

-- Ticket functions were created before the source renamed its ticket-message
-- table for the newer conversation UI. Preserve those legacy contracts too.
DO $$ DECLARE fn record; BEGIN
 FOR fn IN SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='private' AND p.proname IN('create_ticket','reply_to_ticket') LOOP
  EXECUTE replace(pg_get_functiondef(fn.oid),'public.support_messages','public.support_ticket_messages');
 END LOOP;
END $$;
GRANT SELECT,UPDATE ON public.support_requests TO authenticated;
GRANT SELECT ON public.support_tickets,public.support_ticket_messages TO authenticated;
REVOKE EXECUTE ON FUNCTION private.sync_profile_from_auth(),private.create_support_conversation_for_profile() FROM PUBLIC,anon,authenticated;
NOTIFY pgrst,'reload schema';
