-- RIZ Travel App - Seed Data
-- Sample data for development and testing
-- PostgreSQL 14+

-- ==============================================================================
-- LOCATIONS
-- ==============================================================================

-- Countries
INSERT INTO locations (id, name, type, country_code, currency, timezone, latitude, longitude) VALUES
('00000000-0000-0000-0000-000000000001', 'United States', 'country', 'US', 'USD', 'America/New_York', 37.0902, -95.7129),
('00000000-0000-0000-0000-000000000002', 'France', 'country', 'FR', 'EUR', 'Europe/Paris', 46.2276, 2.2137),
('00000000-0000-0000-0000-000000000003', 'Japan', 'country', 'JP', 'JPY', 'Asia/Tokyo', 36.2048, 138.2529),
('00000000-0000-0000-0000-000000000004', 'Thailand', 'country', 'TH', 'THB', 'Asia/Bangkok', 15.8700, 100.9925),
('00000000-0000-0000-0000-000000000005', 'Australia', 'country', 'AU', 'AUD', 'Australia/Sydney', -25.2744, 133.7751);

-- Cities
INSERT INTO locations (id, name, type, country_code, city, currency, timezone, latitude, longitude, parent_location_id, population) VALUES
('10000000-0000-0000-0000-000000000001', 'New York', 'city', 'US', 'New York', 'USD', 'America/New_York', 40.7128, -74.0060, '00000000-0000-0000-0000-000000000001', 8336817),
('10000000-0000-0000-0000-000000000002', 'Paris', 'city', 'FR', 'Paris', 'EUR', 'Europe/Paris', 48.8566, 2.3522, '00000000-0000-0000-0000-000000000002', 2165423),
('10000000-0000-0000-0000-000000000003', 'Tokyo', 'city', 'JP', 'Tokyo', 'JPY', 'Asia/Tokyo', 35.6762, 139.6503, '00000000-0000-0000-0000-000000000003', 13960000),
('10000000-0000-0000-0000-000000000004', 'Bangkok', 'city', 'TH', 'Bangkok', 'THB', 'Asia/Bangkok', 13.7563, 100.5018, '00000000-0000-0000-0000-000000000004', 10539000),
('10000000-0000-0000-0000-000000000005', 'Sydney', 'city', 'AU', 'Sydney', 'AUD', 'Australia/Sydney', -33.8688, 151.2093, '00000000-0000-0000-0000-000000000005', 5312000),
('10000000-0000-0000-0000-000000000006', 'Bali', 'city', 'ID', 'Bali', 'IDR', 'Asia/Makassar', -8.3405, 115.0920, NULL, 4225000);

-- ==============================================================================
-- SEASON PROFILES
-- ==============================================================================

-- Paris Season Profile
INSERT INTO season_profiles (id, location_id, name, description) VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Paris Seasonal Pricing', 'Paris experiences peak tourism in summer and December holidays');

INSERT INTO season_rules (season_profile_id, start_month, end_month, season_name, accommodation_multiplier, transport_multiplier, activities_multiplier, dining_multiplier) VALUES
('20000000-0000-0000-0000-000000000001', 1, 3, 'off-season', 0.80, 0.90, 0.85, 0.90),
('20000000-0000-0000-0000-000000000001', 4, 5, 'shoulder', 1.10, 1.05, 1.00, 1.00),
('20000000-0000-0000-0000-000000000001', 6, 8, 'peak', 1.50, 1.30, 1.20, 1.10),
('20000000-0000-0000-0000-000000000001', 9, 11, 'shoulder', 1.10, 1.05, 1.00, 1.00),
('20000000-0000-0000-0000-000000000001', 12, 12, 'peak', 1.40, 1.25, 1.15, 1.10);

-- Bangkok Season Profile
INSERT INTO season_profiles (id, location_id, name, description) VALUES
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'Bangkok Seasonal Pricing', 'Cool season (Nov-Feb) is peak tourist season');

INSERT INTO season_rules (season_profile_id, start_month, end_month, season_name, accommodation_multiplier, transport_multiplier, activities_multiplier, dining_multiplier) VALUES
('20000000-0000-0000-0000-000000000002', 1, 2, 'peak', 1.40, 1.20, 1.15, 1.05),
('20000000-0000-0000-0000-000000000002', 3, 5, 'off-season', 0.75, 0.85, 0.90, 0.95),
('20000000-0000-0000-0000-000000000002', 6, 10, 'off-season', 0.70, 0.85, 0.85, 0.95),
('20000000-0000-0000-0000-000000000002', 11, 12, 'peak', 1.35, 1.20, 1.15, 1.05);

-- Tokyo Season Profile
INSERT INTO season_profiles (id, location_id, name, description) VALUES
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'Tokyo Seasonal Pricing', 'Cherry blossom season (March-April) and fall are most expensive');

INSERT INTO season_rules (season_profile_id, start_month, end_month, season_name, accommodation_multiplier, transport_multiplier, activities_multiplier, dining_multiplier) VALUES
('20000000-0000-0000-0000-000000000003', 1, 2, 'shoulder', 1.00, 1.00, 1.00, 1.00),
('20000000-0000-0000-0000-000000000003', 3, 4, 'peak', 1.60, 1.40, 1.30, 1.10),
('20000000-0000-0000-0000-000000000003', 5, 6, 'shoulder', 1.10, 1.05, 1.00, 1.00),
('20000000-0000-0000-0000-000000000003', 7, 8, 'peak', 1.45, 1.25, 1.20, 1.05),
('20000000-0000-0000-0000-000000000003', 9, 11, 'peak', 1.55, 1.35, 1.25, 1.10),
('20000000-0000-0000-0000-000000000003', 12, 12, 'shoulder', 1.15, 1.10, 1.05, 1.00);

-- ==============================================================================
-- DEFAULT CATEGORY COSTS
-- ==============================================================================

-- Paris - Economy
INSERT INTO default_category_costs (location_id, budget_level, category, subcategory, unit_cost_cents, currency, recurring_type, source, confidence_score) VALUES
('10000000-0000-0000-0000-000000000002', 'economy', 'accommodation', 'hostel', 3500, 'EUR', 'per_night', 'aggregated', 0.85),
('10000000-0000-0000-0000-000000000002', 'economy', 'food', 'meals', 2500, 'EUR', 'per_day', 'aggregated', 0.90),
('10000000-0000-0000-0000-000000000002', 'economy', 'local_transport', 'metro', 1500, 'EUR', 'per_day', 'aggregated', 0.95),
('10000000-0000-0000-0000-000000000002', 'economy', 'activities', 'museums', 1500, 'EUR', 'per_day', 'aggregated', 0.80),
('10000000-0000-0000-0000-000000000002', 'economy', 'miscellaneous', 'general', 1000, 'EUR', 'per_day', 'manual', 0.70);

-- Paris - Standard
INSERT INTO default_category_costs (location_id, budget_level, category, subcategory, unit_cost_cents, currency, recurring_type, source, confidence_score) VALUES
('10000000-0000-0000-0000-000000000002', 'standard', 'accommodation', 'hotel', 12000, 'EUR', 'per_night', 'aggregated', 0.90),
('10000000-0000-0000-0000-000000000002', 'standard', 'food', 'meals', 5000, 'EUR', 'per_day', 'aggregated', 0.90),
('10000000-0000-0000-0000-000000000002', 'standard', 'local_transport', 'metro_taxi', 3000, 'EUR', 'per_day', 'aggregated', 0.85),
('10000000-0000-0000-0000-000000000002', 'standard', 'activities', 'attractions', 4000, 'EUR', 'per_day', 'aggregated', 0.85),
('10000000-0000-0000-0000-000000000002', 'standard', 'miscellaneous', 'general', 2000, 'EUR', 'per_day', 'manual', 0.70);

-- Bangkok - Economy
INSERT INTO default_category_costs (location_id, budget_level, category, subcategory, unit_cost_cents, currency, recurring_type, source, confidence_score) VALUES
('10000000-0000-0000-0000-000000000004', 'economy', 'accommodation', 'hostel', 40000, 'THB', 'per_night', 'aggregated', 0.90),
('10000000-0000-0000-0000-000000000004', 'economy', 'food', 'street_food', 30000, 'THB', 'per_day', 'aggregated', 0.95),
('10000000-0000-0000-0000-000000000004', 'economy', 'local_transport', 'bts_taxi', 20000, 'THB', 'per_day', 'aggregated', 0.90),
('10000000-0000-0000-0000-000000000004', 'economy', 'activities', 'temples', 15000, 'THB', 'per_day', 'aggregated', 0.85),
('10000000-0000-0000-0000-000000000004', 'economy', 'miscellaneous', 'general', 10000, 'THB', 'per_day', 'manual', 0.70);

-- Bangkok - Standard
INSERT INTO default_category_costs (location_id, budget_level, category, subcategory, unit_cost_cents, currency, recurring_type, source, confidence_score) VALUES
('10000000-0000-0000-0000-000000000004', 'standard', 'accommodation', 'hotel', 150000, 'THB', 'per_night', 'aggregated', 0.90),
('10000000-0000-0000-0000-000000000004', 'standard', 'food', 'restaurants', 80000, 'THB', 'per_day', 'aggregated', 0.90),
('10000000-0000-0000-0000-000000000004', 'standard', 'local_transport', 'taxi_grab', 40000, 'THB', 'per_day', 'aggregated', 0.85),
('10000000-0000-0000-0000-000000000004', 'standard', 'activities', 'tours', 50000, 'THB', 'per_day', 'aggregated', 0.85),
('10000000-0000-0000-0000-000000000004', 'standard', 'miscellaneous', 'general', 25000, 'THB', 'per_day', 'manual', 0.70);

-- Tokyo - Standard
INSERT INTO default_category_costs (location_id, budget_level, category, subcategory, unit_cost_cents, currency, recurring_type, source, confidence_score) VALUES
('10000000-0000-0000-0000-000000000003', 'standard', 'accommodation', 'hotel', 1500000, 'JPY', 'per_night', 'aggregated', 0.90),
('10000000-0000-0000-0000-000000000003', 'standard', 'food', 'restaurants', 500000, 'JPY', 'per_day', 'aggregated', 0.90),
('10000000-0000-0000-0000-000000000003', 'standard', 'local_transport', 'train_metro', 200000, 'JPY', 'per_day', 'aggregated', 0.95),
('10000000-0000-0000-0000-000000000003', 'standard', 'activities', 'attractions', 400000, 'JPY', 'per_day', 'aggregated', 0.85),
('10000000-0000-0000-0000-000000000003', 'standard', 'miscellaneous', 'general', 150000, 'JPY', 'per_day', 'manual', 0.70);

-- ==============================================================================
-- USERS
-- ==============================================================================

INSERT INTO users (id, email, name, user_type, user_status, default_currency, timezone, email_verified, password_hash) VALUES
('30000000-0000-0000-0000-000000000001', 'alice@example.com', 'Alice Johnson', 'user', 'active', 'USD', 'America/New_York', true, '$2a$10$XQjGxPSVBqH5t5zVQRCGeuVZUhHKY.7YwNhVLGZ5XW4pVqKvN9QGe'),
('30000000-0000-0000-0000-000000000002', 'bob@example.com', 'Bob Smith', 'user', 'active', 'EUR', 'Europe/Paris', true, '$2a$10$XQjGxPSVBqH5t5zVQRCGeuVZUhHKY.7YwNhVLGZ5XW4pVqKvN9QGe'),
('30000000-0000-0000-0000-000000000003', 'charlie@example.com', 'Charlie Brown', 'user', 'active', 'GBP', 'Europe/London', true, '$2a$10$XQjGxPSVBqH5t5zVQRCGeuVZUhHKY.7YwNhVLGZ5XW4pVqKvN9QGe'),
('30000000-0000-0000-0000-000000000004', 'operator1@example.com', 'Paris Tours Inc', 'operator', 'active', 'EUR', 'Europe/Paris', true, '$2a$10$XQjGxPSVBqH5t5zVQRCGeuVZUhHKY.7YwNhVLGZ5XW4pVqKvN9QGe'),
('30000000-0000-0000-0000-000000000005', 'operator2@example.com', 'Bangkok Adventures', 'operator', 'active', 'THB', 'Asia/Bangkok', true, '$2a$10$XQjGxPSVBqH5t5zVQRCGeuVZUhHKY.7YwNhVLGZ5XW4pVqKvN9QGe'),
('30000000-0000-0000-0000-000000000006', 'admin@riztravel.com', 'Admin User', 'admin', 'active', 'USD', 'UTC', true, '$2a$10$XQjGxPSVBqH5t5zVQRCGeuVZUhHKY.7YwNhVLGZ5XW4pVqKvN9QGe');

-- User preferences
INSERT INTO user_preferences (user_id, budget_level, travel_style, notification_email, notification_push) VALUES
('30000000-0000-0000-0000-000000000001', 'standard', '["cultural", "adventure"]', true, true),
('30000000-0000-0000-0000-000000000002', 'premium', '["relaxation", "culinary"]', true, false),
('30000000-0000-0000-0000-000000000003', 'economy', '["adventure", "budget"]', true, true);

-- ==============================================================================
-- OPERATORS
-- ==============================================================================

INSERT INTO operators (id, owner_user_id, org_name, legal_name, contact_email, contact_phone, country, kyc_status, rating, review_count) VALUES
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', 'Paris Tours Inc', 'Paris Tours SARL', 'contact@paristours.fr', '+33123456789', 'FR', 'approved', 4.75, 142),
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000005', 'Bangkok Adventures', 'Bangkok Adventures Co. Ltd', 'info@bangkokadventures.th', '+66812345678', 'TH', 'approved', 4.60, 98);

-- ==============================================================================
-- OPERATOR LISTINGS
-- ==============================================================================

INSERT INTO operator_listings (id, operator_id, title, description, short_description, category, subcategory, location_id, base_price_cents, currency, duration_minutes, max_participants, status, rating, review_count) VALUES
('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Eiffel Tower Skip-the-Line Tour', 'Experience the magic of Paris with priority access to the Eiffel Tower. Our expert guides will share fascinating stories about this iconic landmark. Includes elevator access to the 2nd floor with stunning panoramic views of Paris.', 'Skip-the-line Eiffel Tower tour with expert guide', 'tour', 'landmark', '10000000-0000-0000-0000-000000000002', 6500, 'EUR', 120, 15, 'active', 4.80, 87),
('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'Louvre Museum Private Tour', 'Discover the Louvre''s masterpieces with a private art historian guide. See the Mona Lisa, Venus de Milo, and other world-renowned works. 3-hour intimate experience customized to your interests.', 'Private Louvre tour with art historian', 'tour', 'museum', '10000000-0000-0000-0000-000000000002', 15000, 'EUR', 180, 6, 'active', 4.90, 45),
('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', 'Floating Market Morning Tour', 'Wake up early to experience the authentic Thai floating market. Watch vendors sell fresh produce from their boats, sample local delicacies, and capture incredible photos. Includes traditional long-tail boat ride.', 'Authentic floating market experience', 'tour', 'cultural', '10000000-0000-0000-0000-000000000004', 120000, 'THB', 240, 20, 'active', 4.65, 56),
('50000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000002', 'Thai Cooking Class', 'Learn to cook authentic Thai dishes in a beautiful traditional kitchen. Market tour to select fresh ingredients, then hands-on preparation of 4-5 classic dishes. Recipe book included to recreate at home.', 'Hands-on Thai cooking experience', 'experience', 'culinary', '10000000-0000-0000-0000-000000000004', 180000, 'THB', 300, 12, 'active', 4.85, 72);

-- Listing availability (next 30 days with varying slots)
INSERT INTO listing_availability (listing_id, available_date, available_slots, price_override_cents)
SELECT 
    '50000000-0000-0000-0000-000000000001',
    CURRENT_DATE + i,
    CASE WHEN EXTRACT(DOW FROM CURRENT_DATE + i) IN (0, 6) THEN 20 ELSE 15 END,  -- More slots on weekends
    CASE WHEN EXTRACT(DOW FROM CURRENT_DATE + i) IN (0, 6) THEN 7500 ELSE NULL END  -- Weekend premium
FROM generate_series(0, 29) AS i;

INSERT INTO listing_availability (listing_id, available_date, available_slots)
SELECT 
    '50000000-0000-0000-0000-000000000003',
    CURRENT_DATE + i,
    20
FROM generate_series(0, 29) AS i;

-- ==============================================================================
-- TRIPS
-- ==============================================================================

INSERT INTO trips (id, owner_user_id, title, description, location_id, destination_name, start_date, end_date, travelers_count, privacy, status, currency) VALUES
('60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Paris Summer Getaway', 'Romantic week in Paris exploring museums, cafes, and landmarks', '10000000-0000-0000-0000-000000000002', 'Paris, France', '2025-07-15', '2025-07-22', 2, 'shared', 'planning', 'EUR'),
('60000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'Bangkok Adventure', 'Exploring temples, markets, and Thai cuisine', '10000000-0000-0000-0000-000000000004', 'Bangkok, Thailand', '2025-11-01', '2025-11-10', 1, 'private', 'draft', 'THB'),
('60000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'Tokyo Cherry Blossoms', 'Spring trip to see cherry blossoms and experience Japanese culture', '10000000-0000-0000-0000-000000000003', 'Tokyo, Japan', '2026-03-25', '2026-04-05', 3, 'shared', 'planning', 'JPY');

-- Trip collaborators
INSERT INTO trip_collaborators (trip_id, user_id, role, invited_by, accepted_at) VALUES
('60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'editor', '30000000-0000-0000-0000-000000000001', NOW() - INTERVAL '3 days'),
('60000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 'viewer', '30000000-0000-0000-0000-000000000003', NOW() - INTERVAL '1 day');

-- ==============================================================================
-- TRIP ITEMS
-- ==============================================================================

-- Paris trip items
INSERT INTO trip_items (trip_id, category, subcategory, title, description, unit_cost_cents, units, recurring_type, date, created_by) VALUES
('60000000-0000-0000-0000-000000000001', 'accommodation', 'hotel', 'Hotel in Le Marais', '3-star boutique hotel in trendy Le Marais district', 12000, 7, 'per_night', '2025-07-15', '30000000-0000-0000-0000-000000000001'),
('60000000-0000-0000-0000-000000000001', 'food', 'meals', 'Daily food budget', 'Breakfast, lunch, dinner including some nice restaurants', 8000, 7, 'per_day', '2025-07-15', '30000000-0000-0000-0000-000000000001'),
('60000000-0000-0000-0000-000000000001', 'local_transport', 'metro', 'Paris Metro passes', 'Weekly Navigo pass for both travelers', 2250, 2, 'once', '2025-07-15', '30000000-0000-0000-0000-000000000001'),
('60000000-0000-0000-0000-000000000001', 'activities', 'tour', 'Eiffel Tower Tour', 'Skip-the-line guided tour', 6500, 2, 'per_person', '2025-07-16', '30000000-0000-0000-0000-000000000001'),
('60000000-0000-0000-0000-000000000001', 'activities', 'museum', 'Louvre Tickets', 'Entrance to the Louvre Museum', 1700, 2, 'per_person', '2025-07-17', '30000000-0000-0000-0000-000000000001'),
('60000000-0000-0000-0000-000000000001', 'intercity_transport', 'flight', 'Round-trip flights', 'NYC to Paris round-trip', 65000, 2, 'per_person', '2025-07-15', '30000000-0000-0000-0000-000000000001'),
('60000000-0000-0000-0000-000000000001', 'miscellaneous', 'general', 'Contingency & shopping', 'Buffer for unexpected expenses and souvenirs', 5000, 1, 'once', NULL, '30000000-0000-0000-0000-000000000001');

-- Bangkok trip items
INSERT INTO trip_items (trip_id, category, subcategory, title, description, unit_cost_cents, units, recurring_type, date, created_by) VALUES
('60000000-0000-0000-0000-000000000002', 'accommodation', 'hotel', 'Sukhumvit Hotel', 'Mid-range hotel near BTS Skytrain', 150000, 9, 'per_night', '2025-11-01', '30000000-0000-0000-0000-000000000002'),
('60000000-0000-0000-0000-000000000002', 'food', 'street_food', 'Daily food', 'Mix of street food and restaurants', 100000, 9, 'per_day', '2025-11-01', '30000000-0000-0000-0000-000000000002'),
('60000000-0000-0000-0000-000000000002', 'local_transport', 'taxi', 'Local transport', 'BTS, taxis, and Grab rides', 50000, 9, 'per_day', '2025-11-01', '30000000-0000-0000-0000-000000000002'),
('60000000-0000-0000-0000-000000000002', 'activities', 'tour', 'Floating Market Tour', 'Morning floating market experience', 120000, 1, 'once', '2025-11-03', '30000000-0000-0000-0000-000000000002'),
('60000000-0000-0000-0000-000000000002', 'activities', 'cooking_class', 'Thai Cooking Class', 'Half-day cooking class', 180000, 1, 'once', '2025-11-05', '30000000-0000-0000-0000-000000000002'),
('60000000-0000-0000-0000-000000000002', 'intercity_transport', 'flight', 'Round-trip flight', 'Paris to Bangkok', 50000, 1, 'once', '2025-11-01', '30000000-0000-0000-0000-000000000002');

-- ==============================================================================
-- BOOKINGS
-- ==============================================================================

INSERT INTO bookings (id, trip_id, user_id, listing_id, operator_id, booking_date, participants_count, total_cost_cents, currency, status, confirmed_at) VALUES
('70000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '2025-07-16', 2, 13000, 'EUR', 'confirmed', NOW() - INTERVAL '5 days');

-- Link booking to trip item
UPDATE trip_items SET booking_id = '70000000-0000-0000-0000-000000000001', is_booked = true
WHERE trip_id = '60000000-0000-0000-0000-000000000001' AND title = 'Eiffel Tower Tour';

-- ==============================================================================
-- PAYMENTS
-- ==============================================================================

INSERT INTO payments (id, booking_id, user_id, amount_cents, currency, status, stripe_payment_intent_id, authorized_at, captured_at) VALUES
('80000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 13000, 'EUR', 'captured', 'pi_test_1234567890', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days');

-- ==============================================================================
-- REVIEWS
-- ==============================================================================

INSERT INTO reviews (id, listing_id, booking_id, reviewer_user_id, rating, title, content, is_verified, operator_response) VALUES
('90000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 5, 'Amazing experience!', 'Our guide was knowledgeable and passionate. The skip-the-line access saved us hours. The views from the 2nd floor were breathtaking. Highly recommend this tour!', true, 'Thank you so much for your kind words! We''re thrilled you enjoyed the experience.');

-- ==============================================================================
-- TRIP ACTIVITIES
-- ==============================================================================

INSERT INTO trip_activities (trip_id, user_id, activity_type, content) VALUES
('60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'comment', 'I think we should add a Seine river cruise!'),
('60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'comment', 'Great idea! Let''s look for evening options with dinner.'),
('60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'item_added', 'Added Eiffel Tower Tour to itinerary'),
('60000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'comment', 'Should I book the cooking class in advance?');

-- ==============================================================================
-- VERIFICATION QUERIES
-- ==============================================================================

-- Check trip budgets (should auto-compute via trigger)
SELECT 
    t.id,
    t.title,
    t.budget_computed_cents / 100.0 AS budget_eur,
    COUNT(ti.id) AS item_count
FROM trips t
LEFT JOIN trip_items ti ON t.id = ti.trip_id
WHERE t.id = '60000000-0000-0000-0000-000000000001'
GROUP BY t.id, t.title, t.budget_computed_cents;

-- Check season profiles
SELECT 
    l.name AS location,
    sp.name AS season_profile,
    sr.season_name,
    sr.start_month,
    sr.end_month,
    sr.accommodation_multiplier
FROM locations l
JOIN season_profiles sp ON l.id = sp.location_id
JOIN season_rules sr ON sp.id = sr.season_profile_id
WHERE l.name IN ('Paris', 'Bangkok')
ORDER BY l.name, sr.start_month;

-- Check listings with availability
SELECT 
    ol.title,
    o.org_name,
    ol.base_price_cents / 100.0 AS base_price,
    ol.currency,
    COUNT(la.id) AS days_available,
    ol.rating,
    ol.review_count
FROM operator_listings ol
JOIN operators o ON ol.operator_id = o.id
LEFT JOIN listing_availability la ON ol.id = la.listing_id
GROUP BY ol.id, o.org_name
ORDER BY ol.rating DESC;

COMMIT;
