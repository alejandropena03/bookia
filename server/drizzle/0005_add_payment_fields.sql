-- Add payment tracking fields to bookings for Wompi integration
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "payment_status" text DEFAULT 'pending';
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "payment_url" text;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "payment_transaction_id" text;
