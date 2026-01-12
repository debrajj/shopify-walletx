-- Create pending_redemptions table for tracking discount codes
CREATE TABLE IF NOT EXISTS pending_redemptions (
  id SERIAL PRIMARY KEY,
  store_url VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  discount_code VARCHAR(100) UNIQUE NOT NULL,
  coins DECIMAL(10, 2) NOT NULL,
  redeemed BOOLEAN DEFAULT FALSE,
  order_id VARCHAR(100),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pending_redemptions_code ON pending_redemptions(discount_code);
CREATE INDEX idx_pending_redemptions_phone ON pending_redemptions(phone);
CREATE INDEX idx_pending_redemptions_expires ON pending_redemptions(expires_at);
