-- Keep one SELECT policy to avoid running two permissive policies for every
-- customer-address read. Administrator access remains read-only.
DROP POLICY addresses_admin_read ON public.addresses;
DROP POLICY addresses_owner ON public.addresses;
CREATE POLICY addresses_read ON public.addresses FOR SELECT TO authenticated
  USING (user_id=(SELECT auth.uid()) OR (SELECT private.is_admin()));
CREATE POLICY addresses_insert_owner ON public.addresses FOR INSERT TO authenticated
  WITH CHECK (user_id=(SELECT auth.uid()));
CREATE POLICY addresses_update_owner ON public.addresses FOR UPDATE TO authenticated
  USING (user_id=(SELECT auth.uid())) WITH CHECK (user_id=(SELECT auth.uid()));
CREATE POLICY addresses_delete_owner ON public.addresses FOR DELETE TO authenticated
  USING (user_id=(SELECT auth.uid()));
