-- The owner selected this email in the setup conversation. Only a confirmed
-- Auth identity can claim the single owner slot. Client metadata is ignored.
CREATE TABLE private.store_owner_setup (
 id boolean PRIMARY KEY DEFAULT true CHECK(id),
 email text NOT NULL CHECK(email=lower(btrim(email))),
 user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE private.store_owner_setup ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.store_owner_setup FROM PUBLIC,anon,authenticated;
INSERT INTO private.store_owner_setup(id,email) VALUES(true,'abdulrehmaan.afzal@gmail.com');

CREATE FUNCTION private.claim_verified_store_owner() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE claimed boolean;
BEGIN
 IF NEW.email_confirmed_at IS NULL THEN RETURN NEW; END IF;
 UPDATE private.store_owner_setup
 SET user_id=NEW.id
 WHERE id AND user_id IS NULL AND email=lower(btrim(NEW.email))
 RETURNING id INTO claimed;
 IF claimed OR EXISTS(SELECT 1 FROM private.store_owner_setup WHERE user_id=NEW.id) THEN
  INSERT INTO private.admin_members(user_id) VALUES(NEW.id) ON CONFLICT DO NOTHING;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.claim_verified_store_owner() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER claim_verified_store_owner
 AFTER INSERT OR UPDATE OF email,email_confirmed_at ON auth.users
 FOR EACH ROW EXECUTE FUNCTION private.claim_verified_store_owner();

-- Cover the specific foreign keys identified by the hosted advisor.
CREATE INDEX instagram_oauth_admin_idx ON public.instagram_oauth_states(admin_user_id);
CREATE INDEX instagram_reels_product_idx ON public.instagram_reels(product_id);
CREATE INDEX reviews_user_idx ON public.reviews(user_id);
CREATE INDEX support_ticket_messages_sender_idx ON public.support_ticket_messages(sender_id);

-- Cache identity/admin checks once per statement, preserving ownership rules.
ALTER POLICY reviews_read ON public.reviews USING(approved OR user_id=(SELECT auth.uid()) OR (SELECT private.is_admin()));
ALTER POLICY reviews_admin_delete ON public.reviews USING((SELECT private.is_admin()));
ALTER POLICY order_items_read ON public.order_items USING(EXISTS(
 SELECT 1 FROM public.orders o WHERE o.id=order_items.order_id AND (o.user_id=(SELECT auth.uid()) OR (SELECT private.is_admin()))
));
ALTER POLICY history_read ON public.order_status_history USING(EXISTS(
 SELECT 1 FROM public.orders o WHERE o.id=order_status_history.order_id AND (o.user_id=(SELECT auth.uid()) OR (SELECT private.is_admin()))
));
ALTER POLICY tickets_read ON public.support_tickets USING(user_id=(SELECT auth.uid()) OR (SELECT private.is_admin()));
ALTER POLICY tickets_admin_update ON public.support_tickets USING((SELECT private.is_admin())) WITH CHECK((SELECT private.is_admin()));
ALTER POLICY messages_read ON public.support_ticket_messages USING(EXISTS(
 SELECT 1 FROM public.support_tickets t WHERE t.id=support_ticket_messages.ticket_id AND (t.user_id=(SELECT auth.uid()) OR (SELECT private.is_admin()))
));

-- Replace overlapping ALL policies with the same admin write checks for each
-- mutation. Existing SELECT policies already include the admin read condition.
DROP POLICY categories_admin ON public.categories;
CREATE POLICY categories_admin_insert ON public.categories FOR INSERT TO authenticated WITH CHECK((SELECT private.is_admin()));
CREATE POLICY categories_admin_update ON public.categories FOR UPDATE TO authenticated USING((SELECT private.is_admin())) WITH CHECK((SELECT private.is_admin()));
CREATE POLICY categories_admin_delete ON public.categories FOR DELETE TO authenticated USING((SELECT private.is_admin()));
DROP POLICY products_admin ON public.products;
CREATE POLICY products_admin_insert ON public.products FOR INSERT TO authenticated WITH CHECK((SELECT private.is_admin()));
CREATE POLICY products_admin_update ON public.products FOR UPDATE TO authenticated USING((SELECT private.is_admin())) WITH CHECK((SELECT private.is_admin()));
CREATE POLICY products_admin_delete ON public.products FOR DELETE TO authenticated USING((SELECT private.is_admin()));
DROP POLICY images_admin ON public.product_images;
CREATE POLICY images_admin_insert ON public.product_images FOR INSERT TO authenticated WITH CHECK((SELECT private.is_admin()));
CREATE POLICY images_admin_update ON public.product_images FOR UPDATE TO authenticated USING((SELECT private.is_admin())) WITH CHECK((SELECT private.is_admin()));
CREATE POLICY images_admin_delete ON public.product_images FOR DELETE TO authenticated USING((SELECT private.is_admin()));
DROP POLICY variants_admin ON public.product_variants;
CREATE POLICY variants_admin_insert ON public.product_variants FOR INSERT TO authenticated WITH CHECK((SELECT private.is_admin()));
CREATE POLICY variants_admin_update ON public.product_variants FOR UPDATE TO authenticated USING((SELECT private.is_admin())) WITH CHECK((SELECT private.is_admin()));
CREATE POLICY variants_admin_delete ON public.product_variants FOR DELETE TO authenticated USING((SELECT private.is_admin()));
DROP POLICY instagram_reels_admin_write ON public.instagram_reels;
CREATE POLICY instagram_reels_admin_insert ON public.instagram_reels FOR INSERT TO authenticated WITH CHECK((SELECT private.is_admin()));
CREATE POLICY instagram_reels_admin_update ON public.instagram_reels FOR UPDATE TO authenticated USING((SELECT private.is_admin())) WITH CHECK((SELECT private.is_admin()));
CREATE POLICY instagram_reels_admin_delete ON public.instagram_reels FOR DELETE TO authenticated USING((SELECT private.is_admin()));
DROP POLICY support_requests_admin_read ON public.support_requests;
NOTIFY pgrst,'reload schema';
