# Analytics Tracking Architecture

Arquitectura privacy-first para SAPIHUM sobre Next.js + Vercel.

## Principios

- `Supabase analytics` es la fuente canonica de medicion.
- `Cookiebot` controla consentimiento y sincroniza el estado interno `cp_consent_status`.
- `Google Consent Mode v2` arranca en modo `denied` para `analytics_storage`, `ad_storage`, `ad_user_data` y `ad_personalization`.
- `GTM` solo puede cargarse en `public_safe` y debe usar triggers por `custom event`, no `All Pages`, `History Change` ni listeners globales.
- `Clarity`, `Meta Pixel`, `TikTok Pixel`, `LinkedIn Insight Tag` y `Google Ads` se activan via `GTM` solo en `public_safe`.
- `Meta CAPI`, `TikTok Events API` y `GA4 Measurement Protocol` se disparan desde servidor solo para eventos aprobados, con payload saneado y sin PII.
- No se envian datos sensibles ni PII a `dataLayer`, analytics events, logs o integraciones externas.

## Rutas y zonas

### `public_safe`

Rutas de marketing que pueden usar tracking consentido:

- `/`
- `/academia`
- `/blog`
- `/blog/[slug]`
- `/comunidad`
- `/cursos`
- `/cursos/[slug]`
- `/especialidades`
- `/especialidades/[slug]`
- `/eventos`
- `/eventos/[slug]`
- `/formaciones`
- `/formaciones/[slug]`
- `/grabaciones`
- `/grabaciones/[slug]`
- `/investigacion`
- `/manifiesto`
- `/nosotros`
- `/precios`
- `/recursos`
- `/speakers`
- `/speakers/[id]`
- `/membresia`

### `public_restricted`

Rutas publicas de utilidad o acceso que no deben cargar trackers publicitarios ni session replay:

- `/auth/*`
- `/compras/*`
- `/hub/*`
- `/mi-acceso`
- `*/embed`
- `/gracias`
- `/events/*`

### `private_app`

Rutas autenticadas internas sin terceros de marketing:

- `/dashboard/*` excepto las rutas clasificadas como `sensitive`

### `sensitive`

Rutas privadas o clinicas donde no se cargan terceros y solo se permite first-party minimo y saneado:

- `/dashboard/patients*`
- `/dashboard/session*`
- `/dashboard/booking`
- `/dashboard/calendar`
- `/dashboard/messages*`
- `/dashboard/documents*`
- `/dashboard/tools*`
- `/dashboard/tasks`
- `/api/clinical-records`

## Runtime implementado

### Capa cliente

- `src/components/providers/tracking-bootstrap.tsx`
  - Inicializa `window.dataLayer`.
  - Define `window.gtag`.
  - Aplica `Consent Mode v2` con defaults `denied`.

- `src/components/providers/cookiebot-provider.tsx`
  - Carga `Cookiebot` cuando existe `NEXT_PUBLIC_COOKIEBOT_DOMAIN_GROUP_ID`.

- `src/components/providers/cookiebot-bridge.tsx`
  - Escucha eventos de Cookiebot.
  - Espeja el consentimiento a `cp_consent_status`.
  - Actualiza `gtag('consent', 'update', ...)`.
  - Persiste consentimientos autenticados con `recordCookieConsent`.

- `src/components/providers/analytics-provider.tsx`
  - Clasifica la ruta con `src/lib/tracking/policy.ts`.
  - Publica `tracking_context` al `dataLayer`.
  - Carga `GTM` solo en `public_safe` con consentimiento no esencial.
  - Emite `page_view`, `view_content`, `click_whatsapp`, `click_phone`, `form_start`, `form_submit`.
  - Marca `data-tracking-zone`, `data-tracking-page-type` y `data-tracking-content-type` en `<html>` para QA.

- `src/components/providers/onesignal-provider.tsx`
  - Quedo gateado por consentimiento de marketing y por politica de ruta.
  - No se inicializa en `public_restricted`, `private_app` ni `sensitive`.

### Capa servidor

- `src/app/api/analytics/collect/route.ts`
  - Ahora acepta eventos canonicos y legacy.
  - Requiere consentimiento de medicion.
  - Inyecta el snapshot de consentimiento derivado del cookie del request.

- `src/lib/analytics/server.ts`
  - Sanea propiedades antes de persistir.
  - Guarda `consent_state` en `analytics_visitors`.
  - Reutiliza ese consentimiento para eventos server/webhook.
  - Llama a destinos server-side aprobados por politica.

- `src/lib/tracking/server-destinations.ts`
  - `GA4 Measurement Protocol`: listo para `generate_lead` y `purchase`.
  - `Meta Conversions API`: listo para `generate_lead` y `purchase`.
  - `TikTok Events API`: listo pero apagado por defecto.
  - Todos los payloads salen saneados y sin PII.

## Eventos implementados

### Canonicos

- `page_view`
- `view_content`
- `click_whatsapp`
- `click_phone`
- `form_start`
- `form_submit`
- `generate_lead`
- `book_appointment`
- `begin_checkout`
- `purchase`
- `sign_up`
- `cta_clicked`

### Legacy que siguen vivos y se mapean

- `registration_started`
- `registration_completed`
- `registration_verified`
- `waitlist_joined`
- `checkout_started`
- `payment_completed`
- `payment_failed`
- `payment_refunded`
- `subscription_created`
- `subscription_renewed`
- `subscription_cancelled`
- `subscription_past_due`
- `event_registered`
- `event_purchased`
- `formation_purchased`
- `ai_credits_purchased`

## Flujos ya cableados

- `view_content` automatico en detalles publicos por tipo de pagina.
- `waitlist` con `form_start`, `form_submit` y `waitlist_joined -> generate_lead`.
- `CheckoutButton` y `SubscribeButton` con `checkout_started -> begin_checkout`.
- Formularios de `register`, `login`, `forgot-password`, `update-password` y `compras/recuperar` con tracking first-party saneado.
- `book_appointment` en `/dashboard/booking` solo first-party.
- `/gracias` limpio: eliminado el `window.dataLayer.push('purchase')` legacy.

## Matriz evento -> destino

### Cliente via GTM en `public_safe`

- `page_view`: `GTM`, `GA4`, `Clarity`
- `view_content`: `GTM`, `GA4`, `Meta Pixel`, `TikTok Pixel`, `LinkedIn Insight Tag`
- `click_whatsapp`, `click_phone`, `form_start`, `form_submit`, `cta_clicked`: `GTM`, `GA4`
- `begin_checkout`: `GTM`, `GA4`, `Google Ads`, `Meta Pixel`, `TikTok Pixel`
- `generate_lead`: `GTM`, `GA4`, `Meta Pixel`, `TikTok Pixel`

### Servidor

- `generate_lead`: `Supabase analytics`, opcional `GA4 MP`, opcional `Meta CAPI`, opcional `TikTok Events API`
- `purchase`: `Supabase analytics`, opcional `GA4 MP`, opcional `Meta CAPI`, opcional `TikTok Events API`
- `book_appointment`: solo `Supabase analytics`
- Auth, recovery, utilidades privadas: solo `Supabase analytics`

## Variables de entorno

### Requeridas para la base privacy-first

- `NEXT_PUBLIC_COOKIEBOT_DOMAIN_GROUP_ID`
- `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID`
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`

### Opcionales para confirmacion server-side

- `GA4_MEASUREMENT_ID`
- `GA4_API_SECRET`
- `ENABLE_META_SERVER_TRACKING`
- `META_PIXEL_ID`
- `META_CAPI_ACCESS_TOKEN`
- `META_TEST_EVENT_CODE`
- `ENABLE_TIKTOK_SERVER_TRACKING`
- `TIKTOK_PIXEL_ID`
- `TIKTOK_ACCESS_TOKEN`
- `TIKTOK_TEST_EVENT_CODE`

## Pasos manuales pendientes

### Vercel

- Cargar las variables nuevas en `Preview` y `Production`.
- Verificar que `NEXT_PUBLIC_APP_URL` sea el dominio correcto en cada entorno.

### Cookiebot

- Crear el dominio del proyecto.
- Publicar el `Domain Group ID`.
- Definir categorias al menos para `necessary`, `statistics`, `marketing`.
- Confirmar que el banner aparezca y persista estado correctamente.

### GTM

- Crear contenedor para staging y otro para production o usar workspaces separados.
- Configurar variables de `dataLayer`:
  - `canonical_event_name`
  - `internal_event_name`
  - `tracking_zone`
  - `page_type`
  - `content_type`
  - `event_id`
- Configurar triggers solo por custom events:
  - `page_view`
  - `view_content`
  - `click_whatsapp`
  - `click_phone`
  - `form_start`
  - `form_submit`
  - `begin_checkout`
  - `generate_lead`
- No usar `All Pages`, `DOM Ready`, `History Change` ni listeners globales.
- Agregar filtro obligatorio `tracking_zone equals public_safe` en todas las tags publicitarias y de replay.

### GA4

- Crear Data Stream web.
- Si usaras confirmacion server-side, generar `Measurement ID` y `API Secret`.
- Validar eventos en `DebugView`.

### Google Ads

- Crear conversiones para `begin_checkout` y `purchase`.
- Implementarlas desde GTM.
- `Enhanced Conversions` queda fuera en esta version.

### Meta

- Crear / confirmar `Pixel ID`.
- Generar token para `Conversions API`.
- Activar `ENABLE_META_SERVER_TRACKING=true` solo tras validar `Test Events`.

### TikTok

- Mantener apagado por defecto.
- Solo activarlo si realmente habra pauta en TikTok.
- Configurar Pixel y Access Token.
- Activar `ENABLE_TIKTOK_SERVER_TRACKING=true` solo tras validar `Test Events`.

### LinkedIn

- Solo si hay pauta B2B real.
- Crear `Insight Tag` dentro de GTM con filtro `tracking_zone = public_safe`.

### Microsoft Clarity

- Implementarlo desde GTM con consentimiento analitico.
- Excluir cualquier pagina sensible o privada.
- No usarlo en flujos dirigidos a menores ni en experiencias clinicas.

### Google Search Console

- Copiar el token de verificacion a `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`.
- Verificar el dominio.
- Enviar `sitemap.xml`.

## Checklist QA

### Staging

- Sin consentimiento:
  - no debe cargarse GTM
  - no deben emitirse hits externos
  - `analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization` deben iniciar en `denied`

- Solo analiticas:
  - GTM si puede cargar en `public_safe`
  - GA4 y Clarity si pueden activarse via GTM
  - Meta, TikTok y Ads deben seguir bloqueados por consentimiento

- Analiticas + marketing:
  - GTM carga en `public_safe`
  - `begin_checkout`, `generate_lead` y `purchase` quedan disponibles para tags publicitarias

- Rutas `public_restricted`:
  - no GTM publicitario
  - no Clarity
  - solo first-party saneado

- Rutas `private_app` y `sensitive`:
  - no GTM, no Meta Pixel, no TikTok Pixel, no Clarity, no LinkedIn Insight
  - no PII en `dataLayer`
  - `book_appointment` solo first-party

### Produccion

- Validar `tracking_context` en `window.dataLayer`.
- Validar `page_view`, `view_content`, `form_start`, `form_submit`, `begin_checkout`, `generate_lead`.
- Validar que `purchase` llegue por webhook a Supabase y, si hay credenciales, a GA4 MP / Meta CAPI.
- Revisar red para confirmar ausencia de llamadas a trackers en rutas sensibles.

## QA automatizada disponible

- `tests/tracking-policy.spec.ts`
  - clasificacion de rutas
  - gating por zona
  - mapeo legacy -> canonico
  - saneado de payloads
  - consentimiento para Consent Mode

## Comandos de verificacion usados

- `npx tsc --noEmit`
- `npm run lint`
- `PLAYWRIGHT_SKIP_WEB_SERVER=1 npx playwright test tests/tracking-policy.spec.ts --output test-results-tracking`
- `npm run build`
