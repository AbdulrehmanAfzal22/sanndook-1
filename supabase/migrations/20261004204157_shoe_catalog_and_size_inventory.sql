-- Footwear extension: preserve all original commerce tables and RPC contracts.
ALTER TABLE public.products
 ADD COLUMN brand text NOT NULL DEFAULT '' CHECK(length(brand)<=80),
 ADD COLUMN condition text NOT NULL DEFAULT 'new' CHECK(condition IN('new','store_returns','premium','excellent','good')),
 ADD COLUMN condition_notes text NOT NULL DEFAULT '' CHECK(length(condition_notes)<=2000),
 ADD COLUMN size_system text NOT NULL DEFAULT 'EU' CHECK(size_system IN('EU','UK','US-M','US-W')),
 ADD COLUMN width text NOT NULL DEFAULT 'standard' CHECK(width IN('narrow','standard','wide')),
 ADD COLUMN material text NOT NULL DEFAULT '' CHECK(length(material)<=120),
 ADD COLUMN fit_note text NOT NULL DEFAULT '' CHECK(length(fit_note)<=1000),
 ADD COLUMN compare_at_cents integer CHECK(compare_at_cents IS NULL OR compare_at_cents>price_cents);
ALTER TABLE public.product_variants ADD COLUMN sku text CHECK(length(sku)<=80);
CREATE UNIQUE INDEX shoe_variant_sku_uidx ON public.product_variants(lower(sku)) WHERE sku IS NOT NULL;
CREATE INDEX shoe_brand_status_idx ON public.products(brand,status);
CREATE INDEX shoe_condition_status_idx ON public.products(condition,status);
CREATE INDEX shoe_size_instock_idx ON public.product_variants(size,product_id) WHERE active AND stock>0;

CREATE FUNCTION private.check_shoe_variant() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE c text; accessory boolean;
BEGIN
 SELECT p.condition,coalesce(cat.is_accessory,false) INTO c,accessory FROM public.products p
 LEFT JOIN public.categories cat ON cat.id=p.category_id WHERE p.id=NEW.product_id;
 IF NOT accessory THEN
  IF NEW.size !~ '^[0-9]{1,2}([.]5)?$' OR NEW.size::numeric<=0 OR NEW.size::numeric>55 THEN
   RAISE EXCEPTION 'Use numeric shoe sizes with optional half sizes' USING ERRCODE='23514';
  END IF;
  IF c IN('premium','excellent','good') AND NEW.active AND NEW.stock>1 THEN
   RAISE EXCEPTION 'A preloved variant represents one actual pair; stock cannot exceed one' USING ERRCODE='23514';
  END IF;
 END IF;
 NEW.sku:=nullif(btrim(NEW.sku),'');
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.check_shoe_variant() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER shoe_variant_validation BEFORE INSERT OR UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION private.check_shoe_variant();

CREATE FUNCTION public.save_shoe_product(payload jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE pid uuid; item jsonb; c text:=coalesce(payload->>'condition','new');
BEGIN
 IF auth.uid() IS NULL OR NOT private.is_admin() THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE='42501'; END IF;
 IF payload->>'status'='published' AND length(btrim(coalesce(payload->>'brand','')))=0 THEN RAISE EXCEPTION 'Enter the shoe brand'; END IF;
 IF payload->>'status'='published' AND c<>'new' AND length(btrim(coalesce(payload->>'condition_notes','')))=0 THEN RAISE EXCEPTION 'Describe the condition of this pair'; END IF;
 IF c IN('premium','excellent','good') AND EXISTS(SELECT 1 FROM jsonb_array_elements(payload->'variants') v WHERE (v->>'stock')::integer>1) THEN
  RAISE EXCEPTION 'Preloved stock cannot exceed one per actual pair';
 END IF;
 -- Clear the old sale comparison before the base save updates its price.
 -- Validation failures roll back this entire function, including this update.
 UPDATE public.products SET condition=c,compare_at_cents=NULL WHERE id=(payload->>'id')::uuid;
 pid:=public.save_product(payload);
 UPDATE public.products SET brand=btrim(coalesce(payload->>'brand','')),condition=c,
  condition_notes=coalesce(payload->>'condition_notes',''),size_system=coalesce(payload->>'size_system','EU'),
  width=coalesce(payload->>'width','standard'),material=coalesce(payload->>'material',''),fit_note=coalesce(payload->>'fit_note',''),
  compare_at_cents=nullif(payload->>'compare_at_cents','')::integer WHERE id=pid;
 -- Permit swapping two existing SKUs within the same atomic save.
 UPDATE public.product_variants SET sku=NULL WHERE product_id=pid
  AND id IN(SELECT (v->>'id')::uuid FROM jsonb_array_elements(payload->'variants') v);
 FOR item IN SELECT * FROM jsonb_array_elements(payload->'variants') LOOP
  UPDATE public.product_variants SET sku=nullif(btrim(item->>'sku'),'') WHERE id=(item->>'id')::uuid AND product_id=pid;
 END LOOP;
 RETURN pid;
END $$;
REVOKE ALL ON FUNCTION public.save_shoe_product(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_shoe_product(jsonb) TO authenticated;
NOTIFY pgrst,'reload schema';
