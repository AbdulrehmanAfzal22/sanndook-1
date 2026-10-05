-- Role-aware brand checks against the new shoe database. All fixtures roll back.
BEGIN;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
DO $checks$
DECLARE
  qa_admin uuid:=gen_random_uuid(); qa_customer uuid:=gen_random_uuid();
  qa_brand uuid:=gen_random_uuid(); qa_product uuid:=gen_random_uuid();
  qa_variant uuid:=gen_random_uuid(); qa_category uuid; affected bigint;
  label text:='QA Brand '||gen_random_uuid();
BEGIN
  INSERT INTO auth.users(id,email) VALUES(qa_admin,qa_admin||'@example.invalid'),(qa_customer,qa_customer||'@example.invalid');
  INSERT INTO private.admin_members(user_id) VALUES(qa_admin);
  SELECT id INTO STRICT qa_category FROM public.categories WHERE slug='sneakers';
  PERFORM set_config('request.jwt.claim.sub',qa_admin::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',qa_admin,'role','authenticated')::text,true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  INSERT INTO public.brands(id,name,slug,departments) VALUES(qa_brand,label,'qa-'||qa_brand,ARRAY['men','women']);
  PERFORM public.save_shoe_product(jsonb_build_object('id',qa_product,'name','Rollback brand fixture','category_id',qa_category,
    'price_cents',500000,'status','draft','brand',lower(label),'department','men','condition','new','size_system','EU',
    'images','[]'::jsonb,'variants',jsonb_build_array(jsonb_build_object('id',qa_variant,'color','White','color_hex','#ffffff','size','42','stock',2,'sku','QA-'||qa_product))));
  IF NOT EXISTS(SELECT 1 FROM public.products WHERE id=qa_product AND brand_id=qa_brand AND brand=label) THEN RAISE EXCEPTION 'Product brand association failed'; END IF;
  UPDATE public.brands SET name=label||' Renamed',is_active=false WHERE id=qa_brand;
  IF NOT EXISTS(SELECT 1 FROM public.products WHERE id=qa_product AND brand=label||' Renamed') THEN RAISE EXCEPTION 'Atomic brand rename failed'; END IF;
  EXECUTE 'RESET ROLE';
  PERFORM set_config('request.jwt.claim.sub',qa_customer::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',qa_customer,'role','authenticated')::text,true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  IF EXISTS(SELECT 1 FROM public.brands WHERE id=qa_brand) THEN RAISE EXCEPTION 'Hidden brand visible to customer'; END IF;
  BEGIN INSERT INTO public.brands(name,slug) VALUES('Injected fixture','injected-'||qa_brand); RAISE EXCEPTION 'Customer inserted brand'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  UPDATE public.brands SET name='Injected rename' WHERE id=qa_brand;GET DIAGNOSTICS affected=ROW_COUNT;
  IF affected<>0 THEN RAISE EXCEPTION 'Customer renamed brand'; END IF;
  DELETE FROM public.brands WHERE id=qa_brand;GET DIAGNOSTICS affected=ROW_COUNT;
  IF affected<>0 THEN RAISE EXCEPTION 'Customer deleted brand'; END IF;
  BEGIN PERFORM access_token FROM public.instagram_private_connection; RAISE EXCEPTION 'Customer token access'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  EXECUTE 'RESET ROLE';
  PERFORM set_config('request.jwt.claim.sub','',true);PERFORM set_config('request.jwt.claims','{}',true);
  EXECUTE 'SET LOCAL ROLE anon';
  IF EXISTS(SELECT 1 FROM public.brands WHERE id=qa_brand) THEN RAISE EXCEPTION 'Hidden brand visible to anonymous visitor'; END IF;
  IF (SELECT count(*) FROM public.brands)<18 THEN RAISE EXCEPTION 'Public brand directory missing'; END IF;
  BEGIN PERFORM access_token FROM public.instagram_private_connection; RAISE EXCEPTION 'Anonymous token access'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  EXECUTE 'RESET ROLE';
  PERFORM set_config('request.jwt.claim.sub',qa_admin::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',qa_admin,'role','authenticated')::text,true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  IF NOT EXISTS(SELECT 1 FROM public.brands WHERE id=qa_brand) THEN RAISE EXCEPTION 'Admin cannot see hidden brand'; END IF;
  DELETE FROM public.brands WHERE id=qa_brand;
  IF NOT EXISTS(SELECT 1 FROM public.products WHERE id=qa_product AND brand_id IS NULL AND brand=label||' Renamed') THEN RAISE EXCEPTION 'Brand delete removed product label'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.product_variants WHERE id=qa_variant AND stock=2) THEN RAISE EXCEPTION 'Brand delete changed stock'; END IF;
  EXECUTE 'RESET ROLE';
END;
$checks$;
ROLLBACK;
SELECT 'Hosted brand access, save, rename, hide, delete and private-token checks passed; fixtures rolled back.' AS result;
