-- Customer details in the original administration portal include delivery
-- addresses. Only server-verified administrators may read other customers'
-- addresses; writes remain restricted to the owning customer.
CREATE POLICY addresses_admin_read ON public.addresses
  FOR SELECT TO authenticated
  USING ((SELECT private.is_admin()));
