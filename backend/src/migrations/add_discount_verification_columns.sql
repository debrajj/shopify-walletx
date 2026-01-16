-- Migration: Add verification columns to discount_codes table
-- Date: 2026-01-17
-- Purpose: Track discount verification status and actual amounts

-- Add new columns for discount verification
ALTER TABLE discount_codes 
ADD COLUMN IF NOT EXISTS actual_discount_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS shopify_discount_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS amount_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS amount_mismatch BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;

-- Add index on shopify_discount_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_discount_codes_shopify_id ON discount_codes(shopify_discount_id);

-- Add index on amount_mismatch for monitoring queries
CREATE INDEX IF NOT EXISTS idx_discount_codes_mismatch ON discount_codes(amount_mismatch) WHERE amount_mismatch = TRUE;

-- Add comment to table
COMMENT ON COLUMN discount_codes.actual_discount_amount IS 'Verified discount amount from Shopify API';
COMMENT ON COLUMN discount_codes.shopify_discount_id IS 'Shopify discount node ID for verification';
COMMENT ON COLUMN discount_codes.amount_verified IS 'Whether the discount amount was verified';
COMMENT ON COLUMN discount_codes.amount_mismatch IS 'Whether there was a mismatch between requested and actual amount';
COMMENT ON COLUMN discount_codes.verified_at IS 'Timestamp when discount was verified';
