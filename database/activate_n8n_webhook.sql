-- Configurar webhook de N8N para envío automático de emails de onboarding
-- Ejecuta esto en Supabase después de crear la tabla app_settings

-- 1. Configurar la URL del webhook de N8N
UPDATE app_settings 
SET setting_value = 'https://academia-diabetes-online-n8n.k5pdeb.easypanel.host/webhook/nueva_alta_ado'
WHERE setting_key = 'n8n_webhook_new_sale';

-- 2. Activar el envío automático
UPDATE app_settings 
SET setting_value = 'true'
WHERE setting_key = 'n8n_webhook_enabled';

-- 2.1 Configurar webhook grupal de Telegram
UPDATE app_settings
SET setting_value = 'https://escuelacuidarte-n8n.pqtiji.easypanel.host/webhook/mensaje_clientes'
WHERE setting_key = 'n8n_webhook_telegram_broadcast';

-- 2.2 Activar envío grupal por Telegram
UPDATE app_settings
SET setting_value = 'true'
WHERE setting_key = 'n8n_webhook_telegram_enabled';

-- 3. Verificar que se ha configurado correctamente
SELECT setting_key, setting_value, description 
FROM app_settings 
WHERE setting_key IN (
  'n8n_webhook_new_sale',
  'n8n_webhook_enabled',
  'n8n_webhook_telegram_broadcast',
  'n8n_webhook_telegram_enabled'
);
