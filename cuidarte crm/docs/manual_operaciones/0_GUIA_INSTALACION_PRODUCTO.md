# 🚀 Guía de Instalación del Producto - CRM Coaching

**Versión:** 1.0 (Enero 2026)
**Audiencia:** Nuevo propietario / Equipo técnico de implementación.
**Objetivo:** Desplegar una instancia funcional del CRM desde cero para un nuevo negocio.

---

## 📋 Resumen del Producto

Este CRM está diseñado para negocios de **coaching, academias online y servicios de acompañamiento** que requieren:

- Gestión de clientes/alumnos con seguimiento personalizado
- Sistema de ventas con onboarding automatizado
- Dashboards por roles (Coach, Admin, Contabilidad, etc.)
- Gestión de contratos y renovaciones por fases
- Facturación interna de colaboradores
- Portal del cliente con métricas de progreso

---

## 📦 FASE 1: Requisitos Previos

### 1.1. Servicios Necesarios (SaaS Stack)

Antes de comenzar, el nuevo propietario debe crear cuentas en estos servicios:

| Servicio | Uso | Plan Mínimo | URL de Registro |
|----------|-----|-------------|-----------------|
| **Supabase** | Base de datos + Auth + Storage | Free / Pro ($25/mes) | https://supabase.com |
| **Vercel** o **Netlify** | Hosting del Frontend | Free / Pro | https://vercel.com o https://netlify.com |
| **Dominio propio** | URL personalizada | Variable | Namecheap, GoDaddy, etc. |
| **(Opcional) N8N** | Automatizaciones y webhooks | Self-hosted o Cloud | https://n8n.io |
| **(Opcional) Loom** | Videos de feedback | Business | https://loom.com |

### 1.2. Herramientas de Desarrollo (Solo si modifica código)

- Node.js 18+ (https://nodejs.org)
- Git (https://git-scm.com)
- Editor de código (VS Code recomendado)

---

## 🔑 FASE 2: Recopilación de Credenciales

### Checklist de Credenciales a Obtener

Complete esta tabla antes de continuar:

```
┌─────────────────────────────────────────────────────────────────────┐
│ CHECKLIST DE CREDENCIALES                                           │
├─────────────────────────────────────────────────────────────────────┤
│ [ ] Supabase Project URL          → ________________________        │
│ [ ] Supabase Anon Key             → ________________________        │
│ [ ] Supabase Service Role Key     → ________________________        │
│ [ ] (Opcional) Webhook URL N8N    → ________________________        │
│ [ ] (Opcional) Gemini API Key     → ________________________        │
│ [ ] Dominio de producción         → ________________________        │
└─────────────────────────────────────────────────────────────────────┘
```

### Cómo Obtener Credenciales de Supabase

1. Ir a https://supabase.com y crear cuenta/proyecto nuevo
2. Nombre del proyecto: `mi-negocio-crm` (o similar)
3. Región: Elegir la más cercana a tus clientes (ej: `eu-west-1` para España)
4. Esperar ~2 minutos a que se aprovisione
5. Ir a **Settings > API** y copiar:
   - `Project URL` → Esta es tu `VITE_SUPABASE_URL`
   - `anon public` key → Esta es tu `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → Solo para scripts de migración (NO exponer en frontend)

---

## 🗄️ FASE 3: Configuración de Base de Datos

### 3.1. Orden de Ejecución de Scripts SQL

Los scripts deben ejecutarse en este orden en el **SQL Editor** de Supabase:

```
📁 database/
│
├── 1️⃣ CORE (Obligatorios - Ejecutar primero)
│   ├── create_users_table.sql          → Tabla de usuarios/staff
│   ├── create_sales_table.sql          → Registro de ventas
│   ├── create_app_settings.sql         → Configuración general
│   └── storage_setup.sql               → Buckets de archivos
│
├── 2️⃣ SEGURIDAD (Obligatorio - Ejecutar segundo)
│   └── seguridad_total_rls.sql         → Políticas de acceso por rol
│
├── 3️⃣ MÓDULOS OPCIONALES (Según funcionalidades deseadas)
│   ├── create_invoices_system.sql      → Facturación de coaches
│   ├── create_medical_reviews.sql      → Dashboard médico
│   ├── create_communications_tables.sql → Sistema de anuncios
│   ├── create_ticket_comments.sql      → Soporte/Tickets
│   ├── create_daily_metrics_table.sql  → Métricas diarias
│   ├── 20260120_leads_migration.sql    → Módulo de Leads (Pre-Venta)
│   └── 20260120_pauses_migration.sql   → Lógica de Pausa Automática
│
└── 4️⃣ TRIGGERS Y AUTOMATIZACIONES
    ├── automation_auth_sync.sql        → Sincroniza Auth ↔ Users
    └── notify_sale_events.sql          → Notificaciones de ventas
```

### 3.2. Script de Inicialización Rápida

Si desea ejecutar todo de una vez, use este orden en la consola SQL de Supabase:

```sql
-- PASO 1: Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PASO 2: Copiar y pegar contenido de cada archivo en orden:
-- 1. create_users_table.sql
-- 2. create_sales_table.sql
-- 3. create_app_settings.sql
-- 4. storage_setup.sql
-- 5. seguridad_total_rls.sql
-- 6. automation_auth_sync.sql
```

### 3.3. Crear Usuario Administrador Inicial

Después de ejecutar los scripts, cree el primer Admin:

**Opción A: Desde el Panel de Supabase**

1. Ir a **Authentication > Users > Add User**
2. Email: `admin@tu-negocio.com`
3. Password: (una contraseña segura)
4. Copiar el UUID generado

**Opción B: Ejecutar SQL directo**

```sql
-- Reemplazar con los datos reales
INSERT INTO public.users (id, email, name, role)
VALUES (
  'UUID_DEL_USUARIO_CREADO_EN_AUTH',
  'admin@tu-negocio.com',
  'Administrador Principal',
  'admin'
);
```

---

## ⚙️ FASE 4: Configuración del Frontend

### 4.1. Variables de Entorno

Crear archivo `.env.local` en la raíz del proyecto:

```env
# === OBLIGATORIAS ===
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# === OPCIONALES ===
# Entorno (development | production)
VITE_ENV=production

# API de IA para funciones inteligentes
GEMINI_API_KEY=tu_api_key_aqui

# Webhook para automatizaciones (N8N/Make)
VITE_WEBHOOK_URL=https://n8n.tu-servidor.com/webhook/ventas
```

### 4.2. Instalación Local (Desarrollo)

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/crm-coaching.git
cd crm-coaching

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con tus credenciales

# 4. Iniciar servidor de desarrollo
npm run dev
```

### 4.3. Despliegue en Producción (Vercel)

1. Conectar repositorio a Vercel
2. En **Settings > Environment Variables**, añadir:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy automático en cada push a `main`

---

## 🎨 FASE 5: Personalización del Negocio

### 5.1. Datos del Negocio (Base de Datos)

Insertar en la tabla `app_settings`:

```sql
INSERT INTO app_settings (key, value, description) VALUES
  ('business_name', 'Mi Academia de Coaching', 'Nombre del negocio'),
  ('business_email', 'contacto@minegocio.com', 'Email de contacto'),
  ('business_phone', '+34 600 123 456', 'Teléfono principal'),
  ('business_iban', 'ES12 1234 5678 9012 3456 7890', 'Cuenta bancaria para pagos'),
  ('contract_legal_name', 'MI NEGOCIO SL', 'Razón social para contratos'),
  ('contract_cif', 'B12345678', 'CIF/NIF para contratos')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

### 5.2. Configurar Métodos de Pago

```sql
INSERT INTO payment_links (name, url, duration_months, is_active) VALUES
  ('Pack 3 meses', 'https://hotmart.com/tu-link-3m', 3, true),
  ('Pack 6 meses', 'https://hotmart.com/tu-link-6m', 6, true),
  ('Pack 12 meses', 'https://hotmart.com/tu-link-12m', 12, true),
  ('Transferencia Bancaria', 'manual', NULL, true)
ON CONFLICT DO NOTHING;
```

### 5.3. Branding Visual (Código)

Archivos a modificar para personalizar colores y logo:

| Elemento | Archivo | Qué cambiar |
|----------|---------|-------------|
| **Logo** | `public/logo.png` | Reemplazar imagen |
| **Favicon** | `public/favicon.ico` | Reemplazar icono |
| **Colores** | `tailwind.config.js` | Paleta de colores |
| **Título** | `index.html` | `<title>` y meta tags |

---

## 🏁 FASE 6: Verificación Final

### Checklist de Puesta en Marcha

```
┌─────────────────────────────────────────────────────────────────────┐
│ VERIFICACIÓN FINAL                                                  │
├─────────────────────────────────────────────────────────────────────┤
│ BASE DE DATOS                                                       │
│ [ ] Tablas core creadas (users, sales, clientes_ado_notion)         │
│ [ ] RLS activado en todas las tablas                                │
│ [ ] Buckets de storage creados (receipts, contracts, invoices)      │
│ [ ] Usuario Admin creado y funcional                                │
│                                                                     │
│ FRONTEND                                                            │
│ [ ] Variables de entorno configuradas                               │
│ [ ] Build sin errores (npm run build)                               │
│ [ ] Desplegado en hosting (Vercel/Netlify)                          │
│ [ ] Dominio personalizado configurado (opcional)                    │
│ [ ] SSL/HTTPS activo                                                │
│                                                                     │
│ FUNCIONAL                                                           │
│ [ ] Login de Admin funciona                                         │
│ [ ] Se puede crear una venta de prueba                              │
│ [ ] El enlace de onboarding funciona                                │
│ [ ] Se puede subir un archivo (comprobante)                         │
│ [ ] Dashboard muestra datos correctamente                           │
│                                                                     │
│ OPCIONAL                                                            │
│ [ ] Webhook de N8N recibe eventos                                   │
│ [ ] Emails automáticos configurados                                 │
│ [ ] Backup automático de Supabase activado                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 FASE 7: Primeros Pasos Post-Instalación

### 7.1. Crear el Equipo Inicial

Una vez dentro como Admin:

1. Ir a **Organización > Gestión de Staff**
2. Utilizar el botón **"Invitar al Equipo"** para generar enlaces de acceso para:
   - Coaches
   - Closers
   - Contabilidad / RRSS

### 7.2. Configurar Plantilla de Contrato

1. Ir a **Configuración > Plantillas**
2. Editar el contrato base con los datos legales de tu negocio
3. Revisar cláusulas de protección de datos (RGPD)

### 7.3. Realizar Venta de Prueba

1. Crear una venta ficticia con datos de prueba
2. Verificar que se genera el enlace de onboarding
3. Completar el flujo de onboarding como cliente
4. Verificar que el cliente aparece en el Dashboard del Coach

---

## 📞 Soporte y Mantenimiento

### Recursos de Ayuda

- **Documentación completa:** Carpeta `docs/manual_operaciones/`
- **Errores comunes:** Ver `7_PROCEDIMIENTOS_ESPECIALES_Y_SOPORTE.md`
- **Mejoras planificadas:** Ver `LISTADO_MEJORAS_DETECTADAS.md`

### Actualizaciones del Sistema

Para actualizar a nuevas versiones:

```bash
# 1. Hacer backup de .env.local
cp .env.local .env.local.backup

# 2. Actualizar código
git pull origin main

# 3. Instalar nuevas dependencias
npm install

# 4. Ejecutar migraciones SQL si las hay
# (Revisar carpeta database/ por nuevos scripts)

# 5. Redesplegar
npm run build
```

---

## 📄 Anexo: Estructura de Tablas Principales

| Tabla | Propósito | Campos Clave |
|-------|-----------|--------------|
| `users` | Staff del negocio | id, email, role, name |
| `clientes_ado_notion` | Clientes/Alumnos | id, property_email, status, property_coach |
| `sales` | Registro de ventas | id, client_email, amount, onboarding_token |
| `coach_invoices` | Facturas de colaboradores | id, coach_id, amount, status |
| `app_settings` | Configuración global | key, value |

---

*Documento de instalación - CRM Coaching v1.0*
*Adaptable a cualquier negocio de servicios de acompañamiento*
