// Guía de configuración de N8N para envío automático de emails de onboarding

## 📧 CONFIGURACIÓN N8N - EMAIL AUTOMÁTICO DE ONBOARDING

### Paso 1: Crear Workflow en N8N

1. Abre N8N y crea un nuevo workflow
2. Añade un nodo "Webhook" como trigger
3. Configura el webhook:
   - Method: POST
   - Path: `/onboarding-email` (o el que prefieras)
   - Copia la URL del webhook (ej: `https://tu-n8n.com/webhook/abc123`)

### Paso 2: Configurar el Webhook en tu CRM

1. Ejecuta este SQL en Supabase:

```sql
-- Activar el webhook de N8N
UPDATE app_settings 
SET setting_value = 'https://TU-N8N-URL/webhook/abc123'
WHERE setting_key = 'n8n_webhook_new_sale';

UPDATE app_settings 
SET setting_value = 'true'
WHERE setting_key = 'n8n_webhook_enabled';
```

2. Reemplaza `https://TU-N8N-URL/webhook/abc123` con tu URL real de N8N

### Paso 3: Configurar N8N Workflow

Tu workflow de N8N recibirá estos datos cuando haya una nueva venta:

```json
{
  "client_name": "Juan García López",
  "client_email": "cliente@email.com",
  "client_phone": "+34 600 000 000",
  "onboarding_link": "https://tuapp.com/bienvenida/abc123xyz",
  "contract_duration": "3",
  "assigned_coach_id": "coach-id-123",
  "sale_id": "sale-uuid",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Paso 4: Añadir nodo de Email en N8N

1. Añade un nodo "Send Email" (Gmail, SendGrid, etc.)
2. Configura:
   - **To**: `{{ $json.client_email }}`
   - **Subject**: `¡Bienvenido a Academia Diabetes Online! 🎉`
   - **Body** (HTML):

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; }
        .content { background: #f9fafb; padding: 30px; border-radius: 10px; margin-top: 20px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .checklist { background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>¡Bienvenido/a {{ $json.client_name }}!</h1>
            <p>Estamos emocionados de acompañarte en tu camino hacia una vida más saludable</p>
        </div>
        
        <div class="content">
            <h2>🎯 Siguiente Paso: Completa tu Perfil</h2>
            <p>Para personalizar tu programa y que tu coach pueda diseñar el mejor plan para ti, necesitamos que completes tu formulario inicial.</p>
            
            <div class="checklist">
                <h3>📋 Antes de empezar, ten a mano:</h3>
                <ul>
                    <li>⏱️ <strong>20 minutos</strong> de tiempo sin interrupciones</li>
                    <li>💊 <strong>Tu medicación actual</strong> (nombres y dosis)</li>
                    <li>📊 <strong>Últimos análisis</strong> (HbA1c, glucosa en ayunas)</li>
                    <li>⚖️ <strong>Tu peso actual</strong> (en ayunas, si es posible)</li>
                    <li>📏 <strong>Medidas corporales</strong> (cintura, cadera, etc.)</li>
                </ul>
            </div>
            
            <center>
                <a href="{{ $json.onboarding_link }}" class="button">
                    ✨ Completar Mi Perfil Ahora
                </a>
            </center>
            
            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                <strong>Nota:</strong> Este enlace es personal e intransferible. Si tienes algún problema, contacta con nosotros.
            </p>
        </div>
        
        <div class="footer">
            <p>Academia Diabetes Online<br>
            © 2024 - Todos los derechos reservados</p>
        </div>
    </div>
</body>
</html>
```

### Paso 5: Probar el Sistema

1. Registra una nueva venta desde el CRM
2. Verifica que N8N recibe el webhook
3. Comprueba que el cliente recibe el email
4. El cliente hace click y accede al formulario de onboarding

### 🔧 Troubleshooting

**Si el email no se envía:**
- Verifica que la URL del webhook es correcta
- Comprueba que `n8n_webhook_enabled` está en `'true'`
- Revisa los logs de N8N para ver si llega la petición
- Verifica la consola del navegador en el CRM

**Para desactivar temporalmente:**
```sql
UPDATE app_settings 
SET setting_value = 'false'
WHERE setting_key = 'n8n_webhook_enabled';
```

### 📱 Opcional: Enviar también por WhatsApp

Puedes añadir un nodo de WhatsApp en N8N para enviar también un mensaje:

```
Hola {{ $json.client_name }}! 👋

¡Bienvenido/a a Academia Diabetes Online!

Para empezar, completa tu perfil aquí:
{{ $json.onboarding_link }}

Necesitarás unos 20 minutos y tener a mano tu medicación y últimos análisis.

¡Nos vemos dentro! 💪
```

---

## ✅ Una vez configurado:

El flujo será 100% automático:
1. Closer registra venta → Click "Registrar Alta"
2. Sistema envía datos a N8N
3. N8N envía email (y WhatsApp si lo configuras)
4. Cliente recibe link y completa onboarding
5. ¡Listo para empezar!
