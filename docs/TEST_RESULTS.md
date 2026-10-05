# Verification — account and admin upgrade

Date: 2026-10-05. Target: Supabase `shoe` / `ipqcxqsjzkbtxpljvdcy`.

| Suite | Result | Scope |
| --- | --- | --- |
| `npm test` | 55 passed | Shoe/cart/catalog validation, UTC paid analytics and revenue snapshots |
| `npm run test:db` | 49 passed | All 31 migrations in PGlite; roles, RLS, owner bootstrap, checkout, inventory, exchanges, reviews and support |
| `npm run test:ui` | 62 passed | Demo interactions, middle-of-page public Instagram, commerce isolation, forced-offline preview and demo-to-live boundaries |
| `npm run test:connected` | 24 passed | Supabase HTTP mocked in process; Auth forms, empty/error states and Instagram Reels/photos/albums, playback, metrics and image fallbacks |
| `npm run test:admin` | 28 passed | Protected studio/account routes; compiled CSS palette checks; server-role login redirects, customer denial, saved addresses, review persistence, orders, settings and product form with mocked HTTP |
| `npm run test:management` | 9 passed | Isolated brand management, private token form and environment-managed account controls |
| `npm run test:instagram` | 17 passed | Actual Edge handler with mocked provider; admin permission, private tokens, mixed-media sync/cache, environment activation/discovery/disable/removal and credential privacy |
| Hosted Instagram function v4 | Passed | Public unconnected feed HTTP 200; anonymous admin status HTTP 401; no provider credential supplied |
| `npm run build` | Passed | Production Vite compilation and local asset bundle |
| Hosted frontend-service integration | 41 passed | Real GoTrue, PostgREST, Storage and RPC calls with temporary random fixture identities; see `ADMIN_VERIFICATION.json` |

The hosted integration scripts are opt-in. They receive ephemeral credentials only over stdin, never from a committed file or command-line argument. The management connector provisions/removes the exact temporary fixtures. They are intentionally excluded from `npm test`. Final cleanup was verified: zero fixture users, admin memberships, sessions, products, categories or uploads remain. The existing verified owner and two real Auth users remain; there is one administrator, seven categories and eighteen brands. The live catalog has no real products or orders yet.

The admin suite loads the compiled production stylesheet and checks cream account/admin backgrounds, the sage sidebar, readable dark account text and lime actions. It verifies administrator and customer password-sign-in destinations using the actual session provider and route guards with mocked HTTP. The public footer no longer exposes the studio link. Source CSS inspection also confirmed white cards and light input fields. The login uses a local shoe photograph through a normal image element, and the legacy clothing/auth overlay styles were removed. This CSS inspection is not a browser screenshot or layout test.

DOM testing does not render a browser. jsdom records the live-entry reload attempt and accessible fallback href but cannot execute full-document navigation. Real browser screenshots, live-browser checkout, actual Instagram provider authorization and SMTP delivery were not tested. Tests do not establish those outcomes.

The Supabase advisor's private/server-only no-policy INFO entries are deliberate deny-by-default tables. Leaked-password protection remains a Free-plan Auth warning: [Supabase password-security documentation](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). No paid-plan change was made. Unused indexes on a new store are retained for their intended query paths: [advisor reference](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).
