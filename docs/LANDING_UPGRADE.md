# SOLEFORM campaign and Instagram upgrade — 5 October 2026

The homepage now uses a full-width original footwear photograph, the oversized “Make every step yours.” headline, cream/sage/lime colours and direct collection, preloved and department links. The earlier orange preloved block is replaced by a quiet shoe still life and the “Great pairs. Fresh chapters.” edit, placed immediately before the footer. The large dark Studio panel is removed from the homepage.

## Direction and interaction

The current official [Nike](https://www.nike.com/), [Gucci](https://www.gucci.com/us/en/) and [Zara](https://www.zara.com/us/) pages were reviewed again. Nike's concise campaign/shop structure, Gucci's photographic categories and Zara's collection-led navigation informed this original interpretation. The user's supplied Instagram reference informed the portrait card rail. No competitor campaign asset was copied.

Men, Women and Kids links retain their department filters. Each demo department has twenty different concept products with photographs, descriptions and PKR prices. The existing product rail, keyboard department tabs, simultaneous brand selections, cart/saved pairs, available-size filters and condition guides retain their behavior. The live catalog remains separate and contains only the operator's real inventory.

The “Worn & Loved” Instagram section sits in the middle of the homepage, immediately after Fresh Finds and before brands. The supplied reference informs its five 9:16 portrait cards, avatar/username and caption overlays, available views, cream engagement footers, underlined profile link and circular browsing controls. Reels have explicit play/pause controls; each card opens its actual Instagram permalink and can link to a shoe or collection. The rail supports swipe, Previous/Next, Home/End/arrow keys and additional pages. A carousel card shows its first image and opens the complete post on Instagram.

If media or an avatar fails, the card retains a usable Instagram link or icon. Metrics are omitted when the API did not return them. Unconnected or empty accounts show five clearly labelled decorative shoe previews. The public Instagram feed loads independently in demo and live catalog views; demo merchandise, carts and checkout stay isolated. A dedicated public client does not reuse customer sessions. Forced offline preview also disables Instagram requests. See [the token setup](./INSTAGRAM_FEED_SETUP.md).

Campaign entry, section reveals and hover feedback are restrained. Reduced-motion preferences disable decorative transitions and automatic playback; hidden/off-screen pages also stop automatic video playback.

## Original assets

Created with the built-in image-generation tool. Full prompts, mode and saved paths are in [CAMPAIGN_PROMPTS_V3.json](./CAMPAIGN_PROMPTS_V3.json).

| Asset | Original saved path | Browser asset | Dimensions | Browser bytes |
| --- | --- | --- | --- | --- |
| Hero | /workspace/sites/shoe/public/images/campaign/every-step-v3.png | public/images/campaign/every-step-v3.webp | 1672 × 941 | 171,136 |
| Preloved edit | /workspace/sites/shoe/public/images/campaign/fresh-chapters-v3.png | public/images/campaign/fresh-chapters-v3.webp | 1536 × 1024 | 201,634 |

WebP conversion uses quality 88 and preserves composition/dimensions. The hero has high fetch priority; preloved and department imagery load lazily. The originals are retained. These are unbranded footwear concepts rather than photographs of stock offered for sale. The earlier collection contact sheet and login photograph are retained for their respective uses.

## Verification

62 demo UI checks, 24 configured UI checks, 9 management UI checks and 17 actual Edge-handler checks with mocked provider responses passed. The production build passed. The isolated handler check exercises one mixed-media sync, first-child carousel covers, returned engagement metrics, preservation of shop links, retirement of old cached media and public credential privacy.

jsdom verifies DOM/actions and selected CSS properties; it does not render desktop/mobile layouts. Real browser visual QA and actual provider playback remain unverified. No real Instagram credential was supplied. The separate 41 hosted commerce/admin checks and clean fixture removal are recorded in [ADMIN_VERIFICATION.json](./ADMIN_VERIFICATION.json); all final test scopes are in [TEST_RESULTS.md](./TEST_RESULTS.md).
