# Separate shoe backend

Hosted project: **shoe**, reference `ipqcxqsjzkbtxpljvdcy`, region `ap-south-1`, in the newly attached AbdulRehman Afzal account. All 31 migrations, seven empty shoe/care categories and 18 managed brand categories are deployed. Source filenames match the hosted migration ledger, so future CLI pushes do not repeat the initial installation.

The migration history retains the original public RPC contracts and repairs omitted support foundations, renamed ticket-message functions, category accessory flags, review metadata and secure review statistics. Never apply it to an existing clothing database.

## Owner access

The user selected `abdulrehmaan.afzal@gmail.com` for owner login. This owner identity is now registered, email-verified and present in the private administrator membership table. Sign in using the existing account. A server trigger binds the single private owner slot to the first confirmed identity for that exact address and adds its UUID to `private.admin_members`. Customer role metadata and unconfirmed signups cannot grant admin access. A later identity cannot claim a second slot. No existing user, owner claim or password was changed during this upgrade. Open `/admin?catalog=live` to use the actual backend; `/admin?catalog=demo` is read-only.

Owner configuration and admin membership are private, RLS protected, and inaccessible to browser roles. Keep `private` out of exposed Data API schemas. Existing default hosted schemas do not expose it; local configuration exposes only `public`.

## Remaining hosted Auth settings

Dashboard sign-in blocked the remaining configuration; the secure sign-in attempt did not complete. Database migrations do not configure hosted GoTrue settings. In the shoe project's Authentication → URL Configuration, use:

| Setting | Value |
|---|---|
| Site URL | `https://soleform-shoe-store.drsagheer381.chatgpt.site` |
| Login redirect, including the encoded return destination | `https://soleform-shoe-store.drsagheer381.chatgpt.site/login*` |
| Password recovery redirect | `https://soleform-shoe-store.drsagheer381.chatgpt.site/reset-password` |
| Local login redirect | `http://localhost:4173/login*` |
| Local recovery redirect | `http://localhost:4173/reset-password` |

Keep email confirmations enabled. The login pattern is restricted to this exact origin and route prefix; it permits the frontend's returnTo query parameter. See [Supabase redirect documentation](https://supabase.com/docs/guides/auth/redirect-urls). Verify confirmation and recovery emails before opening orders. Production customer email delivery requires a suitable SMTP provider and its credentials; none was provided or silently configured.

The frontend already uses `src/config/backend.public.json`, containing only the new public URL and modern publishable key. Both can be overridden at build time. No service-role key belongs in the frontend.

## Footwear schema

`products`: brand, condition/notes, EU/UK/US-M/US-W size system, width, material, fit note and previous price. `product_variants`: unique optional SKU plus exact size, colour, active flag and stock. Whole/half shoe sizes are validated; accessory categories can use one-size labels.

`brands`: case-insensitive unique name, address, department array, display order and visibility. All 18 initial brands appear in Men, Women and Kids; admins can change these assignments. Browser visitors can only read active categories. Customers cannot write. `products.brand_id` optionally links the managed category while retaining the original `brand` text contract. Triggers normalize managed brand names and propagate admin renames. Deleting a category clears only this reference and preserves the shoe label, variants and order history.

Instagram tokens remain inaccessible to both anonymous and authenticated browser roles. Only the Edge Function's server client can read the connection. Token actions verify the actual Auth user and admin membership before contacting Instagram. Unknown manual expiry stays NULL; the admin can replace an expired token. OAuth and known-expiry connections retain token refresh support. See `INSTAGRAM_FEED_SETUP.md`.

`save_shoe_product(jsonb)` checks admin authorization and retains the transactional save contract. Published shoes require brand/condition details, images, description and variants. Preloved variants contain at most one actual pair. Previous prices must exceed current prices. Price edits and SKU swaps are atomic.

`store_settings`: delivery fee, free-delivery threshold and exchange window. Defaults: PKR 300, PKR 12,000 and seven days. Admins can edit; visitors can read.

`stock_notifications`: one customer request per variant, with customer availability and admin inbox views. Automatic emails are not configured.

`exchange_requests`: one request per delivered item, optional available replacement size of the same product, reason and controlled status. The server validates ownership and the delivery window. Approval does not reserve inventory; returns need manual inspection/restocking. No automatic refunds are issued.

Checkout locks the cart, revalidates exact size stock and publication, computes PKR totals/delivery, sanitizes the Pakistan address and deduplicates by request UUID. Manual COD payment records remain; no card/wallet gateway is implemented.

Reviews require delivered purchases and start pending. The server derives the customer name; admins control moderation. Public statistics respect RLS. Support conversations and order-linked tickets retain ownership/admin checks.

## Access and verification

Every public table has RLS. The eleven named support/catalog security-definer RPCs have private implementations and public invoker wrappers, preserving their arguments and grants. The migration does not sweep unrelated functions/tables. Support thread repair never deletes or reassigns messages; it fails for duplicate customer threads so an operator can review them explicitly.

Hosted rollback-only checks passed for owner verification, admin/customer writes, numeric sizes, price constraints, cart limits, PKR checkout, retries, stock decrement, order privacy, stock requests, delivered exchanges, moderation and private support/tickets. No fixture rows remained. An additional 45 live HTTP checks verified actual GoTrue password/session refresh, Data API permissions, product-image upload/upsert/public read, product saves, carts, PKR checkout/retries/stock revalidation and private customer/admin support. Three temporary fixture users, one product, one unpaid order and their sessions/uploads were cleaned. Email delivery/redirect configuration and browser checkout remain unverified. See `TEST_RESULTS.md`, `ADMIN_VERIFICATION.json` and the dated earlier `BACKEND_HEALTH.json` snapshot.

Before customer launch, complete Auth/email settings, add accurate real inventory/photographs, verify checkout through the deployed UI, and intentionally choose customer-facing site access. Current owner-private access is preserved.

The Auth advisor reports leaked-password protection disabled. [This feature requires Pro or above](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection); the new Free project remains on its requested plan.

The complete admin portal now enters live mode even after demo navigation. Review rejection/spam persists; paid sales trends, top shoes and collection revenue use actual order-item snapshots and variant-to-product joins. Customer details include saved addresses through read-only admin RLS access. See `ADMIN_PORTAL.md`.
