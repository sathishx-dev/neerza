-- Supabase PostgreSQL Setup Script
-- Copy and paste this into the Supabase SQL Editor (found in your project dashboard)

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  mobile VARCHAR(15) NOT NULL,
  address TEXT NOT NULL,
  otp VARCHAR(6),
  otp_expiry TIMESTAMPTZ,
  is_verified BOOLEAN DEFAULT FALSE,
  role VARCHAR(20) DEFAULT 'customer',
  login_attempts INT DEFAULT 0,
  lockout_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(100) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  address TEXT NOT NULL,
  cans INT NOT NULL,
  total_price INT NOT NULL,
  payment_method VARCHAR(20) NOT NULL,
  order_status VARCHAR(20) DEFAULT 'Pending',
  order_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Enable Realtime Replication
-- This allows the Admin Dashboard to receive live updates without Socket.IO
-- Note: If you get an error that the publication exists, you can skip this or use "ALTER PUBLICATION"
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE orders, users;
COMMIT;
