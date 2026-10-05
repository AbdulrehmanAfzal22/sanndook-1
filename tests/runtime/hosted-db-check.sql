-- Privileged, rollback-only checks for the newly provisioned shoe project.
-- Fixtures are random UUIDs and never committed. This does not send email,
-- verify a real password/session, upload image bytes, or reset sequences.
BEGIN;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
DO $checks$
<<qa>>
DECLARE
 admin_id uuid:=gen_random_uuid(); buyer_id uuid:=gen_random_uuid(); other_id uuid:=gen_random_uuid();
 owner_id uuid:=gen_random_uuid(); category_id uuid; product_id uuid:=gen_random_uuid(); draft_id uuid:=gen_random_uuid();
 size42 uuid:=gen_random_uuid(); size43 uuid:=gen_random_uuid(); request_id uuid:=gen_random_uuid();
 order_id uuid; order_total bigint; item_id uuid; exchange_id uuid; review_id uuid; conversation_id uuid; ticket_id uuid;
 shipping jsonb:='{"full_name":"Rollback QA","line1":"QA only","city":"Lahore","country":"Pakistan","phone":"03001234567","total_cents":1}';
 payload jsonb; count_rows bigint;
BEGIN
 IF EXISTS(SELECT 1 FROM private.store_owner_setup WHERE user_id IS NOT NULL) THEN
  RAISE EXCEPTION 'Run initial hosted checks before the real owner claims the store';
 END IF;
 INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
  (admin_id,admin_id||'@example.invalid','{"full_name":"QA admin"}'),
  (buyer_id,buyer_id||'@example.invalid','{"full_name":"QA buyer"}'),
  (other_id,other_id||'@example.invalid','{"role":"admin","is_admin":true}'),
  (owner_id,'abdulrehmaan.afzal@gmail.com','{}');
 IF EXISTS(SELECT 1 FROM private.admin_members WHERE user_id IN(other_id,owner_id)) THEN
  RAISE EXCEPTION 'Unconfirmed email or client metadata granted admin';
 END IF;
 UPDATE auth.users SET email_confirmed_at=now() WHERE id=other_id;
 IF EXISTS(SELECT 1 FROM private.admin_members WHERE user_id=other_id) THEN RAISE EXCEPTION 'Wrong verified email granted admin'; END IF;
 UPDATE auth.users SET email_confirmed_at=now() WHERE id=owner_id;
 IF NOT EXISTS(SELECT 1 FROM private.store_owner_setup WHERE user_id=owner_id) OR
    NOT EXISTS(SELECT 1 FROM private.admin_members WHERE user_id=owner_id) THEN RAISE EXCEPTION 'Verified owner did not claim admin'; END IF;
 INSERT INTO private.admin_members(user_id) VALUES(admin_id);
 SELECT id INTO STRICT category_id FROM public.categories WHERE slug='sneakers';
 INSERT INTO public.products(id,category_id,name,description,price_cents,status,brand)
 VALUES(product_id,category_id,'Rollback QA Shoe','Uncommitted fixture',550000,'published','QA');
 INSERT INTO public.product_variants(id,product_id,color,size,stock) VALUES
  (size42,product_id,'White','42',2),(size43,product_id,'White','43',0);
 payload:=jsonb_build_object('id',draft_id,'name','QA draft','category_id',category_id,'price_cents',550000,
  'status','draft','brand','QA','department','unisex','condition','new','size_system','EU','images','[]'::jsonb,
  'variants',jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'color','White','color_hex','#ffffff','size','42.5','stock',1,'sku',draft_id::text)));

 PERFORM set_config('request.jwt.claim.sub',admin_id::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'role','authenticated')::text,true);
 EXECUTE 'SET LOCAL ROLE authenticated';
 IF public.save_shoe_product(payload)<>draft_id THEN RAISE EXCEPTION 'Admin draft save failed'; END IF;
 BEGIN UPDATE public.product_variants SET size='XL' WHERE id=size42; RAISE EXCEPTION 'Clothing size accepted'; EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN UPDATE public.products SET compare_at_cents=1 WHERE id=product_id; RAISE EXCEPTION 'Invalid sale price accepted'; EXCEPTION WHEN check_violation THEN NULL; END;
 EXECUTE 'RESET ROLE';

 PERFORM set_config('request.jwt.claim.sub',buyer_id::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',buyer_id,'role','authenticated')::text,true);
 EXECUTE 'SET LOCAL ROLE authenticated';
 IF public.is_admin() THEN RAISE EXCEPTION 'Customer has admin rights'; END IF;
 BEGIN PERFORM public.save_shoe_product(payload); RAISE EXCEPTION 'Customer product save succeeded'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 UPDATE public.products SET price_cents=1 WHERE id=product_id; GET DIAGNOSTICS count_rows=ROW_COUNT;
 IF count_rows<>0 THEN RAISE EXCEPTION 'Customer edited price'; END IF;
 UPDATE public.store_settings SET shipping_fee_cents=0; GET DIAGNOSTICS count_rows=ROW_COUNT;
 IF count_rows<>0 THEN RAISE EXCEPTION 'Customer edited delivery'; END IF;
 BEGIN PERFORM public.add_to_cart(size42,3); RAISE EXCEPTION 'Oversized bag accepted'; EXCEPTION WHEN check_violation THEN NULL; END;
 PERFORM public.add_to_cart(size42,1);
 INSERT INTO public.stock_notifications(user_id,variant_id) VALUES(buyer_id,size43);
 BEGIN INSERT INTO public.stock_notifications(user_id,variant_id) VALUES(other_id,size43); RAISE EXCEPTION 'Foreign stock alert accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 SELECT c.order_id,c.total_cents INTO order_id,order_total FROM public.checkout_order(shipping,request_id) c;
 IF order_total<>580000 OR NOT EXISTS(SELECT 1 FROM public.orders o WHERE o.id=order_id AND o.currency='PKR' AND NOT o.shipping_address?'total_cents') THEN RAISE EXCEPTION 'Server total/currency/address check failed'; END IF;
 IF (SELECT c.order_id FROM public.checkout_order(shipping,request_id) c)<>order_id OR
    (SELECT stock FROM public.product_variants WHERE id=size42)<>1 THEN RAISE EXCEPTION 'Idempotent retry failed'; END IF;
 EXECUTE 'RESET ROLE';

 PERFORM set_config('request.jwt.claim.sub',other_id::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',other_id,'role','authenticated')::text,true);
 EXECUTE 'SET LOCAL ROLE authenticated';
 IF EXISTS(SELECT 1 FROM public.orders o WHERE o.id=order_id) THEN RAISE EXCEPTION 'Order privacy failed'; END IF;
 BEGIN PERFORM public.submit_review(product_id,5,'No purchase'); RAISE EXCEPTION 'Non-purchaser review accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 PERFORM public.add_to_cart(size42,1);
 -- First buyer bought one of two pairs; make this competing bag exceed the remaining pair.
 BEGIN PERFORM public.set_cart_quantity(size42,2); RAISE EXCEPTION 'Stock cap update accepted'; EXCEPTION WHEN check_violation THEN NULL; END;
 EXECUTE 'RESET ROLE';

 PERFORM set_config('request.jwt.claim.sub',admin_id::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'role','authenticated')::text,true);
 EXECUTE 'SET LOCAL ROLE authenticated';
 BEGIN PERFORM public.delete_product(product_id); RAISE EXCEPTION 'Order-linked product deleted'; EXCEPTION WHEN foreign_key_violation THEN NULL; END;
 PERFORM public.set_order_status(order_id,'confirmed'); PERFORM public.set_order_status(order_id,'processing');
 PERFORM public.set_order_status(order_id,'shipped'); PERFORM public.set_order_status(order_id,'delivered');
 UPDATE public.product_variants SET stock=1 WHERE id=size43;
 EXECUTE 'RESET ROLE';

 PERFORM set_config('request.jwt.claim.sub',buyer_id::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',buyer_id,'role','authenticated')::text,true);
 EXECUTE 'SET LOCAL ROLE authenticated';
 SELECT oi.id INTO STRICT item_id FROM public.order_items oi WHERE oi.order_id=qa.order_id;
 INSERT INTO public.exchange_requests(user_id,order_item_id,replacement_variant_id,reason)
 VALUES(buyer_id,item_id,size43,'Prefer larger size') RETURNING id INTO exchange_id;
 UPDATE public.exchange_requests SET status='approved' WHERE id=exchange_id; GET DIAGNOSTICS count_rows=ROW_COUNT;
 IF count_rows<>0 THEN RAISE EXCEPTION 'Customer approved exchange'; END IF;
 review_id:=public.submit_review(product_id,5,'Delivered fixture review');
 IF NOT EXISTS(SELECT 1 FROM public.reviews WHERE id=review_id AND NOT approved AND status='pending' AND customer_name='QA buyer') THEN RAISE EXCEPTION 'Review verification failed'; END IF;
 conversation_id:=public.start_customer_support_conversation('QA fit question');
 IF public.start_customer_support_conversation('Second question')<>conversation_id THEN RAISE EXCEPTION 'Duplicate support thread created'; END IF;
 PERFORM public.send_customer_support_message(conversation_id,'EU 42 label');
 IF (SELECT count(*) FROM public.get_my_support_messages(conversation_id))<>3 THEN RAISE EXCEPTION 'Support messages failed'; END IF;
 ticket_id:=public.create_support_ticket('Size question','Please help',order_id);
 PERFORM public.add_support_message(ticket_id,'Fit details');
 IF (SELECT count(*) FROM public.support_ticket_messages m WHERE m.ticket_id=qa.ticket_id)<>2 THEN RAISE EXCEPTION 'Legacy ticket messages failed'; END IF;
 EXECUTE 'RESET ROLE';

 PERFORM set_config('request.jwt.claim.sub',other_id::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',other_id,'role','authenticated')::text,true);
 EXECUTE 'SET LOCAL ROLE authenticated';
 IF EXISTS(SELECT 1 FROM public.exchange_requests WHERE id=exchange_id) THEN RAISE EXCEPTION 'Foreign exchange visible'; END IF;
 BEGIN PERFORM public.send_customer_support_message(conversation_id,'Foreign reply'); RAISE EXCEPTION 'Foreign support reply accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.add_support_message(ticket_id,'Foreign ticket reply'); RAISE EXCEPTION 'Foreign ticket reply accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 EXECUTE 'RESET ROLE';

 PERFORM set_config('request.jwt.claim.sub',admin_id::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'role','authenticated')::text,true);
 EXECUTE 'SET LOCAL ROLE authenticated';
 UPDATE public.reviews SET status='approved' WHERE id=review_id;
 UPDATE public.exchange_requests SET status='approved' WHERE id=exchange_id;
 UPDATE public.exchange_requests SET status='completed' WHERE id=exchange_id;
 BEGIN UPDATE public.exchange_requests SET status='requested' WHERE id=exchange_id; RAISE EXCEPTION 'Closed exchange reopened'; EXCEPTION WHEN raise_exception THEN
  IF SQLERRM<>'This exchange request is closed' THEN RAISE; END IF;
 END;
 PERFORM public.admin_send_support_message(conversation_id,'Use brand chart');
 IF (SELECT count(*) FROM public.admin_get_support_messages(conversation_id))<>4 THEN RAISE EXCEPTION 'Admin support reply failed'; END IF;
 EXECUTE 'RESET ROLE';
 PERFORM set_config('request.jwt.claim.sub','',true); PERFORM set_config('request.jwt.claims','{}',true);
 EXECUTE 'SET LOCAL ROLE anon';
 IF (SELECT s.review_count FROM public.product_review_stats s WHERE s.product_id=qa.product_id) IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'Approved public rating failed'; END IF;
 IF public.quote_shipping(1200000)<>0 OR public.quote_shipping(550000)<>30000 THEN RAISE EXCEPTION 'Shipping thresholds failed'; END IF;
 EXECUTE 'RESET ROLE';
 IF EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND NOT rowsecurity) THEN RAISE EXCEPTION 'Missing RLS'; END IF;
 IF EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prosecdef) THEN RAISE EXCEPTION 'Exposed privileged function'; END IF;
 IF has_function_privilege('anon','public.checkout_order(jsonb,uuid)','EXECUTE') OR
    has_function_privilege('anon','public.save_shoe_product(jsonb)','EXECUTE') THEN RAISE EXCEPTION 'Anonymous write grants'; END IF;
END $checks$;
ROLLBACK;
SELECT 'Hosted commerce and role checks passed; all fixture rows rolled back' AS result;
