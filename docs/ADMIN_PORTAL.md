# SOLEFORM store studio

The original `maison-elan(4).zip` administration and commerce services are retained and adapted for shoes. The connected project is **shoe**, `ipqcxqsjzkbtxpljvdcy`, in the newly attached account. No project named Sugar appeared in that account; the existing footwear project and its verified owner were preserved. No second store project was created.

## Entry and account flow

Open [the live admin portal](https://soleform-shoe-store.drsagheer381.chatgpt.site/admin?catalog=live) and sign in with the existing verified store-owner account. Customer accounts cannot enter the private studio. Administrator authorization comes from server-controlled membership through `is_admin()`, including inside database operations. User-editable account metadata cannot grant this role.

The public footer has no admin link. After a normal sign-in, a server-authorized administrator opens the dashboard; customers open their account. An explicitly requested destination is preserved. Administrators can also use the account studio shortcut or the signed-in mobile-menu entry. Navigating from the demo catalog into a private route reloads in live mode to initialize the authenticated SDK. Only explicit `?catalog=demo` opens the read-only catalog preview. Demo commerce keeps its own favourites/bag and does not call live commerce or Auth services; the public Instagram feed is independent of catalog mode.

The account and studio share the storefront cream background, sage navigation, white cards and dark readable text, with lime primary actions. The obsolete dark account styles and admin palette overrides have been removed.

The account page offers orders, saved pairs, exchanges, profile editing, create/edit/remove delivery addresses, stock subscriptions, support, recovery and sign-out. Administrators also get a prominent studio shortcut. Actions show visible success/error feedback and refresh saved data. Pakistan is the new-address default.

### Requested account access

Read-only checks on 5 October 2026 found both requested accounts email-verified. `abdulrehmaan.afzal@gmail.com` already has administrator membership. `abdulrehmanafzal60@gmail.com` remains a customer account: automatic approval review rejected the additional administrator grant because authorization for that extra account was not considered clear. No grant or schema change was applied. Administrator membership must be granted server-side after approval; entering an email or editing user metadata cannot enable it.

## Complete administration

| Section | Connected behavior |
| --- | --- |
| Dashboard | Paid PKR revenue, real record counts, per-size low-stock/sold-out totals, useful shortcuts |
| Products | Create/edit drafts, photo uploads, publication, archive and permanent deletion of unreferenced products |
| Collections | Create/edit/hide/delete shoe collections; collection images and display order |
| Brands | 18 editable brand categories, per-department availability, renaming and deletion preserving product history |
| Accessories | Original accessory grouping and product management with one-size support |
| Inventory | Exact size, colour, SKU and size system; stock editing rejects stale concurrent saves |
| Orders | Delivery addresses, item snapshots, fulfillment history, controlled status changes and manual COD payment records |
| Customers | Names, email, order activity and on-demand saved-address/order details |
| Analytics | Six monthly paid-sales totals, top pairs and collection revenue; unpaid/refunded records excluded |
| Reviews | Approve/reject/spam/delete; status remains correct after refreshing and public feedback respects approval |
| Support | Auth-linked customer conversations and admin inbox/replies with customer privacy |
| Instagram Reels & posts | Original admin connection, token/OAuth support, mixed-media feed refresh, visibility, layout and per-post shop links |
| Stock alerts | Customer subscriptions to exact shoe-size variants and admin availability inbox |
| Size exchanges | Delivered-purchase ownership/window checks; replacement availability and controlled review/completion |
| Delivery settings | PKR delivery fee, free-delivery threshold and exchange-request window |

Products referenced by orders must be archived; their history cannot be permanently deleted. Deleting a brand retains its products. Payment status changes update COD records and do not charge or refund money. Exchange approval does not automatically reserve or adjust physical stock.

Monthly revenue includes recorded delivery charges. Pair/collection rankings use order-item snapshot price times quantity and exclude delivery. Current variant/product/collection links group the sales; missing historical links have an explicit archived/uncategorized group. Empty stores show honest zero/empty states.

## Backend and verification

All 31 source migrations are deployed. New address policies allow administrators to read customer delivery details while keeping writes restricted to each owning customer. A single SELECT policy combines the read conditions; the performance-advisor duplicate-policy warning was resolved. All exposed tables retain RLS. Private owner/admin configuration and Instagram credentials remain inaccessible through the browser API.

`ADMIN_VERIFICATION.json` records 41 passing actual calls through the frontend services to hosted Auth, REST, RPC and Storage. `TEST_RESULTS.md` distinguishes those checks from isolated DOM, database and provider-mock suites. All temporary fixture users, sessions, memberships, products, categories and uploads were verified removed using only their exact generated identities and object folders. Existing owner/customer records remain.

Browser visual rendering and deployed-browser checkout are not verified in this managed environment. Instagram requires the owner's real account/token; provider calls are covered by isolated tests, without impersonating a real Instagram account. SMTP delivery/recovery-email configuration remains outside the verified checks. The current owner is already email-verified and has administrator membership. Hosting keeps its existing private audience.
