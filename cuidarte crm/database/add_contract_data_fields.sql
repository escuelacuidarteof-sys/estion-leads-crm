-- Add contract data fields to clientes_ado_notion
-- These fields store the editable contract parameters per client

ALTER TABLE clientes_ado_notion ADD COLUMN IF NOT EXISTS contract_date TEXT;
ALTER TABLE clientes_ado_notion ADD COLUMN IF NOT EXISTS contract_amount NUMERIC DEFAULT 0;
ALTER TABLE clientes_ado_notion ADD COLUMN IF NOT EXISTS contract_financing_installments INTEGER DEFAULT 0;
ALTER TABLE clientes_ado_notion ADD COLUMN IF NOT EXISTS contract_financing_amount NUMERIC DEFAULT 0;
