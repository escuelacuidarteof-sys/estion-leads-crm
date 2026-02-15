-- Migration: Add project differentiation for leads and sales
-- Projects: Academia de Diabetes Online (ADO) and Medico Emprendedor (ME)

-- 1. Add project column to 'leads' table
ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS project TEXT DEFAULT 'ADO'; -- Default to Academia de Diabetes

-- 2. Add project column to 'sales' table
ALTER TABLE sales 
  ADD COLUMN IF NOT EXISTS project TEXT DEFAULT 'ADO';

-- 3. Update existing data if necessary (defaults to ADO as it was the main project)
-- UPDATE leads SET project = 'ADO' WHERE project IS NULL;
-- UPDATE sales SET project = 'ADO' WHERE project IS NULL;

-- 4. Add comments
COMMENT ON COLUMN leads.project IS 'Project specific to the lead: ADO (Academia de Diabetes) or ME (Medico Emprendedor)';
COMMENT ON COLUMN sales.project IS 'Project specific to the sale: ADO or ME';
