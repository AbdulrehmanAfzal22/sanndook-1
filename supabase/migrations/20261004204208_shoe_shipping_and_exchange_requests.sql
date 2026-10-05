ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_currency_check;
ALTER TABLE public.orders ALTER COLUMN currency SET DEFAULT 'PKR';
ALTER TABLE public.orders ADD CONSTRAINT orders_currency_check CHECK(currency='PKR');

CREATE TABLE public.store_settings(
 id boolean PRIMARY KEY DEFAULT true CHECK(id),
 shipping_fee_cents integer NOT NULL DEFAULT 30000 CHECK(shipping_fee_cents BETWEEN 0 AND 10000000),
 free_shipping_threshold_cents integer NOT NULL DEFAULT 1200000 CHECK(free_shipping_threshold_cents>=0),
 exchange_window_days integer NOT NULL DEFAULT 7 CHECK(exchange_window_days BETWEEN 1 AND 90),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.store_settings FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.store_settings TO anon,authenticated;
GRANT UPDATE ON public.store_settings TO authenticated;
CREATE POLICY settings_read ON public.store_settings FOR SELECT TO anon,authenticated USING(true);
CREATE POLICY settings_admin_update ON public.store_settings FOR UPDATE TO authenticated USING((SELECT private.is_admin())) WITH CHECK((SELECT private.is_admin()));
INSERT INTO public.store_settings(id) VALUES(true);
CREATE TRIGGER settings_touch BEFORE UPDATE ON public.store_settings FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

CREATE FUNCTION public.quote_shipping(p_subtotal_cents bigint) RETURNS integer LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT CASE WHEN p_subtotal_cents>=free_shipping_threshold_cents THEN 0 ELSE shipping_fee_cents END
 FROM public.store_settings WHERE id=true
$$;
REVOKE ALL ON FUNCTION public.quote_shipping(bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.quote_shipping(bigint) TO anon,authenticated;

CREATE TABLE public.stock_notifications(
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,variant_id)
);
ALTER TABLE public.stock_notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stock_notifications FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,DELETE ON public.stock_notifications TO authenticated;
CREATE POLICY stock_alert_owner_read ON public.stock_notifications FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()) OR (SELECT private.is_admin()));
CREATE POLICY stock_alert_owner_insert ON public.stock_notifications FOR INSERT TO authenticated WITH CHECK(user_id=(SELECT auth.uid()) AND EXISTS(SELECT 1 FROM public.product_variants v JOIN public.products p ON p.id=v.product_id WHERE v.id=variant_id AND v.active AND p.status='published'));
CREATE POLICY stock_alert_owner_delete ON public.stock_notifications FOR DELETE TO authenticated USING(user_id=(SELECT auth.uid()));
CREATE INDEX stock_notifications_variant_idx ON public.stock_notifications(variant_id);

CREATE TABLE public.exchange_requests(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
 order_item_id uuid NOT NULL REFERENCES public.order_items(id) ON DELETE RESTRICT,
 replacement_variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 5 AND 1000),
 status text NOT NULL DEFAULT 'requested' CHECK(status IN('requested','under_review','approved','completed','rejected')),
 admin_note text NOT NULL DEFAULT '' CHECK(length(admin_note)<=2000),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(order_item_id)
);
ALTER TABLE public.exchange_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.exchange_requests FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.exchange_requests TO authenticated;
GRANT UPDATE(status,admin_note) ON public.exchange_requests TO authenticated;
CREATE POLICY exchange_owner_read ON public.exchange_requests FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()) OR (SELECT private.is_admin()));
CREATE POLICY exchange_owner_insert ON public.exchange_requests FOR INSERT TO authenticated WITH CHECK(
 user_id=(SELECT auth.uid()) AND status='requested' AND admin_note='' AND
 EXISTS(SELECT 1 FROM public.order_items oi JOIN public.orders o ON o.id=oi.order_id WHERE oi.id=order_item_id AND o.user_id=(SELECT auth.uid()) AND o.status='delivered')
);
CREATE POLICY exchange_admin_update ON public.exchange_requests FOR UPDATE TO authenticated USING((SELECT private.is_admin())) WITH CHECK((SELECT private.is_admin()));
CREATE INDEX exchange_requests_user_idx ON public.exchange_requests(user_id,created_at DESC);
CREATE INDEX exchange_requests_replacement_idx ON public.exchange_requests(replacement_variant_id);

CREATE FUNCTION private.check_exchange_request() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE order_owner uuid; order_status text; delivered_at timestamptz; original_product uuid; replacement_product uuid; replacement_stock integer; window_days integer;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000'; END IF;
 IF TG_OP='INSERT' THEN
  SELECT o.user_id,o.status,pv.product_id INTO order_owner,order_status,original_product FROM public.order_items oi
  JOIN public.orders o ON o.id=oi.order_id LEFT JOIN public.product_variants pv ON pv.id=oi.variant_id WHERE oi.id=NEW.order_item_id;
  IF order_owner IS DISTINCT FROM auth.uid() OR NEW.user_id IS DISTINCT FROM auth.uid() OR order_status IS DISTINCT FROM 'delivered' THEN
   RAISE EXCEPTION 'Only your delivered order can be exchanged' USING ERRCODE='42501';
  END IF;
  SELECT max(h.created_at) INTO delivered_at FROM public.order_status_history h JOIN public.order_items oi ON oi.order_id=h.order_id WHERE oi.id=NEW.order_item_id AND h.status='delivered';
  SELECT exchange_window_days INTO window_days FROM public.store_settings WHERE id=true;
  IF delivered_at IS NULL OR now()>delivered_at+make_interval(days=>window_days) THEN RAISE EXCEPTION 'The exchange request window has closed'; END IF;
  IF NEW.replacement_variant_id IS NOT NULL THEN
   SELECT v.product_id,v.stock INTO replacement_product,replacement_stock FROM public.product_variants v JOIN public.products p ON p.id=v.product_id WHERE v.id=NEW.replacement_variant_id AND v.active AND p.status='published';
   IF original_product IS NULL OR replacement_product IS DISTINCT FROM original_product OR coalesce(replacement_stock,0)<1 THEN RAISE EXCEPTION 'Choose an available size of the same product'; END IF;
  END IF;
 ELSE
  IF NOT private.is_admin() THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE='42501'; END IF;
  IF OLD.status IN('completed','rejected') AND NEW.status<>OLD.status THEN RAISE EXCEPTION 'This exchange request is closed'; END IF;
  IF NEW.status<>OLD.status AND NOT (
   (OLD.status='requested' AND NEW.status IN('under_review','approved','rejected')) OR
   (OLD.status='under_review' AND NEW.status IN('approved','rejected')) OR
   (OLD.status='approved' AND NEW.status IN('completed','rejected'))
  ) THEN RAISE EXCEPTION 'Invalid exchange status transition'; END IF;
 END IF;
 NEW.updated_at:=now();
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.check_exchange_request() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER check_exchange_request BEFORE INSERT OR UPDATE ON public.exchange_requests FOR EACH ROW EXECUTE FUNCTION private.check_exchange_request();
COMMENT ON TABLE public.exchange_requests IS 'Requests do not reserve a replacement or automatically restock returned shoes. Admin must inspect the actual returned pair before adjusting inventory.';
NOTIFY pgrst,'reload schema';

-- Checkout computes the delivery fee from current server settings.
CREATE OR REPLACE FUNCTION private.checkout_impl(p_shipping jsonb,p_shipping_cents integer,p_request_id uuid)
RETURNS TABLE(order_id uuid,order_number bigint,total_cents bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  uid uuid := auth.uid();
  new_order_id uuid;
  new_order_number bigint;
  subtotal bigint;
  delivery_fee integer;
  address jsonb;
  item record;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000'; END IF;
  IF p_request_id IS NULL THEN RAISE EXCEPTION 'Checkout request ID is required' USING ERRCODE='22023'; END IF;
  IF coalesce(p_shipping_cents,0)<>0 THEN RAISE EXCEPTION 'Delivery charges are calculated by the server' USING ERRCODE='22023'; END IF;
  INSERT INTO public.carts(user_id) VALUES(uid) ON CONFLICT DO NOTHING;
  -- The same cart lock is taken by all three cart mutations.
  PERFORM 1 FROM public.carts c WHERE c.user_id=uid FOR UPDATE;
  RETURN QUERY SELECT o.id,o.order_number,o.total_cents FROM public.orders o WHERE o.user_id=uid AND o.request_id=p_request_id;
  IF FOUND THEN RETURN; END IF;

  IF p_shipping IS NULL OR jsonb_typeof(p_shipping)<>'object' THEN RAISE EXCEPTION 'Enter a shipping address'; END IF;
  IF length(btrim(coalesce(p_shipping->>'full_name',''))) NOT BETWEEN 1 AND 150
     OR length(btrim(coalesce(p_shipping->>'line1',''))) NOT BETWEEN 1 AND 300
     OR length(btrim(coalesce(p_shipping->>'city',''))) NOT BETWEEN 1 AND 150
     OR length(btrim(coalesce(p_shipping->>'country',''))) NOT BETWEEN 1 AND 100
     OR length(coalesce(p_shipping->>'postal_code',''))>20 OR length(coalesce(p_shipping->>'phone',''))>30 THEN
    RAISE EXCEPTION 'Enter a valid name, street address, city and country' USING ERRCODE='22023';
  END IF;
  IF lower(btrim(p_shipping->>'country')) NOT IN ('pakistan','pk') THEN RAISE EXCEPTION 'Delivery is currently available in Pakistan'; END IF;
  IF btrim(coalesce(p_shipping->>'phone','')) !~ '^([+]92|0092|0)?[0-9 -]{9,15}$' THEN RAISE EXCEPTION 'Enter a valid delivery phone number'; END IF;
  address:=jsonb_build_object('full_name',btrim(p_shipping->>'full_name'),'line1',btrim(p_shipping->>'line1'),
    'city',btrim(p_shipping->>'city'),'country',btrim(p_shipping->>'country'),
    'postal_code',btrim(coalesce(p_shipping->>'postal_code','')),'phone',btrim(coalesce(p_shipping->>'phone','')));
  IF NOT EXISTS(SELECT 1 FROM public.cart_items ci WHERE ci.user_id=uid) THEN RAISE EXCEPTION 'Your bag is empty'; END IF;
  -- Freeze prices/publication state, then lock variant stock in a consistent order.
  PERFORM p.id FROM public.products p WHERE p.id IN (
    SELECT pv.product_id FROM public.product_variants pv JOIN public.cart_items ci ON ci.variant_id=pv.id WHERE ci.user_id=uid
  ) ORDER BY p.id FOR SHARE;
  PERFORM pv.id FROM public.product_variants pv JOIN public.cart_items ci ON ci.variant_id=pv.id
  WHERE ci.user_id=uid ORDER BY pv.id FOR UPDATE OF pv;
  FOR item IN SELECT ci.quantity,pv.stock,pv.active,p.status FROM public.cart_items ci
    JOIN public.product_variants pv ON pv.id=ci.variant_id JOIN public.products p ON p.id=pv.product_id WHERE ci.user_id=uid
  LOOP
    IF NOT item.active OR item.status<>'published' THEN RAISE EXCEPTION 'A piece in your bag is no longer available'; END IF;
    IF item.stock<item.quantity THEN RAISE EXCEPTION 'Insufficient stock for one or more items' USING ERRCODE='23514'; END IF;
  END LOOP;
  SELECT sum(p.price_cents::bigint*ci.quantity) INTO subtotal FROM public.cart_items ci
  JOIN public.product_variants pv ON pv.id=ci.variant_id JOIN public.products p ON p.id=pv.product_id WHERE ci.user_id=uid;
  delivery_fee:=public.quote_shipping(subtotal);
  IF delivery_fee IS NULL THEN RAISE EXCEPTION 'Delivery settings are unavailable'; END IF;
  INSERT INTO public.orders AS o(user_id,request_id,status,payment_status,subtotal_cents,shipping_cents,total_cents,shipping_address)
  VALUES(uid,p_request_id,'pending','unpaid',subtotal,delivery_fee,subtotal+delivery_fee,address)
  RETURNING o.id,o.order_number INTO new_order_id,new_order_number;
  INSERT INTO public.order_items(order_id,variant_id,product_name,color,size,image_path,unit_price_cents,quantity)
  SELECT new_order_id,pv.id,p.name,pv.color,pv.size,
    (SELECT im.path FROM public.product_images im WHERE im.product_id=p.id ORDER BY (lower(im.color)=lower(pv.color)) DESC NULLS LAST,im.position LIMIT 1),
    p.price_cents,ci.quantity FROM public.cart_items ci JOIN public.product_variants pv ON pv.id=ci.variant_id
    JOIN public.products p ON p.id=pv.product_id WHERE ci.user_id=uid;
  UPDATE public.product_variants pv SET stock=pv.stock-ci.quantity FROM public.cart_items ci WHERE ci.variant_id=pv.id AND ci.user_id=uid;
  INSERT INTO public.order_status_history(order_id,status) VALUES(new_order_id,'pending');
  DELETE FROM public.cart_items ci WHERE ci.user_id=uid;
  RETURN QUERY SELECT new_order_id,new_order_number,subtotal+delivery_fee;
END $$;

REVOKE ALL ON FUNCTION private.checkout_impl(jsonb,integer,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.checkout_impl(jsonb,integer,uuid) TO authenticated;
