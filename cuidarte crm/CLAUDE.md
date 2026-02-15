# Instrucciones Técnicas para Claude

Este documento contiene información técnica esencial del proyecto para referencia rápida.

---

## Despliegue

### Repositorio y CI/CD
- **Repositorio**: GitHub (`academiadiabetesonline-glitch/crm_ado`)
- **Despliegue**: Automático al hacer push a `main` (GitHub Pages/Actions)
- **NO usar**: Netlify, Vercel, ni otros servicios

### Proceso de Despliegue
```bash
npm run build          # Genera /dist
git add .
git commit -m "mensaje"
git push origin main   # Dispara despliegue automático
```

---

## Base de Datos

### Supabase
- **URL**: `https://zugtswtpoohnpycnjwrp.supabase.co`
- **Tabla principal de clientes**: `clientes_ado_notion`

### Campos Importantes
| Campo BD | Campo App | Descripción |
|----------|-----------|-------------|
| `property_coach` | `coach_id` | Coach asignado (puede ser NOMBRE o UUID) |
| `property_nombre` | `firstName` | Nombre del cliente |
| `property_correo_electr_nico` | `email` | Email del cliente |
| `status` | `status` | Estado: active, paused, inactive, dropout |

---

## Filtrado de Coaches

### Importante
El campo `property_coach` puede contener:
1. **Nombre del coach**: "Jesús", "Juan", "Helena"
2. **UUID del coach**: "dec087e2-3bf5-43c7-8561-d22c049948db"

### Query de Filtrado (mockSupabase.ts)
```typescript
.or(`property_coach.ilike.%${firstName}%,property_coach.ilike.%${emailPrefix}%,property_coach.eq.${coachName},property_coach.eq.${coachId}`)
```

El filtro busca por:
- Nombre parcial (firstName)
- Prefijo de email
- Nombre completo
- UUID del coach

### Si un coach no ve sus clientes
1. Verificar qué valor tiene `property_coach` en la BD
2. Si es UUID, verificar que coincida con el `id` del usuario coach
3. Si es nombre, verificar que coincida con el nombre del coach

---

## Revisiones Semanales (Check-ins)

### Ciclo Semanal
- **Viernes a Domingo**: Clientes envían check-in
- **Lunes a Martes**: Coaches revisan
- **Semana**: Viernes a Jueves (no Lunes a Domingo)

### Estados
| Estado | Descripción |
|--------|-------------|
| `sin enviar` | Cliente no ha enviado esta semana |
| `pendientes de revisión` | Enviado, esperando coach |
| `revisados` | Coach ya revisó |

### Campos Relevantes
- `last_checkin_date`: Fecha de último envío
- `last_checkin_status`: pending, reviewed
- `last_checkin_reviewed_at`: Cuándo revisó el coach

---

## Persistencia de Sesión

### Implementación
- **Storage**: `localStorage` con clave `ado_crm_session`
- **Duración**: 30 días
- **Datos guardados**: Usuario + timestamp

### Código (App.tsx)
```typescript
const SESSION_KEY = 'ado_crm_session';
localStorage.setItem(SESSION_KEY, JSON.stringify({
  user: loggedUser,
  timestamp: Date.now()
}));
```

---

## Pausas de Contrato

### Servicio: `pauseService.ts`
- **Tabla**: `contract_pauses`
- **Al pausar**: Crea registro en `contract_pauses` + actualiza `status` a PAUSED
- **Al reactivar**: Cierra registro + suma días a `contract_end_date` + status ACTIVE

### Tabla correcta
Usar `clientes_ado_notion` (NO `clients`)

---

## Estructura de Archivos Clave

```
App.tsx                      # Componente principal, routing, estado global
services/
  mockSupabase.ts           # Capa de abstracción de BD, mapeo de datos
  supabaseClient.ts         # Conexión Supabase
  pauseService.ts           # Lógica de pausas
components/
  Dashboard.tsx             # Dashboard coach
  ExecutiveDashboard.tsx    # Dashboard admin/head_coach
  ClientList.tsx            # Lista de clientes
  ReviewsView.tsx           # Panel de revisiones semanales
  client-portal/            # Componentes del portal del cliente
```

---

## Roles de Usuario

| Rol | Vista por defecto | Permisos |
|-----|-------------------|----------|
| admin | ExecutiveDashboard | Todo |
| head_coach | ExecutiveDashboard | Todo |
| coach | Dashboard | Solo sus clientes |
| closer | CloserDashboard | Ventas |
| endocrino | EndocrinoDashboard | Revisiones médicas |
| contabilidad | AccountingDashboard | Facturación |
| client | ClientPortal | Solo su ficha |

---

## Problemas Comunes y Soluciones

### Carga lenta
- Verificar que `fetchClients` no se llame múltiples veces
- Usar `useRef` para controlar ejecuciones únicas

### Coach no ve clientes
- Verificar `property_coach` en BD (puede ser nombre o UUID)
- El filtro debe incluir búsqueda por ambos

### Supabase timeout (code 57014)
- Optimizar queries con filtros en BD
- No cargar SELECT * sin filtros para coaches

---

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Consultar cliente específico en BD (desde Node)
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('URL', 'KEY');
supabase.from('clientes_ado_notion')
  .select('property_nombre, property_coach, status')
  .ilike('property_nombre', '%Nombre%')
  .then(console.log);
"
```

---

*Última actualización: 26 de Enero de 2026*
