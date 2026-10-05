# Open your shoe store

The existing SOLEFORM frontend is connected to the new `shoe` Supabase project (`ipqcxqsjzkbtxpljvdcy`). All 29 migrations, seven empty shoe/care categories and 18 managed brands are deployed.

Run `npm ci` and `npm run dev`, then open http://localhost:4173. The source includes the new project's public client configuration; no privileged key or default password is included.

Owner email: `abdulrehmaan.afzal@gmail.com`, as selected during setup. Register and verify that email to claim the owner/admin slot, then open `/admin` to add real pairs, exact sizes, stock and photographs. Other customers cannot claim this slot.

**Remaining dashboard step:** Supabase Auth URL settings and email delivery need verification. The dashboard required sign-in and the secure sign-in attempt did not complete. Intended settings are in `docs/SHOE_BACKEND.md` and `supabase/config.toml`. Do not open customer orders until Auth, recovery and image uploads have been checked end to end.

To explore the demonstration catalog separately, set `VITE_STORE_PREVIEW=true` in `.env.local`. This disables accounts/orders and uses local sample records. Normal production mode reads only the real database, which currently contains no products.
