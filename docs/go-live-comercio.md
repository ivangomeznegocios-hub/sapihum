# Go-Live Ejecutivo de Comercio

Documento operativo para decidir si la plataforma puede salir al publico con pagos de eventos, formaciones y membresias.

## Regla De Salida

- `0 rojos` en flujos criticos.
- `Amarillos` solo aceptables en bloques no criticos y con plan de correccion fechado.
- `1 rojo` en `Infra`, `Auth y correos`, `Checkout`, `Webhooks y fulfillment` o `Refunds y soporte` = `NO SALIR`.
- `Todo verde` = salida publica completa.
- `Solo amarillos no criticos` = salida controlada, no pauta fria.

## Semaforo Go / No-Go

| Bloque | Estado | Owner | Criterio de aprobado |
| --- | --- | --- | --- |
| Infraestructura | `Verde / Amarillo / Rojo` | CTO / DevOps | Dominio live, SSL, `NEXT_PUBLIC_APP_URL`, variables prod, webhooks y Vercel prod listos. |
| Auth y correos | `Verde / Amarillo / Rojo` | Backend / Ops | Magic link y correos transaccionales llegan a inbox externo. |
| Checkout evento | `Verde / Amarillo / Rojo` | Product / Backend | Compra live confirma pago, crea acceso y no duplica registros. |
| Checkout formacion | `Verde / Amarillo / Rojo` | Product / Backend | Compra live confirma pago, activa la formacion y notifica acceso. |
| Checkout membresia | `Verde / Amarillo / Rojo` | Product / Backend | Alta live activa perfil, suscripcion y acceso correcto. |
| Webhooks y fulfillment | `Verde / Amarillo / Rojo` | Backend | Webhook idempotente, sin duplicados, sin fallos silenciosos. |
| Refunds y soporte | `Verde / Amarillo / Rojo` | Ops / Finanzas | Refund deja traza, revoca acceso y anula earnings si aplica. |
| Observabilidad y analitica | `Verde / Amarillo / Rojo` | Growth / Data | Checkouts, compras y UTM visibles en tablero interno. |
| Operacion interna / SLA | `Verde / Amarillo / Rojo` | Launch owner | Hay duenos, horario, escalamiento y respuesta manual. |

## Owners Y Gatekeepers

- `Infraestructura`: valida `DevOps`, aprueba `CTO`.
- `Stripe / webhooks`: valida `Backend`, aprueba `CTO`.
- `Auth / correos`: valida `Backend`, aprueba `Ops`.
- `Compras live`: ejecuta `Product`, observa `Backend`.
- `Conciliacion`: revisa `Finanzas / Ops`, aprueba `Launch owner`.
- `Soporte del dia 1`: responde `Ops`, con backup de `Backend`.

## Criterio Exacto De Aprobacion Por Prueba

- `Evento pagado aprobado` = pago confirmado + webhook procesado + `event_purchases.status=confirmed` + entitlement activo + correo enviado + acceso visible.
- `Formacion aprobada` = pago confirmado + webhook procesado + `formation_purchases.status=confirmed` + cursos ligados con acceso + correo enviado + acceso visible.
- `Membresia aprobada` = pago confirmado + webhook procesado + perfil actualizado + suscripcion activa + acceso correcto + magic link o redireccion correcto.
- `Webhook retrasado aprobado` = la pagina de exito reconcilia la compra sin crear duplicados y sin perder acceso.
- `Refund aprobado` = Stripe marca refund + base interna cambia a `refunded` o equivalente + entitlement revocado + earnings anulados + log de soporte creado.

## Pruebas Minimas Antes De Abrir

### 1. Flujo Real Live

- Compra de evento con tarjeta real y refund posterior.
- Compra de formacion con tarjeta real.
- Compra de membresia con tarjeta real.
- Compra guest y compra con usuario autenticado.

### 2. Concurrencia Minima

- 2 a 3 checkouts en paralelo sobre el mismo tipo de producto.
- 3 magic links seguidos al mismo correo o a correos distintos.
- Webhook duplicado o reintentado para la misma sesion.
- Dos usuarios comprando casi al mismo tiempo el mismo evento con cupo limitado.

### 3. Usuario Torpe

- Compra desde celular.
- Cierra la pestana y vuelve luego desde el correo.
- Abre el correo horas despues.
- Compra como guest y luego intenta entrar con otra identidad.
- Paga y no entiende a donde entrar despues del cobro.

## Runbook Dia 1

### Inicio

- Revisar Stripe live, webhook activo y ultimos pagos procesados.
- Revisar Resend, `RESEND_FROM_EMAIL` verificado y/o Auth email delivery.
- Revisar tablero interno de analytics y queue de compras pendientes.
- Confirmar que `NEXT_PUBLIC_APP_URL` apunta al dominio live.
- Confirmar que `NEXT_PUBLIC_COOKIEBOT_DOMAIN_GROUP_ID` y `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID` son los de produccion.
- Confirmar en el navegador que rutas sensibles (`/dashboard/patients`, `/dashboard/session`, `/dashboard/messages`, `/dashboard/documents`) no cargan GTM ni trackers de marketing.

### Cada Hora

- Revisar nuevos `checkout_started`, `payment_completed` y `formation_purchased`.
- Revisar webhooks fallidos o reintentados.
- Revisar emails fallidos o rebotes.
- Revisar compras pendientes > 30 min.
- Revisar si hubo refunds o tickets de soporte.
- Revisar que `generate_lead` y `purchase` sigan entrando al canonico first-party sin PII y, si aplica, a GA4 MP / Meta CAPI.

### Cierre

- Conciliar Stripe vs `payment_transactions`, `event_purchases` y `formation_purchases`.
- Conciliar entitlements activos vs compras confirmadas.
- Conciliar correos enviados vs compras cerradas.
- Cerrar incidencias abiertas o dejar owner y ETA.

### Cuando Pausar Pauta

- 1 rojo en flujo critico.
- Webhook caido o duplicando fulfillment.
- Correo transaccional fallando de forma consistente.
- Refund sin trazabilidad.
- Acceso roto en produccion.

### Cuando Bajar Una Oferta

- Cupo lleno.
- Falla de checkout en un producto especifico.
- Conversion anormalmente baja por problema operativo.
- Confusion repetida de usuarios sobre el punto de acceso.

### Respuesta Manual

- `Ops` responde dudas de acceso y correos.
- `Backend` reintenta fulfillment y revisa webhook.
- `Finanzas` confirma refund y conciliacion.
- `Launch owner` decide si se mantiene o pausa la pauta.

## Decision Final

- `VERDE` = lanzar y escalar.
- `AMARILLO` = lanzar controlado, sin pauta fria, con owner y ETA para cada gap.
- `ROJO` = no salir.

## Referencias

- Variables y entornos: [environment-setup.md](./environment-setup.md)
- Arquitectura de tracking: [analytics-tracking-architecture.md](./analytics-tracking-architecture.md)
