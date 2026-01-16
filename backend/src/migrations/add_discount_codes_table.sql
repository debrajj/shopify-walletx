-- Create table to track discount codes and prevent reuse
CREATE TABLE IF NOT EXISTS discount_codes (
  id SERIAL PRIMARY KEY,
  store_url VARCHAR(255) NOT NULL,
  discount_code VARCHAR(100) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  coins_redeemed INTEGER NOT NULL,
  discount_amount DECIMAL(10, 2) NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  UNIQUE(store_url, discount_code)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_discount_codes_email ON discount_codes(store_url, customer_email);
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(store_url, discount_code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_used ON discount_codes(store_url, is_used);
