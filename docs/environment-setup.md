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

## Launch Note

For a public go-live, read this first: [go-live-comercio.md](./go-live-comercio.md).

## Staging

Set staging-specific values for:
- `NEXT_PUBLIC_APP_URL`
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
- `AI_PROVIDER`
- `AI_API_KEY`
- `AI_MODEL_NAME`

Use staging/test integrations only. Do not reuse production secrets in staging.

## Production

Set production-specific values for the same variables:
- `NEXT_PUBLIC_APP_URL`
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
- `AI_PROVIDER`
- `AI_API_KEY`
- `AI_MODEL_NAME`

Use production-only integrations and production-only secrets.

## Required Before First Deploy

For the base app:
- `NEXT_PUBLIC_APP_URL`
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
- `AI_PROVIDER`
- `AI_API_KEY`
- `AI_MODEL_NAME`
- `PLAYWRIGHT_BASE_URL`
- `PLAYWRIGHT_WEB_SERVER_COMMAND`
- `PLAYWRIGHT_SKIP_WEB_SERVER`
- `PLAYWRIGHT_STORAGE_STATE_DIR`

## Operational Rules

- Do not commit real `.env` files with secrets.
- Prefer your hosting provider's environment variable manager for staging and production.
- `.env.staging` is not auto-loaded by this project today; use provider-level staging variables unless you later add explicit tooling for it.
- Keep staging and production fully separated.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or any other server secret through `NEXT_PUBLIC_*`.
