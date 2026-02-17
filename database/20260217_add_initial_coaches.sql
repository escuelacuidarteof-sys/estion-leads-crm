-- =====================================================
-- MIGRATION: Add Jesús and Jose Pedro as Coach/Closer
-- Date: 2026-02-17
-- =====================================================

-- 1. Insert Jesús
INSERT INTO public.users (id, name, email, role, status, max_clients, current_clients, available_for_assignment)
VALUES (
    gen_random_uuid(), 
    'Jesús', 
    'jesus@escuelacuidarte.com', -- Cambiar por el email real si es necesario
    'coach', 
    'active',
    50, -- Capacidad máxima por defecto
    0,
    true
)
ON CONFLICT (email) DO UPDATE SET 
    role = 'coach',
    name = 'Jesús',
    available_for_assignment = true;

-- 2. Insert Jose Pedro
INSERT INTO public.users (id, name, email, role, status, max_clients, current_clients, available_for_assignment)
VALUES (
    gen_random_uuid(), 
    'Jose Pedro', 
    'josepedro@escuelacuidarte.com', -- Cambiar por el email real si es necesario
    'coach', 
    'active',
    50, -- Capacidad máxima por defecto
    0,
    true
)
ON CONFLICT (email) DO UPDATE SET 
    role = 'coach',
    name = 'Jose Pedro',
    available_for_assignment = true;

-- NOTA: Como hemos actualizado NewSaleForm.tsx, ahora aparecerán tanto en la
-- lista de Coaches como en la lista de Closers para asignar ventas.
