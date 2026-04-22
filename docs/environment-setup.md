# Environment Setup

This project uses the same environment variable names in every environment. Only the values change.

`NEXT_PUBLIC_*` variables are exposed to the browser. Never place secrets in them.

Server-only secrets must never be sent to the client:
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `ONESIGNAL_REST_API_KEY`
- `AI_API_KEY`
- `GA4_API_SECRET`
- `META_CAPI_ACCESS_TOKEN`
- `TIKTOK_ACCESS_TOKEN`

## Launch Note

For a public go-live, read this first: [go-live-comercio.md](./go-live-comercio.md).

## Staging

Set staging-specific values for:
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_COOKIEBOT_DOMAIN_GROUP_ID`
- `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID`
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_LEVEL_1_MONTHLY`
- `STRIPE_PRICE_LEVEL_1_ANNUAL`
- `STRIPE_PRICE_LEVEL_2_MONTHLY`
- `STRIPE_PRICE_LEVEL_2_ANNUAL`
- `STRIPE_PRICE_LEVEL_3_MONTHLY`
- `STRIPE_PRICE_LEVEL_3_ANNUAL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `NEXT_PUBLIC_ONESIGNAL_APP_ID`
- `ONESIGNAL_REST_API_KEY`
- `GA4_MEASUREMENT_ID`
- `GA4_API_SECRET`
- `ENABLE_META_SERVER_TRACKING`
- `META_PIXEL_ID`
- `META_CAPI_ACCESS_TOKEN`
- `ENABLE_TIKTOK_SERVER_TRACKING`
- `TIKTOK_PIXEL_ID`
- `TIKTOK_ACCESS_TOKEN`
- `AI_PROVIDER`
- `AI_API_KEY`
- `AI_MODEL_NAME`

Use staging/test integrations only. Do not reuse production secrets in staging.

## Production

Set production-specific values for the same variables:
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_COOKIEBOT_DOMAIN_GROUP_ID`
- `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID`
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_LEVEL_1_MONTHLY`
- `STRIPE_PRICE_LEVEL_1_ANNUAL`
- `STRIPE_PRICE_LEVEL_2_MONTHLY`
- `STRIPE_PRICE_LEVEL_2_ANNUAL`
- `STRIPE_PRICE_LEVEL_3_MONTHLY`
- `STRIPE_PRICE_LEVEL_3_ANNUAL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `NEXT_PUBLIC_ONESIGNAL_APP_ID`
- `ONESIGNAL_REST_API_KEY`
- `GA4_MEASUREMENT_ID`
- `GA4_API_SECRET`
- `ENABLE_META_SERVER_TRACKING`
- `META_PIXEL_ID`
- `META_CAPI_ACCESS_TOKEN`
- `ENABLE_TIKTOK_SERVER_TRACKING`
- `TIKTOK_PIXEL_ID`
- `TIKTOK_ACCESS_TOKEN`
- `AI_PROVIDER`
- `AI_API_KEY`
- `AI_MODEL_NAME`

Use production-only integrations and production-only secrets.
For Resend, make sure `RESEND_FROM_EMAIL` is a verified sender in the target environment.

## Required Before First Deploy

For the base app:
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_COOKIEBOT_DOMAIN_GROUP_ID`
- `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Before the first billing test:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_LEVEL_1_MONTHLY`
- `STRIPE_PRICE_LEVEL_1_ANNUAL`
- `STRIPE_PRICE_LEVEL_2_MONTHLY`
- `STRIPE_PRICE_LEVEL_2_ANNUAL`
- `STRIPE_PRICE_LEVEL_3_MONTHLY`
- `STRIPE_PRICE_LEVEL_3_ANNUAL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

## Can Wait To Phase 2

These can stay unset until the related feature is intentionally enabled:
- `NEXT_PUBLIC_ONESIGNAL_APP_ID`
- `ONESIGNAL_REST_API_KEY`
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
- `GA4_MEASUREMENT_ID`
- `GA4_API_SECRET`
- `ENABLE_META_SERVER_TRACKING`
- `META_PIXEL_ID`
- `META_CAPI_ACCESS_TOKEN`
- `ENABLE_TIKTOK_SERVER_TRACKING`
- `TIKTOK_PIXEL_ID`
- `TIKTOK_ACCESS_TOKEN`
- `AI_PROVIDER`
- `AI_API_KEY`
- `AI_MODEL_NAME`
- `PLAYWRIGHT_BASE_URL`
- `PLAYWRIGHT_WEB_SERVER_COMMAND`
- `PLAYWRIGHT_SKIP_WEB_SERVER`
- `PLAYWRIGHT_STORAGE_STATE_DIR`
- `PLAYWRIGHT_ENV_FILE`
- `PLAYWRIGHT_RUN_SEEDED_AUTH_AUDITS`

## Operational Rules

- Do not commit real `.env` files with secrets.
- Prefer your hosting provider's environment variable manager for staging and production.
- `.env.staging` is not auto-loaded by this project today; use provider-level staging variables unless you later add explicit tooling for it.
- Keep staging and production fully separated.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or any other server secret through `NEXT_PUBLIC_*`.
- Keep `NEXT_PUBLIC_COOKIEBOT_DOMAIN_GROUP_ID` and `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID` different between staging and production if you use different CMP / GTM workspaces.
- Do not enable `ENABLE_META_SERVER_TRACKING` or `ENABLE_TIKTOK_SERVER_TRACKING` until the corresponding test events validate correctly in staging.
- Leave `PLAYWRIGHT_RUN_SEEDED_AUTH_AUDITS` unset in production-like databases. Set it to `1` only in a disposable seeded environment that contains the `@test` audit users.

## Analytics Stack

The production tracking stack is now:
- `Cookiebot` as the CMP.
- `Google Consent Mode v2` with denied defaults until consent updates.
- `Google Tag Manager` as the only client-side tag container on `public_safe` routes.
- `GA4 Measurement Protocol` for optional server-side confirmation of `generate_lead` and `purchase`.
- `Meta Conversions API` for optional server-side confirmation of `generate_lead` and `purchase`.
- `TikTok Events API` delivered behind a server-side feature flag and disabled by default.

For the full route policy, event map, manual platform setup, and QA checklist, see [analytics-tracking-architecture.md](./analytics-tracking-architecture.md).
