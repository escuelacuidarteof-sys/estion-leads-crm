# 🚀 Guía Rápida de Inicio

## Academia Diabetes Online CRM - Versión 2.0.0

---

## ⚡ Inicio Rápido (5 minutos)

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Iniciar Aplicación
```bash
npm run dev
```

### 3. Abrir en Navegador
```
http://localhost:5173
```

### 4. Iniciar Sesión
```
Email: admin@demo.com
Password: (cualquiera)
```

¡Listo! 🎉

---

## 📚 Documentación Completa

### Archivos de Documentación
- 📖 `README.md` - Documentación principal
- ✨ `MEJORAS_IMPLEMENTADAS.md` - Detalles de mejoras v2.0
- 📊 `RESUMEN_EJECUTIVO.md` - Resumen ejecutivo
- 📝 `CHANGELOG.md` - Historial de versiones

---

## 🎯 Características Principales

### Dashboard
- Métricas en tiempo real
- KPI Cards con gradientes
- Alertas visuales
- Gráficos interactivos

### Gestión de Clientes
- CRUD completo
- Búsqueda y filtros
- Seguimiento médico
- Planes nutricionales

### Notificaciones
- Toast notifications
- 4 tipos (Success, Error, Warning, Info)
- Auto-dismiss

---

## 🔑 Credenciales de Prueba

### Admin (Acceso Completo)
```
Email: admin@demo.com
```

### Coach (Vista Limitada)
```
Email: coach@demo.com
```

### Cliente (Solo Lectura)
```
Email: (cualquier email de cliente)
```

---

## 🛠️ Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Preview
npm run preview

# Limpiar cache
rm -rf node_modules
npm install
```

---

## 🎨 Nuevas Características v2.0

### ✨ Sistema de Notificaciones
```typescript
import { useToast } from './components/ToastProvider';

const toast = useToast();
toast.success("¡Operación exitosa!");
toast.error("Error al guardar");
toast.warning("Advertencia");
toast.info("Información");
```

### 📅 Utilidades de Fechas
```typescript
import { formatDate, isExpired, getDaysRemaining } from './utils/dateHelpers';

formatDate(date); // "12 dic 2025"
isExpired(date); // true/false
getDaysRemaining(date); // 15
```

### 🎯 Utilidades de Estados
```typescript
import { getStatusConfig } from './utils/statusHelpers';

const config = getStatusConfig(ClientStatus.ACTIVE);
// { color, label, icon, description }
```

### 💰 Formateadores
```typescript
import { formatCurrency, formatWeight } from './utils/formatters';

formatCurrency(1500); // "1.500,00 €"
formatWeight(75.5); // "75,5 kg"
```

---

## 🎨 Clases CSS Premium

### Botones
```html
<button class="btn-primary">Primario</button>
<button class="btn-success">Éxito</button>
<button class="btn-danger">Peligro</button>
```

### Inputs
```html
<input class="input-enhanced" />
```

### Gradientes
```html
<div class="gradient-bg-primary">Fondo con gradiente</div>
<h1 class="gradient-text">Texto con gradiente</h1>
```

### Animaciones
```html
<div class="shimmer">Brillo</div>
<div class="pulse-glow">Pulso</div>
<div class="float">Flotación</div>
```

---

## 🐛 Solución de Problemas

### Error: "Cannot find module 'react'"
```bash
npm install
```

### Error: Puerto 5173 en uso
```bash
# Cambiar puerto en vite.config.ts
server: { port: 3000 }
```

### Estilos no se aplican
```bash
# Limpiar cache de Vite
rm -rf node_modules/.vite
npm run dev
```

---

## 📞 Soporte

- 📧 Email: info@academia-diabetes.com
- 📚 Docs: Ver `README.md`
- 🐛 Bugs: Abrir issue en GitHub

---

## 🎉 ¡Disfruta la Aplicación!

La aplicación está lista para usar con todas las mejoras de la versión 2.0:

✅ Dashboard premium  
✅ Notificaciones toast  
✅ Búsqueda y filtros  
✅ Gradientes y animaciones  
✅ Utilidades centralizadas  

**¡Explora y disfruta!** 🚀

---

*Última actualización: 12 de Diciembre de 2025*  
*Versión: 2.0.0*
