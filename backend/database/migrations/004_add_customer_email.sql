-- Add customer_email column to wallets table
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_wallets_email ON wallets(customer_email, store_url);
