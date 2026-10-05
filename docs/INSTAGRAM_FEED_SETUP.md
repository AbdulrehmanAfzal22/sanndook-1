# Connect your store Instagram

The homepage's “Worn & Loved” section sits immediately after Fresh Finds and before the brand directory. It follows the supplied screenshot: five tall portrait cards, avatar/username and caption over the image, available view counts, cream engagement footers and Previous/Next controls. It includes Instagram Reels, photo posts and carousel covers. Until the account is connected, five shoe photographs are clearly labelled as upcoming stories; they are not fabricated Instagram posts or metrics.

The public Instagram feed loads in both the default demo catalog and Live store. Demo merchandise, carts and checkout remain isolated. `VITE_STORE_PREVIEW=true` explicitly forces a completely offline preview, including Instagram.

The admin route is `/admin/instagram-reels`. Sign in as the verified store owner. No actual Instagram account or credential has been supplied in this release.

## Your preferred setup: a server environment token

For this hosted store, open **Supabase → shoe → Edge Functions → Secrets** and add:

```dotenv
INSTAGRAM_ACCESS_TOKEN=your_own_instagram_login_access_token
```

Use an Instagram Login API token for an eligible Business/Creator account, usable with `graph.instagram.com`. A Facebook Page token uses a different API flow and is not supported by this connection.

A valid token automatically enables the feed, verifies your account, discovers its username/profile URL and syncs your latest posts. No manual username entry or additional Meta app secret is required for this token path. Reload the homepage after saving it. Edge Function secrets are read at runtime, so changing a token does not require a frontend rebuild or function redeployment. See [Supabase's server environment documentation](https://supabase.com/docs/guides/functions/secrets).

Optional:

```dotenv
INSTAGRAM_FEED_ENABLED=true
```

Set this optional variable to `false` to hide the environment-managed feed. While `INSTAGRAM_ACCESS_TOKEN` is present, it takes precedence over a saved admin/OAuth connection. The admin portal explains this source and still allows layout, automatic playback, refresh and product/shop-link editing. Replace or remove the secret to change the account. Environment tokens remain in server secrets; the function does not copy them into the connection table or send them to visitors. Their expiry is not invented or automatically rewritten: replace the secret when your provider token expires.

For a local Edge Function runtime, copy `supabase/functions/.env.example` to the ignored `supabase/functions/.env` and add your token there. The root Vite `.env` is for public frontend configuration; it does **not** configure the hosted Edge Function. Never use `VITE_INSTAGRAM_ACCESS_TOKEN`. A local frontend pointed at this hosted shoe project uses the hosted project's Edge Function Secrets.

## Alternative: connect through the admin portal

1. Enter your actual Instagram username and matching profile URL in Feed configuration, for example `your.store` and `https://www.instagram.com/your.store/`.
2. Paste an Instagram API access token for that same eligible Business/Creator account into **Connect with an access token**. This expects an Instagram Login token usable with `graph.instagram.com`, not a Facebook Page token.
3. If you know the provider's expiry, enter it. Otherwise leave it blank. Unknown expiry remains unknown; no invented expiration is stored.
4. Click **Connect token & sync**. The server validates the profile and account match, saves the credential privately, enables the feed and refreshes media. A media-permission failure is reported; it is not shown as a successful sync.
5. Use **Refresh Instagram Feed** to resync. Feed configuration controls enabled state, card counts, cache size and automatic playback interval. Synced moments can link to a product or a collection/shop destination.

The input is masked and cleared after the connection attempt. It is never saved in browser storage or a frontend environment file. The server's connection table has no anonymous/authenticated role access. Replacing or submitting a token requires a verified Auth identity and admin membership before any provider request is made. Provider failures do not echo token values. Do not put tokens in chat, frontend code or source control.

The server automatically refreshes cached media on storefront requests when its one-hour cache expires; there is no scraping. Visitors see only public media fields. Automatic carousel/video playback stops for reduced-motion preferences, paused controls, hidden pages and off-screen sections. Visitors can still explicitly play a video or open its Instagram permalink.

When an admin-supplied token has unknown expiry, replace it here if it expires. A valid known-expiry or OAuth connection retains the existing refresh path. Disconnect hides cached moments and disables an admin-managed feed. Environment-managed accounts instead use the server secret and optional enable flag described above.

## Optional Instagram account authorization

Configure `META_APP_ID` and `META_APP_SECRET` as Edge Function secrets for official account authorization. Allow this exact callback in the Meta app:

`https://ipqcxqsjzkbtxpljvdcy.supabase.co/functions/v1/instagram-feed?action=oauth-callback`

The configured username must match the authorized account. The callback checks a stored, expiring state and enables the feed after connecting. Server credentials never enter the frontend.

Consult the provider's current [Instagram Login setup](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/) for token generation, account eligibility, app mode and permissions. The function targets Graph API v25.0 and pins supabase-js 2.57.4.

## Release verification

`instagram-feed` is ACTIVE, version 4, in the `shoe` Supabase project. Its actual handler passed seventeen mocked-service checks, including environment-only activation from disabled settings, account discovery, cached profile/media reuse, environment disable/removal, credential privacy and admin ownership rules. The storefront and management checks also cover mixed media, overlaid captions/avatars, actual metrics, keyboard/paging/playback controls, public Instagram alongside demo merchandise and forced-offline behavior. A real account, actual provider authorization/media sync and browser playback remain unverified until you add your own credential. Metrics appear only when returned by Instagram. Carousel cards show the first media image; **View Post** opens the complete album.
