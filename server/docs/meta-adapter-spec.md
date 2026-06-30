# Meta Adapter Spec — Fase 2

**Estado:** Diseño completo, implementación pendiente para Fase 2.  
**Fecha:** 2026-06-29  
**Canales en scope:** WhatsApp Business API, Instagram DMs, Facebook Messenger.

---

## 1. Adapter Contract

Todo adapter de canal real implementa la interfaz `ChannelAdapter` definida en `server/src/channels/types.ts`:

```typescript
interface ChannelAdapter {
  channel: ChannelType                        // "whatsapp" | "instagram" | "messenger"
  parseInbound(raw: unknown, tenantId: string): NormalizedMessage[]
  formatOutbound(msg: AgentResponse, ctx: OutboundContext): OutboundPayload
  sendMessage(payload: OutboundPayload, credentials: ChannelCredentials): Promise<ProviderResult>
  verifyWebhook(req: IncomingWebhookRequest): boolean
}
```

El `MockAdapter` (ya implementado) sirve como referencia de implementación completa.

---

## 2. Webhook Verification

### WhatsApp / Instagram / Messenger (Meta)

Meta usa un challenge GET para la verificación inicial y un header HMAC para cada evento:

**GET /webhooks/whatsapp** (verificación inicial):
```
?hub.mode=subscribe
?hub.verify_token=<WHATSAPP_VERIFY_TOKEN>
?hub.challenge=<número_a_retornar>
```
El adapter responde con `hub.challenge` si `hub.verify_token === env.WHATSAPP_VERIFY_TOKEN`.

**POST /webhooks/whatsapp** (eventos):
```
Header: X-Hub-Signature-256: sha256=<HMAC>
```
El adapter verifica con `crypto.createHmac("sha256", WHATSAPP_APP_SECRET).update(rawBody).digest("hex")`.

### Mapeo de rutas actuales

`server/src/api/webhooks.ts` ya existe con handlers para `whatsapp`, `instagram`, `messenger`. Actualmente responden `501 Not Implemented` — correcto para Fase 1.

---

## 3. Inbound Normalization

Cada evento Meta se normaliza a `NormalizedMessage`:

```typescript
interface NormalizedMessage {
  externalId: string           // ID de mensaje del proveedor
  tenantId: string
  channel: ChannelType
  from: string                 // número/ID del contacto
  text: string
  timestamp: string            // ISO 8601
  providerMessageId: string    // para deduplicación
  mediaUrl?: string
  mediaType?: "image" | "audio" | "video" | "document"
}
```

**WhatsApp payload → NormalizedMessage:**
```
entry[0].changes[0].value.messages[0].id  → providerMessageId
entry[0].changes[0].value.messages[0].from → from
entry[0].changes[0].value.messages[0].text.body → text
entry[0].changes[0].value.messages[0].timestamp → timestamp (unix → ISO)
```

**Instagram payload:** estructura similar, campo `sender.id` en lugar de `from`.

**Messenger payload:** campo `sender.id`, `message.text`, `message.mid`.

---

## 4. Outbound Send Contract

```typescript
interface OutboundPayload {
  to: string                   // número/ID del destinatario
  text: string
  media?: { url: string; type: "image" | "document" }[]
  providerConversationId?: string
}

interface ProviderResult {
  providerMessageId: string
  status: "sent" | "failed"
  error?: string
}
```

**WhatsApp send:**
```
POST https://graph.facebook.com/v20.0/{PHONE_NUMBER_ID}/messages
Authorization: Bearer {WHATSAPP_TOKEN}
Body: { messaging_product: "whatsapp", to, type: "text", text: { body } }
```

**Idempotency:** cada outbound persiste `provider_message_id` en `messages.provider_message_id`. Reintentos verifican si ya existe antes de enviar.

---

## 5. Media / Attachments

Si `AgentResponse.media` tiene items, el adapter los envía como mensajes separados antes del texto. Orden: imagen → texto.

WhatsApp media message:
```json
{ "type": "image", "image": { "link": "<url_público>", "caption": "<alt>" } }
```

El endpoint `/images/:key` de Bookia sirve las imágenes; para producción debe ser una URL pública (CDN o signed URL). En Fase 1 solo se usa en demo local.

---

## 6. Error Handling / Retries

- Timeout por request: 10s.
- Reintento máximo: 3 veces con backoff exponencial (1s, 2s, 4s).
- Error 400/401/403: no reintentar; log de error + no persistir.
- Error 429 (rate limit): reintentar con espera del header `Retry-After`.
- Error 5xx: reintentar con backoff.
- Si todos los reintentos fallan: insertar mensaje con `status="failed"` en `messages` y emitir evento en event-bus para que el dashboard muestre el fallo.

---

## 7. Credential Storage

Las credenciales por tenant se almacenan en `channel_accounts.credentials` (JSONB, encriptado en reposo por PostgreSQL RLS + columna `pgcrypto` en Fase 2).

Estructura esperada por canal:

```json
// WhatsApp
{
  "phoneNumberId": "123456789",
  "wabaId": "987654321",
  "token": "EAAxxxxx",
  "verifyToken": "bookia-webhook-secret",
  "appSecret": "abc123"
}

// Instagram
{
  "pageId": "111222333",
  "accessToken": "EAAxxxxx",
  "appSecret": "abc123"
}

// Messenger
{
  "pageId": "444555666",
  "pageAccessToken": "EAAxxxxx",
  "appSecret": "abc123",
  "verifyToken": "bookia-messenger-secret"
}
```

En Fase 1 estas credenciales no existen; `registry.ts` debe rechazar la activación si faltan.

---

## 8. Tenant Resolution

El webhook llega sin header de tenant. La resolución sigue esta cadena:

1. `channel_accounts` WHERE `channel = 'whatsapp'` AND `credentials->>'phoneNumberId' = <phone_number_id_del_payload>`
2. Si no hay match → responder `200 OK` sin procesar (para que Meta no reintente indefinidamente)
3. Si hay match → `tenant_id` del `channel_account` se usa para el resto del pipeline

---

## 9. Security / Signature Validation

```typescript
function verifyMetaSignature(rawBody: Buffer, signature: string, appSecret: string): boolean {
  const expected = "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

**Regla:** si la firma es inválida → responder `403 Forbidden` + log de intento. **Nunca procesar el payload.**

---

## 10. Checklist de enchufe Fase 2

- [ ] Crear cuenta Meta for Developers y app type "Business"
- [ ] Solicitar permisos: `whatsapp_business_messaging`, `pages_messaging`
- [ ] Obtener Phone Number ID, WABA ID, App Secret, Page Access Token
- [ ] Almacenar en `channel_accounts.credentials` del tenant correcto
- [ ] Registrar webhook en Meta Dashboard → `https://api.bookia.app/webhooks/whatsapp`
- [ ] Implementar `WhatsAppAdapter` en `server/src/channels/meta/whatsapp-adapter.ts`
- [ ] Registrar en `registry.ts`: `"whatsapp" → new WhatsAppAdapter()`
- [ ] Habilitar la cuenta en `channel_accounts.status = 'connected'`
- [ ] Test de ping con número de prueba
- [ ] Test de envío de imagen (antes/después) via `/images/:key`
- [ ] Test de rate limit y retry
- [ ] Activar V2 kernel flag para el tenant en producción

---

## 11. Test Plan Fase 2

| Test | Herramienta | Descripción |
|------|-------------|-------------|
| Webhook verification | `curl` | GET con hub params → responde challenge |
| Signature validation | Vitest unit | Firma correcta pasa; firma incorrecta = 403 |
| Inbound normalization | Vitest unit | Payload Meta → NormalizedMessage |
| Outbound send | MSW mock | Verifica payload al Graph API |
| Duplicate detection | Vitest integration | Mismo `providerMessageId` → no duplicado |
| Media message | Vitest integration | `AgentResponse.media` → envío de imagen antes de texto |
| Retry on 429 | Vitest unit | Respeta `Retry-After` |
| Tenant not found | Vitest integration | Payload desconocido → 200 OK silencioso |

---

## Estado actual de stubs en webhooks.ts

```typescript
// Actualmente (Fase 1) — correcto para MVP:
webhooks.post("/whatsapp", (c) => c.json({ status: "not_implemented" }, 501))
webhooks.post("/instagram", (c) => c.json({ status: "not_implemented" }, 501))
webhooks.post("/messenger", (c) => c.json({ status: "not_implemented" }, 501))
```

No modificar hasta Fase 2.
