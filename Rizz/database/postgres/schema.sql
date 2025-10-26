-- RIZ Travel App - PostgreSQL Database Schema
-- Production-ready schema with indexes, constraints, and audit triggers
-- Version: 1.0.0
-- PostgreSQL 14+

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";  -- For geo-spatial features

-- ==============================================================================
-- ENUMS
-- ==============================================================================

CREATE TYPE user_type AS ENUM ('user', 'operator', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'deleted');
CREATE TYPE trip_privacy AS ENUM ('private', 'shared', 'public');
CREATE TYPE trip_status AS ENUM ('draft', 'planning', 'booked', 'active', 'completed', 'cancelled');
CREATE TYPE collaborator_role AS ENUM ('owner', 'editor', 'viewer');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'refunded', 'completed');
CREATE TYPE payment_status AS ENUM ('pending', 'authorized', 'captured', 'failed', 'refunded');
CREATE TYPE operator_kyc_status AS ENUM ('pending', 'submitted', 'approved', 'rejected', 'expired');
CREATE TYPE listing_status AS ENUM ('draft', 'pending_review', 'active', 'inactive', 'suspended');
CREATE TYPE recurring_type AS ENUM ('once', 'per_day', 'per_night', 'per_person', 'per_activity');
CREATE TYPE budget_level AS ENUM ('economy', 'standard', 'premium', 'luxury');

-- ==============================================================================
-- USERS & AUTHENTICATION
-- ==============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    email_verified BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255),  -- NULL for OAuth users
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(50),
    phone_verified BOOLEAN DEFAULT FALSE,
    
    user_type user_type NOT NULL DEFAULT 'user',
    user_status user_status NOT NULL DEFAULT 'active',
    
    default_currency CHAR(3) DEFAULT 'USD',
    timezone VARCHAR(50) DEFAULT 'UTC',
    language CHAR(5) DEFAULT 'en',
    
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    
    last_login_at TIMESTAMPTZ,
    last_login_ip INET,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT email_lowercase CHECK (email = LOWER(email))
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_type_status ON users(user_type, user_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at);

-- User preferences
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    budget_level budget_level DEFAULT 'standard',
    travel_style JSONB DEFAULT '[]'::jsonb,  -- ['adventure', 'cultural', 'relaxation']
    
    dietary_restrictions JSONB DEFAULT '[]'::jsonb,
    accessibility_needs JSONB DEFAULT '[]'::jsonb,
    
    notification_email BOOLEAN DEFAULT TRUE,
    notification_push BOOLEAN DEFAULT TRUE,
    notification_sms BOOLEAN DEFAULT FALSE,
    
    privacy_settings JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- OAuth providers
CREATE TABLE user_oauth_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    provider VARCHAR(50) NOT NULL,  -- 'google', 'facebook', 'apple'
    provider_user_id VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255),
    
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(provider, provider_user_id)
);

CREATE INDEX idx_oauth_user_id ON user_oauth_providers(user_id);

-- Payment methods (tokenized)
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    stripe_payment_method_id VARCHAR(255) NOT NULL UNIQUE,
    
    type VARCHAR(50) NOT NULL,  -- 'card', 'bank_account', 'paypal'
    last4 VARCHAR(4),
    brand VARCHAR(50),
    exp_month INT,
    exp_year INT,
    
    is_default BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);

-- ==============================================================================
-- ORGANIZATIONS & OPERATORS
-- ==============================================================================

CREATE TABLE operators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL REFERENCES users(id),
    
    org_name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    registration_number VARCHAR(100),
    tax_id VARCHAR(100),
    
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    website_url TEXT,
    
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country CHAR(2) NOT NULL,  -- ISO 3166-1 alpha-2
    postal_code VARCHAR(20),
    
    kyc_status operator_kyc_status DEFAULT 'pending',
    kyc_submitted_at TIMESTAMPTZ,
    kyc_reviewed_at TIMESTAMPTZ,
    kyc_reviewed_by UUID REFERENCES users(id),
    kyc_notes TEXT,
    
    stripe_account_id VARCHAR(255) UNIQUE,
    payout_enabled BOOLEAN DEFAULT FALSE,
    
    rating DECIMAL(3, 2) DEFAULT 0.00,
    review_count INT DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT rating_range CHECK (rating >= 0 AND rating <= 5)
);

CREATE INDEX idx_operators_owner ON operators(owner_user_id);
CREATE INDEX idx_operators_kyc_status ON operators(kyc_status);
CREATE INDEX idx_operators_country ON operators(country);

-- Operator team members
CREATE TABLE operator_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    role VARCHAR(50) NOT NULL DEFAULT 'member',  -- 'admin', 'manager', 'member'
    permissions JSONB DEFAULT '[]'::jsonb,
    
    invited_by UUID REFERENCES users(id),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(operator_id, user_id)
);

CREATE INDEX idx_operator_members_operator ON operator_members(operator_id);
CREATE INDEX idx_operator_members_user ON operator_members(user_id);

-- ==============================================================================
-- LOCATIONS & GEOGRAPHY
-- ==============================================================================

CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    name VARCHAR(255) NOT NULL,
    name_local VARCHAR(255),
    type VARCHAR(50) NOT NULL,  -- 'country', 'region', 'city', 'landmark'
    
    country_code CHAR(2) NOT NULL,
    region VARCHAR(100),
    city VARCHAR(100),
    
    coordinates GEOGRAPHY(POINT, 4326),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    timezone VARCHAR(50),
    currency CHAR(3),
    
    population INT,
    elevation INT,
    
    parent_location_id UUID REFERENCES locations(id),
    
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_locations_coordinates ON locations USING GIST(coordinates);
CREATE INDEX idx_locations_country ON locations(country_code);
CREATE INDEX idx_locations_type ON locations(type);
CREATE INDEX idx_locations_parent ON locations(parent_location_id);

-- Season profiles (for budgeting)
CREATE TABLE season_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(location_id)
);

-- Season rules (month-based multipliers)
CREATE TABLE season_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season_profile_id UUID NOT NULL REFERENCES season_profiles(id) ON DELETE CASCADE,
    
    start_month INT NOT NULL CHECK (start_month >= 1 AND start_month <= 12),
    end_month INT NOT NULL CHECK (end_month >= 1 AND end_month <= 12),
    
    season_name VARCHAR(50) NOT NULL,  -- 'peak', 'shoulder', 'off-season'
    
    accommodation_multiplier DECIMAL(4, 2) NOT NULL DEFAULT 1.00,
    transport_multiplier DECIMAL(4, 2) NOT NULL DEFAULT 1.00,
    activities_multiplier DECIMAL(4, 2) NOT NULL DEFAULT 1.00,
    dining_multiplier DECIMAL(4, 2) NOT NULL DEFAULT 1.00,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT multipliers_positive CHECK (
        accommodation_multiplier > 0 AND
        transport_multiplier > 0 AND
        activities_multiplier > 0 AND
        dining_multiplier > 0
    )
);

CREATE INDEX idx_season_rules_profile ON season_rules(season_profile_id);

-- ==============================================================================
-- TRIPS
-- ==============================================================================

CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL REFERENCES users(id),
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    location_id UUID REFERENCES locations(id),
    destination_name VARCHAR(255),
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    travelers_count INT NOT NULL DEFAULT 1 CHECK (travelers_count > 0),
    
    privacy trip_privacy NOT NULL DEFAULT 'private',
    status trip_status NOT NULL DEFAULT 'draft',
    
    budget_target_cents BIGINT,  -- Target budget in cents
    budget_computed_cents BIGINT,  -- Computed budget in cents
    budget_actual_cents BIGINT,  -- Actual spent in cents
    
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_trips_owner ON trips(owner_user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_trips_location ON trips(location_id);
CREATE INDEX idx_trips_dates ON trips(start_date, end_date);
CREATE INDEX idx_trips_status ON trips(status) WHERE deleted_at IS NULL;

-- Trip collaborators
CREATE TABLE trip_collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    role collaborator_role NOT NULL DEFAULT 'viewer',
    
    invited_by UUID REFERENCES users(id),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    
    last_viewed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(trip_id, user_id)
);

CREATE INDEX idx_trip_collaborators_trip ON trip_collaborators(trip_id);
CREATE INDEX idx_trip_collaborators_user ON trip_collaborators(user_id);

-- Trip items (budget line items)
CREATE TABLE trip_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    
    category VARCHAR(100) NOT NULL,  -- 'accommodation', 'food', 'transport', 'activities', etc.
    subcategory VARCHAR(100),
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    unit_cost_cents BIGINT NOT NULL,  -- Cost in cents
    units DECIMAL(10, 2) NOT NULL DEFAULT 1,
    
    recurring_type recurring_type NOT NULL DEFAULT 'once',
    
    computed_cost_cents BIGINT NOT NULL,  -- Pre-computed: unit_cost * units
    
    is_booked BOOLEAN DEFAULT FALSE,
    booking_id UUID,  -- FK added later
    
    date DATE,
    
    notes TEXT,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT positive_costs CHECK (unit_cost_cents >= 0 AND computed_cost_cents >= 0)
);

CREATE INDEX idx_trip_items_trip ON trip_items(trip_id);
CREATE INDEX idx_trip_items_category ON trip_items(category);
CREATE INDEX idx_trip_items_date ON trip_items(date);

-- Trip activity feed / comments
CREATE TABLE trip_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    activity_type VARCHAR(50) NOT NULL,  -- 'comment', 'item_added', 'collaborator_added', 'status_changed'
    
    content TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    parent_id UUID REFERENCES trip_activities(id) ON DELETE CASCADE,  -- For threaded comments
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trip_activities_trip ON trip_activities(trip_id, created_at DESC);
CREATE INDEX idx_trip_activities_user ON trip_activities(user_id);

-- ==============================================================================
-- DEFAULT COSTS (for budgeting)
-- ==============================================================================

CREATE TABLE default_category_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    budget_level budget_level NOT NULL,
    
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    
    unit_cost_cents BIGINT NOT NULL CHECK (unit_cost_cents >= 0),
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    
    recurring_type recurring_type NOT NULL DEFAULT 'per_day',
    
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    
    source VARCHAR(100),  -- 'manual', 'aggregated', 'ml_predicted'
    confidence_score DECIMAL(3, 2),  -- 0.00 to 1.00
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(location_id, budget_level, category, subcategory, valid_from)
);

CREATE INDEX idx_default_costs_location_level ON default_category_costs(location_id, budget_level);
CREATE INDEX idx_default_costs_category ON default_category_costs(category);
CREATE INDEX idx_default_costs_valid ON default_category_costs(valid_from, valid_until);

-- ==============================================================================
-- OPERATOR LISTINGS
-- ==============================================================================

CREATE TABLE operator_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    
    category VARCHAR(100) NOT NULL,  -- 'tour', 'experience', 'accommodation', 'transport'
    subcategory VARCHAR(100),
    tags JSONB DEFAULT '[]'::jsonb,
    
    location_id UUID REFERENCES locations(id),
    coordinates GEOGRAPHY(POINT, 4326),
    
    base_price_cents BIGINT NOT NULL CHECK (base_price_cents >= 0),
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    
    pricing_model VARCHAR(50) DEFAULT 'per_person',  -- 'per_person', 'per_group', 'per_hour'
    
    duration_minutes INT,
    max_participants INT,
    min_participants INT DEFAULT 1,
    
    cancellation_policy TEXT,
    
    images JSONB DEFAULT '[]'::jsonb,  -- Array of image URLs
    
    status listing_status NOT NULL DEFAULT 'draft',
    
    rating DECIMAL(3, 2) DEFAULT 0.00,
    review_count INT DEFAULT 0,
    
    booking_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT rating_range CHECK (rating >= 0 AND rating <= 5)
);

CREATE INDEX idx_listings_operator ON operator_listings(operator_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_listings_location ON operator_listings(location_id);
CREATE INDEX idx_listings_category ON operator_listings(category, subcategory);
CREATE INDEX idx_listings_status ON operator_listings(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_listings_coordinates ON operator_listings USING GIST(coordinates);

-- Listing availability rules
CREATE TABLE listing_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES operator_listings(id) ON DELETE CASCADE,
    
    available_date DATE NOT NULL,
    available_slots INT NOT NULL CHECK (available_slots >= 0),
    
    price_override_cents BIGINT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(listing_id, available_date)
);

CREATE INDEX idx_listing_availability_listing_date ON listing_availability(listing_id, available_date);

-- ==============================================================================
-- BOOKINGS & PAYMENTS
-- ==============================================================================

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    
    listing_id UUID REFERENCES operator_listings(id) ON DELETE SET NULL,
    operator_id UUID REFERENCES operators(id),
    
    booking_date DATE NOT NULL,
    participants_count INT NOT NULL CHECK (participants_count > 0),
    
    total_cost_cents BIGINT NOT NULL CHECK (total_cost_cents >= 0),
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    
    status booking_status NOT NULL DEFAULT 'pending',
    
    provider_name VARCHAR(100),  -- 'internal', 'booking.com', 'viator'
    provider_booking_id VARCHAR(255),
    provider_confirmation_code VARCHAR(100),
    
    customer_notes TEXT,
    operator_notes TEXT,
    
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_trip ON bookings(trip_id);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_operator ON bookings(operator_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(booking_date);

-- Add FK from trip_items to bookings
ALTER TABLE trip_items ADD CONSTRAINT fk_trip_items_booking 
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;

-- Payments / Transactions
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id),
    
    amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0),
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    
    payment_method_id UUID REFERENCES payment_methods(id),
    
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    stripe_charge_id VARCHAR(255),
    
    status payment_status NOT NULL DEFAULT 'pending',
    
    authorized_at TIMESTAMPTZ,
    captured_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    
    refund_amount_cents BIGINT DEFAULT 0,
    refunded_at TIMESTAMPTZ,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_stripe_intent ON payments(stripe_payment_intent_id);

-- ==============================================================================
-- REVIEWS & RATINGS
-- ==============================================================================

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    listing_id UUID REFERENCES operator_listings(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    
    reviewer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT NOT NULL,
    
    helpful_count INT DEFAULT 0,
    
    operator_response TEXT,
    operator_responded_at TIMESTAMPTZ,
    
    is_verified BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(booking_id, reviewer_user_id)
);

CREATE INDEX idx_reviews_listing ON reviews(listing_id, created_at DESC);
CREATE INDEX idx_reviews_user ON reviews(reviewer_user_id);

-- ==============================================================================
-- AUDIT & LOGGING
-- ==============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    
    action VARCHAR(20) NOT NULL,  -- 'INSERT', 'UPDATE', 'DELETE'
    
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    
    old_data JSONB,
    new_data JSONB,
    changed_fields JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ==============================================================================
-- FUNCTIONS & TRIGGERS
-- ==============================================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operators_updated_at BEFORE UPDATE ON operators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trip_items_updated_at BEFORE UPDATE ON trip_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operator_listings_updated_at BEFORE UPDATE ON operator_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Computed cost trigger for trip_items
CREATE OR REPLACE FUNCTION compute_trip_item_cost()
RETURNS TRIGGER AS $$
BEGIN
    NEW.computed_cost_cents = FLOOR(NEW.unit_cost_cents * NEW.units);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER compute_trip_item_cost_trigger 
    BEFORE INSERT OR UPDATE OF unit_cost_cents, units ON trip_items
    FOR EACH ROW EXECUTE FUNCTION compute_trip_item_cost();

-- Update trip budget when items change
CREATE OR REPLACE FUNCTION update_trip_budget()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE trips
    SET budget_computed_cents = (
        SELECT COALESCE(SUM(computed_cost_cents), 0)
        FROM trip_items
        WHERE trip_id = COALESCE(NEW.trip_id, OLD.trip_id)
    )
    WHERE id = COALESCE(NEW.trip_id, OLD.trip_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trip_budget_trigger
    AFTER INSERT OR UPDATE OR DELETE ON trip_items
    FOR EACH ROW EXECUTE FUNCTION update_trip_budget();

-- ==============================================================================
-- VIEWS
-- ==============================================================================

-- Trip summary view
CREATE OR REPLACE VIEW trip_summaries AS
SELECT 
    t.id,
    t.title,
    t.owner_user_id,
    u.name AS owner_name,
    t.destination_name,
    t.start_date,
    t.end_date,
    (t.end_date - t.start_date + 1) AS duration_days,
    t.travelers_count,
    t.status,
    t.privacy,
    t.budget_computed_cents,
    t.currency,
    COUNT(DISTINCT tc.user_id) AS collaborator_count,
    COUNT(DISTINCT ti.id) AS item_count,
    COUNT(DISTINCT b.id) AS booking_count,
    t.created_at,
    t.updated_at
FROM trips t
JOIN users u ON t.owner_user_id = u.id
LEFT JOIN trip_collaborators tc ON t.id = tc.trip_id
LEFT JOIN trip_items ti ON t.id = ti.trip_id
LEFT JOIN bookings b ON t.id = b.trip_id
WHERE t.deleted_at IS NULL
GROUP BY t.id, u.name;

-- Operator statistics view
CREATE OR REPLACE VIEW operator_statistics AS
SELECT 
    o.id,
    o.org_name,
    o.kyc_status,
    o.rating,
    o.review_count,
    COUNT(DISTINCT ol.id) AS listing_count,
    COUNT(DISTINCT ol.id) FILTER (WHERE ol.status = 'active') AS active_listing_count,
    COUNT(DISTINCT b.id) AS total_bookings,
    COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'completed') AS completed_bookings,
    COALESCE(SUM(p.amount_cents) FILTER (WHERE p.status = 'captured'), 0) AS total_revenue_cents,
    o.created_at
FROM operators o
LEFT JOIN operator_listings ol ON o.id = ol.operator_id AND ol.deleted_at IS NULL
LEFT JOIN bookings b ON o.id = b.operator_id
LEFT JOIN payments p ON b.id = p.booking_id
GROUP BY o.id;

-- ==============================================================================
-- COMMENTS
-- ==============================================================================

COMMENT ON TABLE users IS 'Core user accounts (travelers, operators, admins)';
COMMENT ON TABLE trips IS 'User trip planning with budget tracking';
COMMENT ON TABLE trip_items IS 'Budget line items with integer-cent arithmetic';
COMMENT ON TABLE season_profiles IS 'Location-based seasonality multipliers for budgeting';
COMMENT ON TABLE operators IS 'Tourism operator organizations with KYC';
COMMENT ON TABLE operator_listings IS 'Experiences, tours, activities offered by operators';
COMMENT ON TABLE bookings IS 'Booking records with multi-provider support';
COMMENT ON TABLE payments IS 'Payment transactions via Stripe';

-- ==============================================================================
-- GRANTS (adjust based on your role structure)
-- ==============================================================================

-- Application user (read/write for most tables)
-- CREATE ROLE riz_app_user WITH LOGIN PASSWORD 'your_secure_password';
-- GRANT CONNECT ON DATABASE riz_travel TO riz_app_user;
-- GRANT USAGE ON SCHEMA public TO riz_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO riz_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO riz_app_user;

-- Read-only analytics user
-- CREATE ROLE riz_analytics_user WITH LOGIN PASSWORD 'your_secure_password';
-- GRANT CONNECT ON DATABASE riz_travel TO riz_analytics_user;
-- GRANT USAGE ON SCHEMA public TO riz_analytics_user;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO riz_analytics_user;
