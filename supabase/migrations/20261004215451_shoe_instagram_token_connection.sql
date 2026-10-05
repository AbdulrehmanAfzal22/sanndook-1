-- A manually supplied Instagram token may not include a known expiry.
-- Unknown expiry stays NULL; no invented expiry or browser-readable credentials.
ALTER TABLE public.instagram_private_connection ALTER COLUMN token_expires_at DROP NOT NULL;
COMMENT ON COLUMN public.instagram_private_connection.token_expires_at IS
  'Provider expiry when known. NULL for a manually supplied token with unknown expiry.';
