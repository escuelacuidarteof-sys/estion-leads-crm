-- Fix menstrual_cycles client_id type mismatch
-- The current client_id column is 'text' while clients.id is 'uuid'
-- This script changes the column type to uuid and restores the foreign key

ALTER TABLE IF EXISTS menstrual_cycles 
DROP CONSTRAINT IF EXISTS menstrual_cycles_client_id_fkey;

ALTER TABLE IF EXISTS menstrual_cycles 
ALTER COLUMN client_id TYPE uuid USING client_id::uuid;

ALTER TABLE IF EXISTS menstrual_cycles 
ADD CONSTRAINT menstrual_cycles_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
