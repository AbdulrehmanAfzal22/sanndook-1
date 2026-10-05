# Final verification — 5 October 2026

The current release's authoritative results and limits are in [docs/TEST_RESULTS.md](./docs/TEST_RESULTS.md). The real hosted run is recorded in [docs/ADMIN_VERIFICATION.json](./docs/ADMIN_VERIFICATION.json): **41 checks passed**, with all temporary users, sessions, memberships, products, categories and uploads removed. The existing verified owner remains.

| Check | Final result |
| --- | --- |
| Unit/regression checks | 55 passed |
| Local database checks; all 31 migrations | 49 passed |
| Demo UI checks | 62 passed |
| Connected UI checks with mocked HTTP | 24 passed |
| Private admin/account UI checks with mocked HTTP | 28 passed |
| Brand/Instagram management UI checks | 9 passed |
| Actual Instagram handler with mocked provider | 17 passed |
| Hosted Instagram function v4 | Public feed HTTP 200; anonymous admin status HTTP 401 |
| Real hosted Auth/REST/RPC/Storage integration | 41 passed; fixtures cleaned |
| Production build | Passed |

The Supabase project is shoe (ipqcxqsjzkbtxpljvdcy) in the newly attached account. Its real catalog currently has no products or orders, with seven categories and eighteen brands. Sixty local demo concepts are kept separate from the live database. The account/admin studio uses real Auth and server-controlled administrator membership.

Browser visual rendering and checkout, confirmation/recovery email delivery and actual Instagram provider sync remain unverified. Instagram needs the store's own eligible account/token; no real credential was supplied. Its public rail and private token connection have been checked with isolated provider responses. The existing owner-private site audience is preserved.

The earlier [BACKEND_HEALTH.json](./docs/BACKEND_HEALTH.json) is a dated historical run, not the current user-count snapshot. See [the admin guide](./docs/ADMIN_PORTAL.md), [landing changes](./docs/LANDING_UPGRADE.md) and [Instagram connection instructions](./docs/INSTAGRAM_FEED_SETUP.md).
