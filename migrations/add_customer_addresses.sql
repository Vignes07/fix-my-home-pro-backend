-- Run this SQL in Supabase SQL Editor to create the customer_addresses table

CREATE TABLE customer_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(50) DEFAULT 'Home',
    full_address TEXT NOT NULL,
    building_name VARCHAR(255),
    street VARCHAR(255),
    city VARCHAR(100),
    pincode VARCHAR(10),
    phone VARCHAR(15),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_customer_addresses_user ON customer_addresses(user_id);
