-- Run this in your Supabase SQL Editor to create the necessary tables

-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  member_id TEXT UNIQUE,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  profile_pic TEXT,
  role TEXT DEFAULT 'member',
  status TEXT DEFAULT 'pending',
  deactivation_request INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments Table
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  amount INTEGER NOT NULL,
  month TEXT NOT NULL,
  method TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,
  user_id INTEGER REFERENCES users(id),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Slider Images Table
CREATE TABLE slider_images (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL
);

-- Settings Table
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Initial Settings
INSERT INTO settings (key, value) VALUES 
('bkash_number', '017XXXXXXXX'),
('nagad_number', '018XXXXXXXX'),
('admin_phone', '01700000000'),
('admin_name', 'Admin'),
('admin_profile_pic', '');

-- Initial Slider Images
INSERT INTO slider_images (url) VALUES 
('https://picsum.photos/seed/temple1/1200/400'),
('https://picsum.photos/seed/temple2/1200/400');

-- Initial Admin (Password: admin123)
-- Note: You should change this after first login
INSERT INTO users (name, phone, password, role, member_id, status) VALUES 
('Admin', '01700000000', '$2a$10$7.n/vY.vY.vY.vY.vY.vY.vY.vY.vY.vY.vY.vY.vY.vY.vY.vY.', 'admin', 'ADM-001', 'active');
