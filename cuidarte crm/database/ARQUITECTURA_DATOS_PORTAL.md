# 🗄️ Arquitectura de Base de Datos - Portal del Cliente

## 📊 **ANÁLISIS DE DATOS ACTUALES**

### **Tabla Actual: `clientes_ado_notion`**

#### ✅ Datos que YA tienes (97 campos)

##### **1. Datos Personales** (10 campos)
```typescript
✅ firstName, surname, name
✅ email, phone
✅ address, city, province
✅ age, birthDate, gender
```

##### **2. Datos Físicos** (8 campos)
```typescript
✅ height
✅ current_weight, initial_weight, target_weight
✅ lost_weight (calculado)
✅ abdominal_perimeter, arm_perimeter, thigh_perimeter
```

##### **3. Datos Médicos** (14 campos)
```typescript
✅ diabetesType, yearsDiagnosed
✅ lastHba1c, initialHba1c
✅ glucoseFastingCurrent, glucoseFastingInitial
✅ pathologies, medication
✅ insulin, insulinBrand, insulinDose, insulinTime
✅ useSensor
✅ otherConditions
```

##### **4. Datos Nutricionales** (24 campos)
```typescript
✅ planUrl (PDF del plan)
✅ allergies, otherAllergies, dislikes
✅ preferences, consumedFoods
✅ cooksForSelf, eatsWithBread, breadAmount
✅ waterIntake, alcohol
✅ cravings, cravingsDetail
✅ snacking, snackingDetail
✅ eatingDisorder, eatingDisorderDetail
✅ schedules (breakfast, lunch, dinner, snacks)
✅ mealsPerDay, mealsOutPerWeek
✅ willingToWeighFood
✅ dietaryNotes, lastRecallMeal
```

##### **5. Datos de Entrenamiento** (6 campos)
```typescript
✅ activityLevel
✅ stepsGoal
✅ strengthTraining
✅ trainingLocation
✅ injuries, notes
✅ availability
```

##### **6. Datos de Objetivos** (8 campos)
```typescript
✅ motivation
✅ goal_3_months, goal_6_months, goal_1_year
✅ weeklyGoal, next4WeeksGoal
✅ possiblePhaseGoals
✅ successStory, testimonial
```

##### **7. Datos de Programa** (35+ campos)
```typescript
✅ phase, subPhase, programType
✅ contract_end_date
✅ f1_endDate, f2_endDate, f3_endDate, f4_endDate, f5_endDate
✅ renewal_f2_contracted, renewal_f3_contracted, etc.
✅ URLs de revisiones (onb_f1, grad_f1, etc.)
✅ Notas por fase
✅ Status por fase
```

##### **8. Datos de Estado** (10 campos)
```typescript
✅ status (active, paused, inactive, dropout)
✅ start_date, registration_date
✅ coach_id
✅ pauseDate, pauseReason
✅ abandonmentDate, abandonmentReason
✅ inactiveDate, inactiveReason
```

##### **9. Revisión Semanal** (2 campos)
```typescript
✅ weeklyReviewUrl (Loom)
✅ weeklyReviewDate
```

---

## ❌ **DATOS QUE FALTAN PARA EL PORTAL DEL CLIENTE**

### **Datos Críticos para Mostrar Progreso**

#### 1. **Historial de Peso** ⚠️ CRÍTICO
```typescript
❌ NO EXISTE tabla de historial de peso
❌ Solo tienes: current_weight, initial_weight

NECESITAS:
- Tabla: weight_history
- Datos: fecha, peso, fuente (manual/báscula)
- Para mostrar: Gráfico de evolución
```

#### 2. **Historial de Glucosa** ⚠️ CRÍTICO
```typescript
❌ NO EXISTE tabla de glucosas
❌ Solo tienes: glucoseFastingCurrent, glucoseFastingInitial

NECESITAS:
- Tabla: glucose_readings
- Datos: fecha, hora, valor, tipo (ayunas/postprandial), notas
- Para mostrar: Gráfico de tendencia, promedio semanal
```

#### 3. **Historial de HbA1c** ⚠️ CRÍTICO
```typescript
❌ NO EXISTE tabla de HbA1c
❌ Solo tienes: lastHba1c, initialHba1c

NECESITAS:
- Tabla: hba1c_history
- Datos: fecha, valor, laboratorio
- Para mostrar: Evolución trimestral
```

#### 4. **Registro de Comidas** ⚠️ MUY IMPORTANTE
```typescript
❌ NO EXISTE tabla de comidas

NECESITAS:
- Tabla: meal_logs
- Datos: fecha, hora, tipo_comida, foto_url, descripción, calorías
- Para mostrar: Diario de comidas, adherencia al plan
```

#### 5. **Registro de Actividad Física** ⚠️ IMPORTANTE
```typescript
❌ NO EXISTE tabla de ejercicios

NECESITAS:
- Tabla: activity_logs
- Datos: fecha, tipo, duración, pasos, calorías_quemadas
- Para mostrar: Actividad semanal, racha de días activos
```

#### 6. **Medidas Corporales** ⚠️ IMPORTANTE
```typescript
❌ NO EXISTE historial de medidas
❌ Solo tienes: valores actuales (abdominal, arm, thigh)

NECESITAS:
- Tabla: body_measurements
- Datos: fecha, cintura, cadera, pecho, brazos, muslos
- Para mostrar: Evolución de medidas
```

#### 7. **Logros y Hitos** ⚠️ IMPORTANTE (Gamificación)
```typescript
❌ NO EXISTE tabla de logros

NECESITAS:
- Tabla: achievements
- Datos: achievement_id, fecha_desbloqueo, puntos
- Para mostrar: Logros desbloqueados, progreso
```

#### 8. **Check-ins Diarios** ⚠️ IMPORTANTE
```typescript
❌ NO EXISTE tabla de check-ins

NECESITAS:
- Tabla: daily_checkins
- Datos: fecha, estado_ánimo, energía, sueño, adherencia
- Para mostrar: Tendencias de bienestar
```

#### 9. **Mensajes/Comunicación** ⚠️ IMPORTANTE
```typescript
❌ NO EXISTE tabla de mensajes

NECESITAS:
- Tabla: messages
- Datos: de, para, mensaje, fecha, leído
- Para mostrar: Chat con coach
```

#### 10. **Sesiones/Revisiones** ⚠️ IMPORTANTE
```typescript
❌ NO EXISTE tabla de sesiones
❌ Solo tienes: weeklyReviewUrl (último)

NECESITAS:
- Tabla: coaching_sessions
- Datos: fecha, tipo, duración, notas, grabación_url
- Para mostrar: Historial de revisiones
```

---

## 🗄️ **ARQUITECTURA DE BASE DE DATOS PROPUESTA**

### **Tablas Existentes**
```
1. ✅ users (ya creada)
2. ✅ clientes_ado_notion (ya existe)
```

### **Tablas NUEVAS a Crear**

#### **Tabla 1: weight_history** ⚠️ CRÍTICO
```sql
CREATE TABLE weight_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT REFERENCES clientes_ado_notion(id),
  date DATE NOT NULL,
  weight DECIMAL(5,2) NOT NULL, -- kg
  source TEXT DEFAULT 'manual', -- 'manual', 'scale', 'coach'
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_weight_client_date ON weight_history(client_id, date DESC);
```

**Uso en Portal**:
```
📊 Gráfico de Evolución de Peso
- Línea de tendencia
- Peso inicial vs actual vs objetivo
- Promedio semanal/mensual
```

---

#### **Tabla 2: glucose_readings** ⚠️ CRÍTICO
```sql
CREATE TABLE glucose_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT REFERENCES clientes_ado_notion(id),
  date DATE NOT NULL,
  time TIME NOT NULL,
  value INTEGER NOT NULL, -- mg/dL
  type TEXT NOT NULL, -- 'fasting', 'postprandial', 'random'
  meal_relation TEXT, -- 'before_breakfast', 'after_lunch', etc.
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_glucose_client_date ON glucose_readings(client_id, date DESC);
```

**Uso en Portal**:
```
📈 Gráfico de Glucosa
- Tendencia diaria/semanal
- Promedio por tipo (ayunas, postprandial)
- Alertas si fuera de rango
- Tiempo en rango (TIR)
```

---

#### **Tabla 3: hba1c_history** ⚠️ CRÍTICO
```sql
CREATE TABLE hba1c_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT REFERENCES clientes_ado_notion(id),
  date DATE NOT NULL,
  value DECIMAL(3,1) NOT NULL, -- %
  laboratory TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_hba1c_client_date ON hba1c_history(client_id, date DESC);
```

**Uso en Portal**:
```
📊 Evolución de HbA1c
- Gráfico trimestral
- Comparación con objetivo (<7%)
- Tendencia de mejora
```

---

#### **Tabla 4: meal_logs** ⚠️ MUY IMPORTANTE
```sql
CREATE TABLE meal_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT REFERENCES clientes_ado_notion(id),
  date DATE NOT NULL,
  time TIME NOT NULL,
  meal_type TEXT NOT NULL, -- 'breakfast', 'lunch', 'dinner', 'snack'
  description TEXT,
  photo_url TEXT,
  calories INTEGER,
  protein DECIMAL(5,1),
  carbs DECIMAL(5,1),
  fats DECIMAL(5,1),
  adherence_score INTEGER, -- 1-5 (coach rating)
  coach_feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_meals_client_date ON meal_logs(client_id, date DESC);
```

**Uso en Portal**:
```
🍽️ Diario de Comidas
- Fotos de comidas
- Feedback del coach
- Adherencia semanal
- Macros consumidos
```

---

#### **Tabla 5: activity_logs** ⚠️ IMPORTANTE
```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT REFERENCES clientes_ado_notion(id),
  date DATE NOT NULL,
  activity_type TEXT NOT NULL, -- 'walking', 'gym', 'cardio', 'strength'
  duration_minutes INTEGER,
  steps INTEGER,
  calories_burned INTEGER,
  intensity TEXT, -- 'low', 'medium', 'high'
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_client_date ON activity_logs(client_id, date DESC);
```

**Uso en Portal**:
```
🏃 Actividad Física
- Pasos diarios
- Minutos de ejercicio
- Calorías quemadas
- Racha de días activos
```

---

#### **Tabla 6: body_measurements** ⚠️ IMPORTANTE
```sql
CREATE TABLE body_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT REFERENCES clientes_ado_notion(id),
  date DATE NOT NULL,
  waist DECIMAL(5,1), -- cm
  hips DECIMAL(5,1),
  chest DECIMAL(5,1),
  arms DECIMAL(5,1),
  thighs DECIMAL(5,1),
  neck DECIMAL(5,1),
  body_fat_percentage DECIMAL(4,1),
  muscle_mass DECIMAL(5,1),
  photos JSONB, -- {front: url, side: url, back: url}
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_measurements_client_date ON body_measurements(client_id, date DESC);
```

**Uso en Portal**:
```
📏 Medidas Corporales
- Evolución de medidas
- Fotos de progreso
- % grasa corporal
```

---

#### **Tabla 7: achievements** ⚠️ IMPORTANTE
```sql
CREATE TABLE achievements (
  id TEXT PRIMARY KEY, -- 'first_week', 'lost_5kg', etc.
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL, -- 'weight', 'glucose', 'adherence', 'habits'
  points INTEGER NOT NULL,
  criteria JSONB NOT NULL -- Condiciones para desbloquear
);

CREATE TABLE client_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT REFERENCES clientes_ado_notion(id),
  achievement_id TEXT REFERENCES achievements(id),
  unlocked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_id, achievement_id)
);

CREATE INDEX idx_client_achievements ON client_achievements(client_id);
```

**Uso en Portal**:
```
🏆 Logros
- Logros desbloqueados
- Progreso hacia próximo logro
- Puntos totales
- Ranking (opcional)
```

---

#### **Tabla 8: daily_checkins** ⚠️ IMPORTANTE
```sql
CREATE TABLE daily_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT REFERENCES clientes_ado_notion(id),
  date DATE NOT NULL,
  mood INTEGER CHECK (mood BETWEEN 1 AND 5), -- 1=😔, 5=😊
  energy INTEGER CHECK (energy BETWEEN 1 AND 5),
  sleep_hours DECIMAL(3,1),
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
  adherence INTEGER CHECK (adherence BETWEEN 1 AND 5),
  water_liters DECIMAL(3,1),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_id, date)
);

CREATE INDEX idx_checkins_client_date ON daily_checkins(client_id, date DESC);
```

**Uso en Portal**:
```
✅ Check-in Diario
- Estado de ánimo
- Nivel de energía
- Calidad de sueño
- Adherencia al plan
```

---

#### **Tabla 9: messages** ⚠️ IMPORTANTE
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id TEXT NOT NULL, -- puede ser client_id o coach_id
  to_user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  attachments JSONB, -- [{type: 'image', url: '...'}]
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(from_user_id, to_user_id, created_at DESC);
CREATE INDEX idx_messages_unread ON messages(to_user_id, read_at) WHERE read_at IS NULL;
```

**Uso en Portal**:
```
💬 Chat con Coach
- Mensajes en tiempo real
- Adjuntar fotos
- Notificaciones de nuevos mensajes
```

---

#### **Tabla 10: coaching_sessions** ⚠️ IMPORTANTE
```sql
CREATE TABLE coaching_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT REFERENCES clientes_ado_notion(id),
  coach_id TEXT REFERENCES users(id),
  date DATE NOT NULL,
  type TEXT NOT NULL, -- 'weekly_review', 'onboarding', 'graduation', etc.
  duration_minutes INTEGER,
  recording_url TEXT, -- Loom o similar
  summary TEXT,
  action_items JSONB, -- [{task: '...', deadline: '...'}]
  client_feedback INTEGER CHECK (client_feedback BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_client_date ON coaching_sessions(client_id, date DESC);
```

**Uso en Portal**:
```
🎬 Historial de Revisiones
- Videos de revisiones semanales
- Resumen de cada sesión
- Tareas asignadas
- Valorar sesión
```

---

#### **Tabla 11: notifications** (Opcional pero útil)
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'reminder', 'achievement', 'message', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
```

---

## 📊 **RESUMEN DE ARQUITECTURA**

### **Tablas Actuales** (2)
1. ✅ `users` - Usuarios del sistema
2. ✅ `clientes_ado_notion` - Datos maestros del cliente

### **Tablas Nuevas Críticas** (3) ⚠️ PRIORIDAD ALTA
3. ❌ `weight_history` - Historial de peso
4. ❌ `glucose_readings` - Lecturas de glucosa
5. ❌ `hba1c_history` - Historial de HbA1c

### **Tablas Nuevas Importantes** (5) ⚠️ PRIORIDAD MEDIA
6. ❌ `meal_logs` - Registro de comidas
7. ❌ `activity_logs` - Actividad física
8. ❌ `body_measurements` - Medidas corporales
9. ❌ `daily_checkins` - Check-ins diarios
10. ❌ `coaching_sessions` - Sesiones con coach

### **Tablas Nuevas Opcionales** (3) ⚠️ PRIORIDAD BAJA
11. ❌ `achievements` + `client_achievements` - Gamificación
12. ❌ `messages` - Chat
13. ❌ `notifications` - Notificaciones

---

## 🎯 **DATOS A MOSTRAR EN PORTAL DEL CLIENTE**

### **Vista Principal - Dashboard**

#### **Sección 1: Progreso General** 🎯
```
DATOS A MOSTRAR:
✅ Peso Inicial → Actual → Objetivo
✅ Kilos perdidos
✅ % de progreso hacia objetivo
✅ HbA1c: Inicial → Actual
✅ Glucosa promedio semanal

FUENTE DE DATOS:
- clientes_ado_notion: initial_weight, current_weight, target_weight
- weight_history: últimos 30 días
- hba1c_history: últimos 2 registros
- glucose_readings: promedio últimos 7 días
```

#### **Sección 2: Esta Semana** 📊
```
DATOS A MOSTRAR:
✅ Adherencia al plan: XX%
✅ Pasos diarios promedio
✅ Agua consumida
✅ Sueño promedio
✅ Estado de ánimo

FUENTE DE DATOS:
- daily_checkins: últimos 7 días
- activity_logs: últimos 7 días
- meal_logs: adherencia últimos 7 días
```

#### **Sección 3: Revisión Semanal** 🎬
```
DATOS A MOSTRAR:
✅ Video de la última revisión
✅ Fecha de la revisión
✅ Resumen del coach
✅ Tareas asignadas
✅ Próxima revisión programada

FUENTE DE DATOS:
- coaching_sessions: última sesión
- clientes_ado_notion: weeklyReviewUrl (legacy)
```

#### **Sección 4: Plan de Hoy** 📝
```
DATOS A MOSTRAR:
✅ Plan nutricional del día
✅ Comidas programadas
✅ Ejercicio programado
✅ Check-in pendiente

FUENTE DE DATOS:
- clientes_ado_notion: nutrition.planUrl
- meal_logs: comidas de hoy
- activity_logs: actividad de hoy
- daily_checkins: check-in de hoy
```

---

### **Vista Secundaria - Progreso Detallado**

#### **Tab 1: Peso y Medidas** 📏
```
DATOS A MOSTRAR:
✅ Gráfico de evolución de peso (30/90 días)
✅ Tendencia (↑↓)
✅ Promedio semanal
✅ Medidas corporales (tabla)
✅ Fotos de progreso

FUENTE DE DATOS:
- weight_history: todos los registros
- body_measurements: todos los registros
```

#### **Tab 2: Glucosa y HbA1c** 📈
```
DATOS A MOSTRAR:
✅ Gráfico de glucosa (7/30 días)
✅ Promedio por tipo (ayunas, postprandial)
✅ Tiempo en rango (TIR)
✅ Evolución de HbA1c (trimestral)

FUENTE DE DATOS:
- glucose_readings: todos los registros
- hba1c_history: todos los registros
```

#### **Tab 3: Nutrición** 🍽️
```
DATOS A MOSTRAR:
✅ Diario de comidas (fotos)
✅ Adherencia semanal/mensual
✅ Feedback del coach
✅ Plan nutricional (PDF)

FUENTE DE DATOS:
- meal_logs: todos los registros
- clientes_ado_notion: nutrition.planUrl
```

#### **Tab 4: Actividad** 🏃
```
DATOS A MOSTRAR:
✅ Pasos diarios (gráfico)
✅ Minutos de ejercicio
✅ Calorías quemadas
✅ Racha de días activos

FUENTE DE DATOS:
- activity_logs: todos los registros
```

#### **Tab 5: Logros** 🏆
```
DATOS A MOSTRAR:
✅ Logros desbloqueados
✅ Progreso hacia próximo logro
✅ Puntos totales
✅ Racha actual

FUENTE DE DATOS:
- client_achievements: logros del cliente
- achievements: catálogo de logros
```

---

### **Vista Terciaria - Comunicación**

#### **Chat con Coach** 💬
```
DATOS A MOSTRAR:
✅ Historial de mensajes
✅ Enviar mensaje
✅ Adjuntar foto
✅ Indicador de "escribiendo..."

FUENTE DE DATOS:
- messages: todos los mensajes
```

#### **Historial de Revisiones** 🎬
```
DATOS A MOSTRAR:
✅ Lista de todas las revisiones
✅ Videos (Loom)
✅ Resúmenes
✅ Tareas asignadas

FUENTE DE DATOS:
- coaching_sessions: todas las sesiones
```

---

## 🔒 **PRIVACIDAD Y SEGURIDAD**

### **Datos VISIBLES para el Cliente** ✅
- ✅ Su propio progreso (peso, glucosa, HbA1c)
- ✅ Su plan nutricional
- ✅ Sus comidas y actividades
- ✅ Sus revisiones con el coach
- ✅ Sus logros
- ✅ Mensajes con su coach

### **Datos NO VISIBLES para el Cliente** ❌
- ❌ Datos de otros clientes
- ❌ Notas internas del coach (si las hay)
- ❌ Información financiera (pagos, LTV)
- ❌ Datos administrativos (harbiz_profile, unikey)
- ❌ Campos internos de CRM

### **Row Level Security (RLS)**
```sql
-- Política: Clientes solo ven sus propios datos
CREATE POLICY "Clients see only their data"
  ON weight_history
  FOR SELECT
  USING (client_id = auth.uid()::text);

-- Aplicar a todas las tablas nuevas
```

---

## 📋 **PLAN DE MIGRACIÓN DE DATOS**

### **Paso 1: Crear Tablas Nuevas**
- Ejecutar scripts SQL de creación
- Configurar índices
- Habilitar RLS

### **Paso 2: Migrar Datos Existentes**
```sql
-- Migrar peso inicial a weight_history
INSERT INTO weight_history (client_id, date, weight, source)
SELECT id, start_date, initial_weight, 'initial'
FROM clientes_ado_notion
WHERE initial_weight IS NOT NULL;

-- Migrar peso actual a weight_history
INSERT INTO weight_history (client_id, date, weight, source)
SELECT id, COALESCE(last_weight_date, updated_at::date), current_weight, 'current'
FROM clientes_ado_notion
WHERE current_weight IS NOT NULL;

-- Migrar HbA1c inicial
INSERT INTO hba1c_history (client_id, date, value)
SELECT id, start_date, CAST(initialHba1c AS DECIMAL)
FROM clientes_ado_notion, 
     LATERAL jsonb_extract_path_text(medical::jsonb, 'initialHba1c') AS initialHba1c
WHERE initialHba1c IS NOT NULL AND initialHba1c != '';

-- Migrar HbA1c actual
INSERT INTO hba1c_history (client_id, date, value)
SELECT id, updated_at::date, CAST(lastHba1c AS DECIMAL)
FROM clientes_ado_notion,
     LATERAL jsonb_extract_path_text(medical::jsonb, 'lastHba1c') AS lastHba1c
WHERE lastHba1c IS NOT NULL AND lastHba1c != '';
```

### **Paso 3: Poblar Logros**
```sql
-- Insertar catálogo de logros
INSERT INTO achievements (id, title, description, icon, category, points, criteria) VALUES
('first_week', 'Primera Semana Completa', 'Completaste tu primera semana', '🎉', 'habits', 100, '{"days": 7}'),
('lost_5kg', 'Pérdida de 5kg', 'Has perdido 5kg', '🏆', 'weight', 500, '{"weight_lost": 5}'),
('streak_30', 'Racha de 30 días', '30 días seguidos registrando', '🔥', 'adherence', 1000, '{"streak_days": 30}'),
-- ... más logros
;
```

---

## 🚀 **PRÓXIMOS PASOS**

### **Fase 1: Crear Infraestructura** (1 semana)
1. Crear tablas críticas (weight, glucose, hba1c)
2. Migrar datos existentes
3. Configurar RLS

### **Fase 2: Implementar Portal Básico** (2 semanas)
1. Dashboard con progreso
2. Gráficos de peso y glucosa
3. Revisión semanal

### **Fase 3: Funcionalidades Avanzadas** (2 semanas)
1. Registro de comidas
2. Check-in diario
3. Logros y gamificación

### **Fase 4: Comunicación** (1 semana)
1. Chat con coach
2. Notificaciones

---

*Análisis creado: 12 de Diciembre de 2025*  
*Versión: 1.0*
