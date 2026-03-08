-- backend/database/seed_services.sql

-- =======================================================
-- WARNING: This will delete ALL existing categories, 
-- services, options, bookings, and booking items!
-- It ensures a completely clean slate for testing.
-- =======================================================
TRUNCATE public.service_categories CASCADE;

-- =======================================================
-- 1. Insert Categories
-- =======================================================
INSERT INTO public.service_categories (id, name, icon_url, display_order, is_active) VALUES
('c1111111-1111-1111-1111-111111111111', 'AC Repair & Service', 'https://cdn-icons-png.flaticon.com/512/3673/3673559.png', 1, true),
('c2222222-2222-2222-2222-222222222222', 'Plumbing', 'https://cdn-icons-png.flaticon.com/512/3673/3673410.png', 2, true),
('c3333333-3333-3333-3333-333333333333', 'Electrical', 'https://cdn-icons-png.flaticon.com/512/4818/4818318.png', 3, true),
('c4444444-4444-4444-4444-444444444444', 'Cleaning', 'https://cdn-icons-png.flaticon.com/512/2043/2043236.png', 4, true);

-- =======================================================
-- 2. Insert Services
-- =======================================================
INSERT INTO public.services (id, category_id, name, description, base_price, estimated_duration, image_url, includes, is_active) VALUES
-- AC Services
('d1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Split AC Service', 'Comprehensive cleaning and servicing of your Split AC unit to ensure optimal cooling and efficiency.', 499, 60, 'https://images.unsplash.com/photo-1581092926214-78e28b1b0f69?q=80&w=1470&auto=format&fit=crop', ARRAY['Deep filter cleaning', 'Cooling coil wash', 'Gas pressure check', 'Drain pipe unblocking'], true),
('d1111111-1111-1111-1111-111111111112', 'c1111111-1111-1111-1111-111111111111', 'Window AC Service', 'Thorough maintenance of Window AC units, including pressure washing of coils and exterior cleaning.', 399, 45, 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?q=80&w=1470&auto=format&fit=crop', ARRAY['Mesh and filter cleaning', 'Water wash of internal components', 'Cooling verification', 'Noise reduction check'], true),

-- Plumbing Services
('d2222222-2222-2222-2222-222222222221', 'c2222222-2222-2222-2222-222222222222', 'Tap & Shower Repair', 'Fixing leaking taps, broken shower heads, or low water pressure issues in bathrooms and kitchens.', 199, 30, 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1470&auto=format&fit=crop', ARRAY['Leakage identification', 'Washer/Spindle replacement', 'Water pressure test', 'Cleanup of work area'], true),
('d2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'Pipe Blockage Removal', 'Clearing clogged drains, sink pipes, and main lines using professional equipment.', 599, 90, 'https://images.unsplash.com/photo-1607472586893-edb57cbca142?q=80&w=1470&auto=format&fit=crop', ARRAY['High-pressure blockage blasting', 'Drainage flow check', 'Manual trap cleaning', 'Deodorizing treatment'], true),

-- Electrical Services
('d3333333-3333-3333-3333-333333333331', 'c3333333-3333-3333-3333-333333333333', 'Switch & Socket Repair', 'Replacement or repair of faulty electrical switches, sockets, and standard household wiring.', 149, 30, 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1469&auto=format&fit=crop', ARRAY['Voltage testing', 'Safe removal of old components', 'Installation of new switches', 'Insulation and safety check'], true),
('d3333333-3333-3333-3333-333333333332', 'c3333333-3333-3333-3333-333333333333', 'Ceiling Fan Installation', 'Professional installation or uninstallation of ceiling, exhaust, or wall-mounted fans.', 249, 45, 'https://images.unsplash.com/photo-1596526131083-e8c638c478d5?q=80&w=1470&auto=format&fit=crop', ARRAY['Mounting assembly', 'Wiring connection setup', 'Blade balancing', 'Speed regulator check'], true),

-- Cleaning Services
('d4444444-4444-4444-4444-444444444441', 'c4444444-4444-4444-4444-444444444444', 'Deep Home Cleaning', 'A top-to-bottom thorough clean of your entire home, covering hard-to-reach areas and stubborn stains.', 2999, 240, 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1470&auto=format&fit=crop', ARRAY['Dry vacuuming of carpets', 'Wet scrubbing of floors', 'Dusting of all fixtures', 'Bathroom acid wash'], true);

-- =======================================================
-- 3. Insert Service Options
-- =======================================================
INSERT INTO public.service_options (service_id, name, description, price, estimated_duration) VALUES
-- AC Split Options
('d1111111-1111-1111-1111-111111111111', 'Foam Jet Cleaning', 'Advanced foam-based chemical wash for intense cooling improvement.', 699, 60),
('d1111111-1111-1111-1111-111111111111', 'Basic Power Wash', 'Standard water pressure washing of external and internal units.', 499, 45),
('d1111111-1111-1111-1111-111111111111', 'Gas Charging', 'Top-up or complete refill of AC refrigerant gas.', 1499, 60),

-- AC Window Options
('d1111111-1111-1111-1111-111111111112', 'Standard Cleaning', 'Water pressure cleaning of unit without uninstallation.', 399, 40),
('d1111111-1111-1111-1111-111111111112', 'Deep Master Wash', 'Complete uninstallation and deep chemical wash outside.', 799, 90),

-- Plumbing (Tap) Options
('d2222222-2222-2222-2222-222222222221', 'Minor Repair', 'Fixing leaks by changing washers or simple adjustments.', 149, 20),
('d2222222-2222-2222-2222-222222222221', 'Tap Replacement', 'Complete removal of old tap and installation of a new one.', 299, 45),

-- Plumbing (Blockage) Options
('d2222222-2222-2222-2222-222222222222', 'Sink Blockage', 'Clearing standard kitchen or bathroom sink pipes.', 399, 45),
('d2222222-2222-2222-2222-222222222222', 'Main Drain Blockage', 'Heavy duty clearing of main household drainage systems.', 999, 120),

-- Electrical (Switch) Options
('d3333333-3333-3333-3333-333333333331', 'Switch Replacement', 'Replacing up to 3 standard switches/sockets.', 149, 30),
('d3333333-3333-3333-3333-333333333331', 'New Wiring Setup', 'Running new wires for an additional socket point.', 499, 60),

-- Fan Options
('d3333333-3333-3333-3333-333333333332', 'Standard Installation', 'Installing a new fan on an existing hook.', 249, 45),
('d3333333-3333-3333-3333-333333333332', 'Hook & Installation', 'Drilling/mounting a new hook in the ceiling + installation.', 599, 60),

-- Cleaning Options
('d4444444-4444-4444-4444-444444444441', '1 BHK Deep Clean', 'Suitable for homes up to 800 sq.ft.', 2999, 240),
('d4444444-4444-4444-4444-444444444441', '2 BHK & Balcony Clean', 'Suitable for homes up to 1200 sq.ft.', 3999, 360),
('d4444444-4444-4444-4444-444444444441', '3 BHK Premium Clean', 'Suitable for homes up to 1800 sq.ft.', 4999, 480);
