-- Editable shoe-brand categories, shared by Men, Women and Kids.
CREATE TABLE public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (name = btrim(name) AND char_length(name) BETWEEN 1 AND 80),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) <= 100),
  departments text[] NOT NULL DEFAULT ARRAY['men','women','kids']::text[]
    CHECK (cardinality(departments) > 0 AND departments <@ ARRAY['men','women','kids']::text[]),
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order BETWEEN 0 AND 10000),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX brands_name_ci_unique ON public.brands (lower(name));
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.brands FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.brands TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.brands TO authenticated;
GRANT ALL ON public.brands TO service_role;
CREATE POLICY brands_read ON public.brands FOR SELECT TO anon, authenticated
  USING (is_active OR (SELECT private.is_admin()));
CREATE POLICY brands_admin_insert ON public.brands FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY brands_admin_update ON public.brands FOR UPDATE TO authenticated
  USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY brands_admin_delete ON public.brands FOR DELETE TO authenticated
  USING ((SELECT private.is_admin()));

INSERT INTO public.brands (name, slug, sort_order) VALUES
  ('Nike','nike',10),('Adidas','adidas',20),('Puma','puma',30),
  ('New Balance','new-balance',40),('ASICS','asics',50),('Reebok','reebok',60),
  ('Converse','converse',70),('Vans','vans',80),('Skechers','skechers',90),
  ('Under Armour','under-armour',100),('On','on',110),('HOKA','hoka',120),
  ('Gucci','gucci',130),('Balenciaga','balenciaga',140),('Prada','prada',150),
  ('Clarks','clarks',160),('Timberland','timberland',170),('Crocs','crocs',180);

-- Keep the original text-brand contract used by product save, search and history.
ALTER TABLE public.products ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;
CREATE INDEX products_brand_id_idx ON public.products(brand_id);
UPDATE public.products p SET brand_id=b.id, brand=b.name
  FROM public.brands b WHERE lower(btrim(p.brand))=lower(b.name);

CREATE FUNCTION private.link_product_brand() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE brand_row public.brands;
BEGIN
  -- FK deletion clears the category association but preserves the shoe's brand label.
  IF TG_OP='UPDATE' AND NEW.brand_id IS DISTINCT FROM OLD.brand_id
     AND NEW.brand IS NOT DISTINCT FROM OLD.brand THEN
    IF NEW.brand_id IS NULL THEN RETURN NEW; END IF;
    SELECT * INTO brand_row FROM public.brands WHERE id=NEW.brand_id;
  ELSE
    SELECT * INTO brand_row FROM public.brands WHERE lower(name)=lower(btrim(NEW.brand));
  END IF;
  IF FOUND THEN NEW.brand_id=brand_row.id; NEW.brand=brand_row.name;
  ELSE NEW.brand_id=NULL; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER products_link_brand BEFORE INSERT OR UPDATE OF brand,brand_id ON public.products
  FOR EACH ROW EXECUTE FUNCTION private.link_product_brand();

CREATE FUNCTION private.rename_brand_products() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    UPDATE public.products SET brand=NEW.name WHERE brand_id=NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER brands_rename_products AFTER UPDATE OF name ON public.brands
  FOR EACH ROW EXECUTE FUNCTION private.rename_brand_products();

CREATE FUNCTION private.touch_brand() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN NEW.updated_at=now(); RETURN NEW; END;
$$;
CREATE TRIGGER brands_updated_at BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION private.touch_brand();
REVOKE ALL ON FUNCTION private.link_product_brand(), private.rename_brand_products(), private.touch_brand() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.link_product_brand(), private.rename_brand_products(), private.touch_brand() TO authenticated, service_role;
