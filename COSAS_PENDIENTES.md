# Cosas Pendientes

## 2026-03-08 - Integracion CRM + Telegram + n8n

### Objetivo
Permitir envio de comunicaciones desde el CRM a Telegram en modo individual y general.

### Webhook disponible
- `https://escuelacuidarte-n8n.pqtiji.easypanel.host/webhook/mensaje_clientes`

### Requisitos funcionales
- Envio individual desde ficha de cliente (chat_id del cliente).
- Envio general a uno o varios grupos/canales (chat_ids globales).
- Tipos de contenido a soportar:
  - `text`
  - `url`
  - `photo`
  - `document`

### Payload propuesto CRM -> n8n
```json
{
  "scope": "individual|general|segmento",
  "targets": ["chat_id_1", "chat_id_2"],
  "type": "text|url|document|photo",
  "message": "texto base",
  "url": "https://...",
  "file_url": "https://.../archivo.pdf",
  "caption": "opcional",
  "metadata": {
    "client_id": "uuid",
    "campaign": "recordatorio_semanal"
  }
}
```

### Seguridad minima
- Header `x-api-key` obligatorio en el webhook.
- Validacion de campos obligatorios en n8n.
- Control de errores y reintentos.

### Flujo recomendado
- El CRM define que enviar y a quien.
- n8n ejecuta envio a Telegram (sendMessage/sendPhoto/sendDocument).
- n8n devuelve resultado estandar (`sent`, `failed`, `details`).
- Guardar logs en CRM para trazabilidad.

### Nota para manana
Empezar implementando envio manual (individual + general) y despues automatizaciones.
