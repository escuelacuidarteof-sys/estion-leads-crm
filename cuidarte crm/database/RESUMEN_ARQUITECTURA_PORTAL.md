# 📊 Resumen Ejecutivo - Arquitectura de Datos para Portal del Cliente

## 🎯 **Objetivo**
Crear un portal donde los clientes puedan ver su progreso de forma visual, práctica y WOW.

---

## 📋 **DATOS ACTUALES**

### ✅ **Lo que YA tienes** (97 campos en `clientes_ado_notion`)

#### **Datos Suficientes para Mostrar**:
- ✅ Información personal (nombre, email, edad, etc.)
- ✅ Peso actual, inicial y objetivo
- ✅ Datos médicos (diabetes, HbA1c actual, glucosa actual)
- ✅ Plan nutricional (URL del PDF)
- ✅ Objetivos y motivación
- ✅ Fase del programa
- ✅ Fecha de fin de contrato
- ✅ Coach asignado
- ✅ Última revisión semanal (URL de Loom)

#### **Datos que FALTAN para mostrar progreso**:
- ❌ **Historial de peso** (solo tienes peso actual e inicial)
- ❌ **Historial de glucosa** (solo tienes valor actual)
- ❌ **Historial de HbA1c** (solo tienes valor actual)
- ❌ **Registro de comidas** (fotos, adherencia)
- ❌ **Actividad física** (pasos, ejercicios)
- ❌ **Check-ins diarios** (ánimo, energía, sueño)
- ❌ **Historial de revisiones** (solo tienes la última)

---

## 🗄️ **TABLAS NUEVAS A CREAR**

### **Fase 1: CRÍTICAS** ⚠️ (Para mostrar progreso básico)

#### 1. **`weight_history`** - Historial de Peso
```
Para mostrar:
📊 Gráfico de evolución de peso
📈 Tendencia (↑↓)
🎯 Progreso hacia objetivo
```

#### 2. **`glucose_readings`** - Lecturas de Glucosa
```
Para mostrar:
📈 Gráfico de glucosa diaria
📊 Promedio semanal
⚠️ Alertas si fuera de rango
🎯 Tiempo en rango (TIR)
```

#### 3. **`hba1c_history`** - Historial de HbA1c
```
Para mostrar:
📊 Evolución trimestral
📈 Comparación con objetivo (<7%)
✅ Tendencia de mejora
```

---

### **Fase 2: IMPORTANTES** (Para experiencia completa)

#### 4. **`meal_logs`** - Registro de Comidas
```
Para mostrar:
🍽️ Diario de comidas con fotos
⭐ Adherencia semanal
💬 Feedback del coach
```

#### 5. **`activity_logs`** - Actividad Física
```
Para mostrar:
🏃 Pasos diarios
⏱️ Minutos de ejercicio
🔥 Calorías quemadas
```

#### 6. **`daily_checkins`** - Check-ins Diarios
```
Para mostrar:
😊 Estado de ánimo
⚡ Nivel de energía
😴 Calidad de sueño
✅ Adherencia
```

#### 7. **`coaching_sessions`** - Sesiones con Coach
```
Para mostrar:
🎬 Historial de revisiones
📝 Resúmenes
✅ Tareas asignadas
```

---

### **Fase 3: OPCIONALES** (Para gamificación y engagement)

#### 8. **`achievements`** - Logros
#### 9. **`messages`** - Chat con Coach
#### 10. **`notifications`** - Notificaciones

---

## 📱 **PORTAL DEL CLIENTE - Vista Principal**

### **Dashboard que verá el cliente**:

```
┌─────────────────────────────────────────────────────────┐
│ ¡Hola Juan! 👋                                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 🎯 TU PROGRESO                                          │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Peso: 95kg → 87kg → 80kg (objetivo)            │   │
│ │ [████████████░░░░░░] 53% completado             │   │
│ │ -8kg perdidos 🎉                                │   │
│ │                                                 │   │
│ │ HbA1c: 7.2% → 6.4% (-0.8%) ✅                  │   │
│ │ Glucosa Promedio: 142 mg/dL (↓ desde 168)      │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ 📊 GRÁFICO DE PESO (últimos 30 días)                   │
│ ┌─────────────────────────────────────────────────┐   │
│ │     📈                                          │   │
│ │   90kg ●─────●                                  │   │
│ │   88kg      ●─────●                            │   │
│ │   86kg            ●─────●                      │   │
│ │   84kg                  ●─────●                │   │
│ │        Sem1  Sem2  Sem3  Sem4                  │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ 📈 GLUCOSA ESTA SEMANA                                 │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Promedio: 142 mg/dL                            │   │
│ │ Rango objetivo: 80-130 mg/dL                   │   │
│ │ Tiempo en rango: 68% ⚠️                        │   │
│ │ [Ver gráfico detallado →]                      │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ 🎬 TU ÚLTIMA REVISIÓN                                   │
│ ┌─────────────────────────────────────────────────┐   │
│ │ [▶️ Ver video] Ana García - 8 Dic 2025         │   │
│ │ Duración: 8:32                                  │   │
│ │                                                 │   │
│ │ Resumen:                                        │   │
│ │ ✅ Excelente progreso en peso                   │   │
│ │ ✅ Glucosas muy estables                        │   │
│ │ ⚠️ Aumentar proteína en desayuno               │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ 📝 TU PLAN HOY                                          │
│ [Ver plan nutricional PDF →]                           │
│                                                         │
│ 💬 CHAT CON TU COACH                                    │
│ Ana García está disponible                              │
│ [Enviar mensaje →]                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 **DE DÓNDE SALEN LOS DATOS**

### **Datos del Dashboard**:

| Dato Mostrado | Fuente | Tabla | Estado |
|---------------|--------|-------|--------|
| Peso Inicial | ✅ Existe | `clientes_ado_notion.initial_weight` | Listo |
| Peso Actual | ✅ Existe | `clientes_ado_notion.current_weight` | Listo |
| Peso Objetivo | ✅ Existe | `clientes_ado_notion.target_weight` | Listo |
| **Gráfico de Peso** | ❌ Falta | `weight_history` | **Crear tabla** |
| HbA1c Actual | ✅ Existe | `clientes_ado_notion.medical.lastHba1c` | Listo |
| HbA1c Inicial | ✅ Existe | `clientes_ado_notion.medical.initialHba1c` | Listo |
| **Evolución HbA1c** | ❌ Falta | `hba1c_history` | **Crear tabla** |
| Glucosa Actual | ✅ Existe | `clientes_ado_notion.medical.glucoseFastingCurrent` | Listo |
| **Gráfico Glucosa** | ❌ Falta | `glucose_readings` | **Crear tabla** |
| **Promedio Semanal** | ❌ Falta | `glucose_readings` | **Crear tabla** |
| Última Revisión | ✅ Existe | `clientes_ado_notion.weeklyReviewUrl` | Listo |
| **Historial Revisiones** | ❌ Falta | `coaching_sessions` | **Crear tabla** |
| Plan Nutricional | ✅ Existe | `clientes_ado_notion.nutrition.planUrl` | Listo |
| Coach Asignado | ✅ Existe | `clientes_ado_notion.coach_id` | Listo |

---

## 🚀 **PLAN DE IMPLEMENTACIÓN**

### **Semana 1: Infraestructura de Datos**
```
Día 1-2: Crear tablas críticas
- ✅ weight_history
- ✅ glucose_readings
- ✅ hba1c_history

Día 3-4: Migrar datos existentes
- ✅ Peso inicial y actual
- ✅ HbA1c inicial y actual (si está en JSON)

Día 5: Probar inserciones
- ✅ Insertar datos de prueba
- ✅ Verificar RLS funciona
```

### **Semana 2: Portal Básico**
```
Día 1-2: Componente de Dashboard
- ✅ Mostrar progreso de peso
- ✅ Mostrar HbA1c actual

Día 3-4: Gráficos
- ✅ Gráfico de evolución de peso
- ✅ Gráfico de glucosa

Día 5: Revisión Semanal
- ✅ Mostrar último video de Loom
- ✅ Resumen del coach
```

### **Semana 3: Funcionalidades Adicionales**
```
Día 1-2: Registro de datos
- ✅ Formulario para registrar peso
- ✅ Formulario para registrar glucosa

Día 3-4: Tablas adicionales
- ✅ meal_logs
- ✅ daily_checkins

Día 5: Pulir UI/UX
- ✅ Animaciones
- ✅ Responsive mobile
```

---

## 📊 **PRIORIZACIÓN**

### **Must Have** (Semana 1-2)
1. ✅ Tabla `weight_history`
2. ✅ Tabla `glucose_readings`
3. ✅ Tabla `hba1c_history`
4. ✅ Dashboard con progreso básico
5. ✅ Gráfico de peso
6. ✅ Mostrar última revisión

### **Should Have** (Semana 3)
7. ✅ Gráfico de glucosa
8. ✅ Registro de peso/glucosa
9. ✅ Tabla `coaching_sessions`
10. ✅ Historial de revisiones

### **Nice to Have** (Semana 4+)
11. ✅ Tabla `meal_logs`
12. ✅ Tabla `daily_checkins`
13. ✅ Gamificación (logros)
14. ✅ Chat con coach
15. ✅ Notificaciones

---

## 🔒 **SEGURIDAD Y PRIVACIDAD**

### **Row Level Security (RLS)**
```sql
-- Los clientes SOLO ven sus propios datos
CREATE POLICY "Clients see own data"
  ON weight_history
  FOR SELECT
  USING (client_id = current_user_id);

-- Los coaches ven datos de TODOS sus clientes
-- Los admins ven TODO
```

### **Datos Visibles vs Ocultos**

#### ✅ **Cliente VE**:
- Su progreso (peso, glucosa, HbA1c)
- Su plan nutricional
- Sus revisiones con el coach
- Sus objetivos
- Su coach asignado

#### ❌ **Cliente NO VE**:
- Datos de otros clientes
- Notas internas del coach
- Información financiera (pagos, LTV)
- Datos administrativos
- Campos de CRM interno

---

## 💰 **ESTIMACIÓN DE ESFUERZO**

### **Desarrollo**
- Crear tablas: **4 horas**
- Migrar datos: **2 horas**
- Portal básico: **16 horas**
- Gráficos: **8 horas**
- Registro de datos: **8 horas**
- **Total**: ~38 horas (1 semana de trabajo)

### **Infraestructura**
- Supabase (ya tienes): **0€**
- Storage para fotos: **~5€/mes**

---

## 📚 **Documentación Creada**

1. **`ARQUITECTURA_DATOS_PORTAL.md`** - Análisis completo
2. **`create_portal_tables_phase1.sql`** - Script SQL para crear tablas
3. **Este resumen ejecutivo**

---

## ✅ **Próximo Paso Inmediato**

### **Acción 1: Crear Tablas en Supabase**
```
1. Abre Supabase Dashboard
2. Ve a SQL Editor
3. Ejecuta: database/create_portal_tables_phase1.sql
4. Verifica que se crearon las 3 tablas
```

### **Acción 2: Insertar Datos de Prueba**
```sql
-- Insertar peso de prueba
INSERT INTO weight_history (client_id, date, weight, source)
VALUES ('tu_client_id', '2025-12-01', 90.5, 'manual');

-- Insertar glucosa de prueba
INSERT INTO glucose_readings (client_id, date, time, value, type)
VALUES ('tu_client_id', '2025-12-12', '08:00', 120, 'fasting');
```

### **Acción 3: Implementar Portal Básico**
```
Crear componente: ClientPortalDashboard.tsx
- Mostrar progreso de peso
- Mostrar gráfico de peso
- Mostrar última revisión
```

---

## 🎯 **Resultado Final**

Un portal donde el cliente verá:
- ✅ Su progreso visual y motivador
- ✅ Gráficos claros de su evolución
- ✅ Su plan y objetivos
- ✅ Comunicación con su coach
- ✅ Experiencia WOW que lo motive a seguir

---

**¿Empezamos creando las tablas?** 🚀

Puedo ayudarte a:
1. Ejecutar el script SQL en Supabase
2. Verificar que funcionó
3. Insertar datos de prueba
4. Empezar a construir el portal

¡Dime qué prefieres! 💪
